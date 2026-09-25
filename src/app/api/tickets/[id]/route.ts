import { NextResponse } from "next/server";
import { dbGetTicketById, dbDeleteTicket } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticket = await dbGetTicketById(id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Звернення не знайдено" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { success: false, error: "Помилка при отриманні звернення" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbDeleteTicket(id);

    return NextResponse.json({ success: true, message: "Звернення видалено" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { success: false, error: "Не вдалося видалити звернення" },
      { status: 500 }
    );
  }
}
