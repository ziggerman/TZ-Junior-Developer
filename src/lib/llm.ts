import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TicketAnalysis, LLMConfig } from "./types";

const SYSTEM_PROMPT = `Ти — висококваліфікований AI-асистент служби підтримки клієнтів.
Твоє завдання — проаналізувати вхідне звернення клієнта та надати структурований аналіз українською мовою.

Вимоги до полів у відповіді:
1. "priority": один із варіантів ("низький", "середній", "високий").
   - "високий": критичні збої, блокування доступу, фінансові втрати, витоки даних, юридичні або вкрай агресивні скарги.
   - "середній": проблеми з доставкою/оплатою, що не є критичними, технічні помилки інтерфейсу, питання середньої терміновості.
   - "низький": загальні питання, консультації щодо тарифів, відгуки, побажання.
2. "category": категорія звернення (наприклад: "оплата", "доставка", "скарга", "технічне", "інше" або інша відповідна категорія українською в один-два слова).
3. "summary": чіткий і лаконічний підсумок суті звернення РІВНО в одне речення українською мовою.
4. "draftResponse": ввічлива, тепла, професійна і структурована чернетка відповіді клієнту українською мовою від імені служби підтримки. Звертайся до клієнта на ім'я, якщо воно вказано.

Ти ПОВИНЕН повернути виключно валідний JSON-об'єкт без будь-якого зайвого тексту, у наступному форматі:
{
  "priority": "низький" | "середній" | "високий",
  "category": "оплата" | "доставка" | "скарга" | "технічне" | "інше",
  "summary": "Короткий зміст проблеми в 1 речення.",
  "draftResponse": "Текст чернетки відповіді клієнту..."
}`;

export async function analyzeTicketWithLLM(
  clientName: string,
  content: string,
  config?: LLMConfig
): Promise<TicketAnalysis> {
  const openAiKey = config?.apiKey || process.env.OPENAI_API_KEY;
  const anthropicKey = config?.apiKey || process.env.ANTHROPIC_API_KEY;
  const geminiKey = config?.apiKey || process.env.GEMINI_API_KEY;
  const groqKey = config?.apiKey || process.env.GROQ_API_KEY;

  const provider = config?.provider || detectProvider(config?.apiKey);

  const prompt = `Ім'я клієнта: ${clientName}
Текст звернення:
"${content}"

Проаналізуй це звернення згідно з інструкцією та поверни JSON.`;

  // 1. OpenAI (Default if available or requested)
  if (provider === "openai" || (openAiKey && !config?.provider)) {
    if (!openAiKey) {
      throw new Error("OpenAI API Key не налаштовано. Будь ласка, вкажіть ключ у налаштуваннях або .env файлі.");
    }
    const openai = new OpenAI({ apiKey: openAiKey });
    const response = await openai.chat.completions.create({
      model: config?.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const text = response.choices[0]?.message?.content || "{}";
    return parseAndValidateAnalysis(text);
  }

  // 2. Anthropic Claude
  if (provider === "anthropic" || anthropicKey) {
    if (!anthropicKey) {
      throw new Error("Anthropic API Key не налаштовано. Будь ласка, вкажіть ключ у налаштуваннях або .env файлі.");
    }
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const response = await anthropic.messages.create({
      model: config?.model || "claude-3-5-haiku-latest",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const block = response.content[0];
    const text = block.type === "text" ? block.text : "{}";
    return parseAndValidateAnalysis(text);
  }

  // 3. Google Gemini
  if (provider === "gemini" || geminiKey) {
    if (!geminiKey) {
      throw new Error("Gemini API Key не налаштовано. Будь ласка, вкажіть ключ у файлі .env.");
    }
    const genAI = new GoogleGenerativeAI(geminiKey);
    const candidateModels = config?.model
      ? [config.model]
      : [
          "gemini-3.5-flash-lite",
          "gemini-3.5-flash",
          "gemini-3.8-flash",
          "gemini-3.7-flash",
          "gemini-flash-latest",
          "gemini-1.5-flash",
        ];

    let lastError: unknown;
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
          systemInstruction: SYSTEM_PROMPT,
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return parseAndValidateAnalysis(text);
      } catch (err: unknown) {
        lastError = err;
        console.warn(`Model ${modelName} failed, trying next candidate if available...`, (err as Error)?.message || err);
      }
    }

    throw new Error(
      `Помилка Gemini API: ${
        lastError instanceof Error ? lastError.message : "Не вдалося згенерувати відповідь"
      }`
    );
  }

  // 4. Groq (OpenAI-compatible)
  if (provider === "groq" || groqKey) {
    if (!groqKey) {
      throw new Error("Groq API Key не налаштовано.");
    }
    const groq = new OpenAI({
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    const response = await groq.chat.completions.create({
      model: config?.model || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const text = response.choices[0]?.message?.content || "{}";
    return parseAndValidateAnalysis(text);
  }

  throw new Error(
    "Не знайдено API-ключа жодного LLM-провайдера (OpenAI, Anthropic Claude, Gemini або Groq). Вкажіть ключ у файлі .env або натисніть 'Налаштування API' у правому верхньому кутку."
  );
}

function detectProvider(key?: string): "openai" | "anthropic" | "gemini" | "groq" | undefined {
  if (!key) return undefined;
  if (key.startsWith("sk-ant-")) return "anthropic";
  if (key.startsWith("gsk_")) return "groq";
  if (key.startsWith("AIzaSy")) return "gemini";
  if (key.startsWith("sk-")) return "openai";
  return undefined;
}

function parseAndValidateAnalysis(rawText: string): TicketAnalysis {
  try {
    // Remove potential markdown code blocks if provider wrapped in ```json ... ```
    let clean = rawText.trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(clean);

    // Normalize priority
    let priority = (parsed.priority || "").toLowerCase().trim();
    if (!["низький", "середній", "високий"].includes(priority)) {
      if (priority.includes("high") || priority.includes("вис")) priority = "високий";
      else if (priority.includes("med") || priority.includes("сер")) priority = "середній";
      else priority = "низький";
    }

    // Normalize category
    const category = parsed.category || "інше";

    // Summary
    const summary = parsed.summary || "Аналіз звернення завершено.";

    // Draft response
    const draftResponse = parsed.draftResponse || "Дякуємо за звернення. Ми вже опрацьовуємо ваш запит.";

    return {
      priority: priority as "низький" | "середній" | "високий",
      category: String(category).toLowerCase().trim(),
      summary: String(summary).trim(),
      draftResponse: String(draftResponse).trim(),
    };
  } catch (error) {
    console.error("Error parsing LLM response:", rawText, error);
    throw new Error("Не вдалося розпарсити відповідь від LLM у структурований формат.");
  }
}
