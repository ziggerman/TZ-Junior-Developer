import { NextResponse } from "next/server";
import { dbCreateTicket, dbGetTickets } from "@/lib/db";

const SAMPLE_TICKETS = [
  {
    clientName: "Олена Коваленко",
    content: "Добрий день! З моєї картки двічі списалися кошти за замовлення #48921 (сума 1850 грн), але в кабінеті статус 'Очікує оплати'. Будь ласка, терміново поверніть подвійне списання!",
  },
  {
    clientName: "Максим Шевченко",
    content: "Вітаю. Замовляв ноутбук із доставкою кур'єром на вчора, але ніхто не приїхав і не попередив. ТТН 20450891238910. Коли очікувати доставку?",
  },
];

export async function POST() {
  try {
    for (const sample of SAMPLE_TICKETS) {
      await dbCreateTicket(sample.clientName, sample.content);
    }

    const tickets = await dbGetTickets();
    return NextResponse.json({ success: true, count: SAMPLE_TICKETS.length, tickets });
  } catch (error) {
    console.error("Error seeding tickets:", error);
    return NextResponse.json(
      { success: false, error: "Не вдалося завантажити демо-дані" },
      { status: 500 }
    );
  }
}
