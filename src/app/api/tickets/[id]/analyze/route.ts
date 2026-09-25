import { NextResponse } from "next/server";
import { dbGetTicketById, dbUpdateTicket } from "@/lib/db";
import { analyzeTicketWithLLM } from "@/lib/llm";
import { LLMConfig } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // Empty body
    }

    let ticket = await dbGetTicketById(id);

    // Fallback: if not found by ID, check if client passed content in body
    if (!ticket && body?.clientName && body?.content) {
      ticket = {
        id,
        clientName: String(body.clientName),
        content: String(body.content),
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Звернення не знайдено" },
        { status: 404 }
      );
    }

    let customConfig: LLMConfig | undefined = undefined;
    if (body?.apiKey || body?.provider || body?.model) {
      customConfig = {
        apiKey: body.apiKey as string | undefined,
        provider: body.provider as LLMConfig["provider"],
        model: body.model as string | undefined,
      };
    }

    // Call LLM
    const analysis = await analyzeTicketWithLLM(
      ticket.clientName,
      ticket.content,
      customConfig
    );

    // Update in database / store
    const updatedTicket = (await dbUpdateTicket(id, {
      status: "analyzed",
      priority: analysis.priority,
      category: analysis.category,
      summary: analysis.summary,
      draftResponse: analysis.draftResponse,
      analyzedAt: new Date().toISOString(),
    })) || {
      ...ticket,
      status: "analyzed",
      priority: analysis.priority,
      category: analysis.category,
      summary: analysis.summary,
      draftResponse: analysis.draftResponse,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      analysis,
    });
  } catch (error: unknown) {
    console.error("Error analyzing ticket:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Не вдалося виконати AI-аналіз звернення";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
