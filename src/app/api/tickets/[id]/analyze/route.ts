import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeTicketWithLLM } from "@/lib/llm";
import { LLMConfig } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Звернення не знайдено" },
        { status: 404 }
      );
    }

    let customConfig: LLMConfig | undefined = undefined;
    try {
      const body = await request.json();
      if (body?.apiKey || body?.provider || body?.model) {
        customConfig = {
          apiKey: body.apiKey,
          provider: body.provider,
          model: body.model,
        };
      }
    } catch {
      // Empty body is fine, will fallback to env variables
    }

    // Call LLM
    const analysis = await analyzeTicketWithLLM(
      ticket.clientName,
      ticket.content,
      customConfig
    );

    // Save analysis to database
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: "analyzed",
        priority: analysis.priority,
        category: analysis.category,
        summary: analysis.summary,
        draftResponse: analysis.draftResponse,
        analyzedAt: new Date(),
      },
    });

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
