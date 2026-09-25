"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Header } from "@/components/Header";
import { StatsOverview } from "@/components/StatsOverview";
import { TicketFilters } from "@/components/TicketFilters";
import { TicketCard } from "@/components/TicketCard";
import { CreateTicketModal } from "@/components/CreateTicketModal";
import { Ticket } from "@/lib/types";
import { Plus, Inbox, AlertCircle, CheckCircle2, X } from "lucide-react";

const STORAGE_KEY = "sd_support_tickets_v1";
const DELETED_STORAGE_KEY = "sd_deleted_tickets_v1";

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "analyzed">("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const getDeletedIds = (): Set<string> => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem(DELETED_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  };

  const addDeletedId = (id: string) => {
    if (typeof window === "undefined") return;
    try {
      const current = getDeletedIds();
      current.add(id);
      localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(Array.from(current)));
    } catch {
      // Ignore
    }
  };

  const saveToLocal = (updated: Ticket[]) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save to localStorage:", e);
      }
    }
  };

  const fetchTickets = async () => {
    const deletedIds = getDeletedIds();
    let localTickets: Ticket[] = [];
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          localTickets = (JSON.parse(saved) as Ticket[]).filter((t) => !deletedIds.has(t.id));
        }
      } catch {
        // Ignore
      }
    }

    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        const validServerTickets = (data.tickets as Ticket[]).filter(
          (t) => !deletedIds.has(t.id)
        );

        const map = new Map<string, Ticket>();
        for (const t of localTickets) map.set(t.id, t);
        for (const t of validServerTickets) map.set(t.id, t);

        const merged = Array.from(map.values())
          .filter((t) => !deletedIds.has(t.id))
          .sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        setTickets(merged);
        saveToLocal(merged);
      } else {
        setTickets(localTickets);
      }
    } catch {
      setTickets(localTickets);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets((prev) => {
      const updated = [newTicket, ...prev.filter((t) => t.id !== newTicket.id)];
      saveToLocal(updated);
      return updated;
    });
    showToast("Звернення успішно збережено!", "success");
  };

  const handleAnalyzeTicket = async (ticketId: string) => {
    const currentTicket = tickets.find((t) => t.id === ticketId);
    if (!currentTicket) return;

    setAnalyzingIds((prev) => ({ ...prev, [ticketId]: true }));
    try {
      const res = await fetch(`/api/tickets/${ticketId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: currentTicket.clientName,
          content: currentTicket.content,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Помилка при аналізі звернення");
      }

      // Update ticket locally and in storage
      setTickets((prev) => {
        const updated = prev.map((t) => (t.id === ticketId ? data.ticket : t));
        saveToLocal(updated);
        return updated;
      });
      showToast("Звернення успішно проаналізовано AI!", "success");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Не вдалося виконати аналіз";
      showToast(msg, "error");
    } finally {
      setAnalyzingIds((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    // 1. Permanently record as deleted
    addDeletedId(ticketId);

    // 2. Remove from state and localStorage immediately
    setTickets((prev) => {
      const updated = prev.filter((t) => t.id !== ticketId);
      saveToLocal(updated);
      return updated;
    });

    // 3. Notify server
    try {
      await fetch(`/api/tickets/${ticketId}`, { method: "DELETE" });
    } catch {
      // Handled gracefully
    }

    showToast("Звернення видалено", "success");
  };

  // Filter and search logic
  const filteredTickets = tickets.filter((ticket) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchClient = ticket.clientName.toLowerCase().includes(q);
      const matchContent = ticket.content.toLowerCase().includes(q);
      const matchCategory = ticket.category?.toLowerCase().includes(q);
      const matchSummary = ticket.summary?.toLowerCase().includes(q);
      if (!matchClient && !matchContent && !matchCategory && !matchSummary) {
        return false;
      }
    }

    if (statusFilter === "pending" && ticket.status === "analyzed") return false;
    if (statusFilter === "analyzed" && ticket.status !== "analyzed") return false;

    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;

    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfd]">
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900 text-white shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-medium max-w-xs">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-zinc-400 hover:text-white p-0.5 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <Header onOpenCreate={() => setIsCreateOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Page Hero Title */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-1.5">
            AI-обробка звернень
          </h2>
          <p className="text-sm text-zinc-500 max-w-2xl">
            Внутрішній інструмент служби підтримки для автоматичного аналізу звернень, визначення пріоритетів та підготовки відповідей.
          </p>
        </div>

        {/* Stats Counter Cards */}
        <StatsOverview tickets={tickets} />

        {/* Filters and Search Bar with Custom Dropdown */}
        <TicketFilters
          searchQuery={searchQuery}
          onSearchChange={(q) => startTransition(() => setSearchQuery(q))}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
        />

        {/* Tickets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="apple-card rounded-3xl p-6 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-200 rounded-2xl" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-zinc-200 rounded w-1/3" />
                    <div className="h-3 bg-zinc-100 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-16 bg-zinc-100 rounded-2xl" />
                <div className="h-8 bg-zinc-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onAnalyze={handleAnalyzeTicket}
                onDelete={handleDeleteTicket}
                isAnalyzing={Boolean(analyzingIds[ticket.id])}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="apple-card rounded-3xl p-12 text-center max-w-md mx-auto my-8">
            <div className="w-14 h-14 rounded-3xl bg-zinc-100 flex items-center justify-center mx-auto mb-4 text-zinc-400">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 mb-1">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                ? "Звернень не знайдено"
                : "Список звернень порожній"}
            </h3>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                ? "Спробуйте змінити пошуковий запит або скинути фільтри."
                : "Додайте перше звернення клієнта для аналізу."}
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="apple-button-primary px-5 py-2 rounded-full text-xs font-medium inline-flex items-center gap-1.5 shadow-sm mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Додати звернення</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-black/[0.04] py-6 text-center text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI-обробка звернень для служби підтримки</span>
          <span className="text-zinc-400">Next.js • TypeScript • Tailwind CSS • Prisma</span>
        </div>
      </footer>

      {/* Create Modal */}
      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleTicketCreated}
      />
    </div>
  );
}
