import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SAMPLE_TICKETS = [
  {
    clientName: "Олена Коваленко",
    content: "Добрий день! З моєї картки двічі списалися кошти за замовлення #48921 (сума 1850 грн), але в кабінеті статус 'Очікує оплати'. Будь ласка, терміново поверніть подвійне списання!",
  },
  {
    clientName: "Максим Шевченко",
    content: "Вітаю. Замовляв ноутбук із доставкою кур'єром на вчора, але ніхто не приїхав і не попередив. ТТН 20450891238910. Коли очікувати доставку?",
  },
  {
    clientName: "Ірина Мельник",
    content: "Добрий вечір! Чи планується у вас найближчим часом інтеграція з Apple Pay для юридичних осіб? Хочемо перейти на ваш сервіс.",
  },
  {
    clientName: "Андрій Бондаренко",
    content: "Сайт повністю зависає при спробі експортувати звіт у форматі PDF у розділі аналітики. Помилка 500. У нас зупинився робочий процес!",
  },
];

export async function POST() {
  try {
    for (const sample of SAMPLE_TICKETS) {
      await prisma.ticket.create({
        data: {
          clientName: sample.clientName,
          content: sample.content,
          status: "pending",
        },
      });
    }

    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, count: SAMPLE_TICKETS.length, tickets });
  } catch (error) {
    console.error("Error seeding tickets:", error);
    return NextResponse.json(
      { success: false, error: "Не вдалося завантажити демо-дані" },
      { status: 500 }
    );
  }
}
