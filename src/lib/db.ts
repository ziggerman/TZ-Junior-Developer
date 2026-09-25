import { getPrisma } from "./prisma";
import { Ticket } from "./types";
import fs from "fs";
import path from "path";

// Resilient fallback storage for serverless environments (Vercel)
const FALLBACK_FILE = path.join("/tmp", "tickets_store.json");
const DELETED_FILE = path.join("/tmp", "deleted_tickets.json");

let memoryTickets: Ticket[] = [];
let deletedIdsSet = new Set<string>();

function loadDeletedIds(): Set<string> {
  try {
    if (fs.existsSync(DELETED_FILE)) {
      const data = fs.readFileSync(DELETED_FILE, "utf-8");
      deletedIdsSet = new Set(JSON.parse(data));
    }
  } catch (e) {
    console.warn("Could not read deleted IDs:", e);
  }
  return deletedIdsSet;
}

function saveDeletedId(id: string) {
  deletedIdsSet.add(id);
  try {
    fs.writeFileSync(DELETED_FILE, JSON.stringify(Array.from(deletedIdsSet)), "utf-8");
  } catch (e) {
    console.warn("Could not write deleted IDs:", e);
  }
}

function loadFallbackTickets(): Ticket[] {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, "utf-8");
      memoryTickets = JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not read fallback storage:", e);
  }
  return memoryTickets;
}

function saveFallbackTickets(tickets: Ticket[]) {
  memoryTickets = tickets;
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(tickets, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write to fallback storage:", e);
  }
}

export async function dbGetTickets(): Promise<Ticket[]> {
  const deletedIds = loadDeletedIds();
  const prisma = getPrisma();
  if (prisma) {
    try {
      const tickets = await prisma.ticket.findMany({
        where: deletedIds.size > 0 ? { id: { notIn: Array.from(deletedIds) } } : undefined,
        orderBy: { createdAt: "desc" },
      });
      return tickets.filter((t) => !deletedIds.has(t.id)) as unknown as Ticket[];
    } catch (error) {
      console.warn("Prisma findMany failed, falling back to memory store:", error);
    }
  }

  return loadFallbackTickets()
    .filter((t) => !deletedIds.has(t.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function dbCreateTicket(clientName: string, content: string): Promise<Ticket> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const ticket = await prisma.ticket.create({
        data: {
          clientName: clientName.trim(),
          content: content.trim(),
          status: "pending",
        },
      });
      return ticket as unknown as Ticket;
    } catch (error) {
      console.warn("Prisma create failed, falling back to memory store:", error);
    }
  }

  const tickets = loadFallbackTickets();
  const newTicket: Ticket = {
    id: "t_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    clientName: clientName.trim(),
    content: content.trim(),
    status: "pending",
    priority: null,
    category: null,
    summary: null,
    draftResponse: null,
    analyzedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tickets.unshift(newTicket);
  saveFallbackTickets(tickets);
  return newTicket;
}

export async function dbGetTicketById(id: string): Promise<Ticket | null> {
  const deletedIds = loadDeletedIds();
  if (deletedIds.has(id)) return null;

  const prisma = getPrisma();
  if (prisma) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
      });
      if (ticket) return ticket as unknown as Ticket;
    } catch (error) {
      console.warn("Prisma findUnique failed, falling back to memory store:", error);
    }
  }

  const tickets = loadFallbackTickets();
  return tickets.find((t) => t.id === id) || null;
}

export async function dbUpdateTicket(
  id: string,
  data: Partial<Ticket>
): Promise<Ticket | null> {
  const deletedIds = loadDeletedIds();
  if (deletedIds.has(id)) return null;

  const prisma = getPrisma();
  if (prisma) {
    try {
      const updated = await prisma.ticket.update({
        where: { id },
        data: {
          status: data.status,
          priority: data.priority,
          category: data.category,
          summary: data.summary,
          draftResponse: data.draftResponse,
          analyzedAt: data.analyzedAt ? new Date(data.analyzedAt) : new Date(),
        },
      });
      return updated as unknown as Ticket;
    } catch (error) {
      console.warn("Prisma update failed, falling back to memory store:", error);
    }
  }

  const tickets = loadFallbackTickets();
  const index = tickets.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const current = tickets[index];
  const updated: Ticket = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  tickets[index] = updated;
  saveFallbackTickets(tickets);
  return updated;
}

export async function dbDeleteTicket(id: string): Promise<boolean> {
  saveDeletedId(id);

  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.ticket.delete({
        where: { id },
      });
    } catch (error) {
      console.warn("Prisma delete failed, falling back to memory store:", error);
    }
  }

  const tickets = loadFallbackTickets();
  const filtered = tickets.filter((t) => t.id !== id);
  saveFallbackTickets(filtered);
  return true;
}
