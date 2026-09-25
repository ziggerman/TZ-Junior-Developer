import { NextResponse } from "next/server";
import { dbGetTickets, dbCreateTicket } from "@/lib/db";

export async function GET() {
  try {
    const tickets = await dbGetTickets();
    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { success: false, error: "Не вдалося отримати список звернень" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientName, content } = body;

    if (!clientName || !clientName.trim()) {
      return NextResponse.json(
        { success: false, error: "Ім'я клієнта є обов'язковим" },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Текст звернення є обов'язковим" },
        { status: 400 }
      );
    }

    const newTicket = await dbCreateTicket(clientName, content);

    return NextResponse.json({ success: true, ticket: newTicket }, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { success: false, error: "Не вдалося зберегти звернення" },
      { status: 500 }
    );
  }
}
