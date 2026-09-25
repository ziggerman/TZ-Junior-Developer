"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Trash2,
  Clock,
  Tag,
  AlertCircle,
  MessageCircle,
  FileText,
  RotateCw,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Ticket, TicketPriority } from "@/lib/types";

interface TicketCardProps {
  ticket: Ticket;
  onAnalyze: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isAnalyzing: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onAnalyze,
  onDelete,
  isAnalyzing,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopyDraft = async () => {
    if (!ticket.draftResponse) return;
    try {
      await navigator.clipboard.writeText(ticket.draftResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDelete = async () => {
    if (confirm(`Ви впевнені, що хочете видалити звернення від ${ticket.clientName}?`)) {
      setIsDeleting(true);
      await onDelete(ticket.id);
    }
  };

  const formatDate = (dateValue?: string | Date | null) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    return new Intl.DateTimeFormat("uk-UA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getPriorityBadge = (priority?: TicketPriority | null) => {
    switch (priority) {
      case "високий":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Високий пріоритет
          </span>
        );
      case "середній":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Середній пріоритет
          </span>
        );
      case "низький":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Низький пріоритет
          </span>
        );
      default:
        return null;
    }
  };

  const isAnalyzed = ticket.status === "analyzed" && ticket.summary;

  return (
    <div className="apple-card rounded-3xl p-6 relative overflow-hidden transition-all">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-200/60 flex items-center justify-center font-medium text-zinc-700 text-sm">
            {ticket.clientName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-zinc-900 text-base tracking-tight">
                {ticket.clientName}
              </h4>
              {isAnalyzed ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  AI опрацьовано
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600">
                  <Clock className="w-3 h-3" />
                  Очікує аналізу
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
              <span>{formatDate(ticket.createdAt)}</span>
              {ticket.analyzedAt && (
                <>
                  <span>•</span>
                  <span>Аналіз: {formatDate(ticket.analyzedAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Видалити звернення"
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ticket Content */}
      <div className="py-4">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
          Звернення клієнта
        </div>
        <p className="text-sm text-zinc-800 leading-relaxed bg-zinc-50/70 p-4 rounded-2xl border border-zinc-100/90 whitespace-pre-wrap font-normal">
          {ticket.content}
        </p>
      </div>

      {/* AI Analysis Section */}
      {isAnalyzed ? (
        <div className="pt-2">
          <div className="bg-gradient-to-b from-blue-50/40 to-indigo-50/20 border border-blue-100/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-xs text-blue-950 uppercase tracking-wider">
                  Результати AI-аналізу
                </span>
              </div>

              <div className="flex items-center gap-2">
                {getPriorityBadge(ticket.priority as TicketPriority)}

                {ticket.category && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                    <Tag className="w-3 h-3 text-zinc-400" />
                    {ticket.category}
                  </span>
                )}
              </div>
            </div>

            {/* Summary */}
            {ticket.summary && (
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  Короткий підсумок
                </div>
                <p className="text-sm text-zinc-900 font-medium bg-white/80 p-3 rounded-xl border border-blue-100/60 leading-snug">
                  {ticket.summary}
                </p>
              </div>
            )}

            {/* Draft Response */}
            {ticket.draftResponse && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-zinc-400" />
                    Чернетка відповіді клієнту
                  </div>
                  <button
                    onClick={handleCopyDraft}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-100/70 hover:bg-blue-200/70 rounded-full transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Скопійовано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Скопіювати відповідь</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-sm text-zinc-800 bg-white/90 p-3.5 rounded-xl border border-blue-100/60 whitespace-pre-wrap leading-relaxed">
                  {ticket.draftResponse}
                </div>
              </div>
            )}

            {/* Re-analyze option */}
            <div className="pt-1 flex items-center justify-end">
              <button
                onClick={() => onAnalyze(ticket.id)}
                disabled={isAnalyzing}
                className="text-xs text-zinc-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                <span>Оновити аналіз</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Action to Trigger AI Analysis */
        <div className="pt-2 flex items-center justify-between">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>AI-аналіз ще не проведено</span>
          </div>

          <button
            onClick={() => onAnalyze(ticket.id)}
            disabled={isAnalyzing}
            className="apple-button-primary px-5 py-2 rounded-full text-xs font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Аналізую (AI)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Аналізувати (AI)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
