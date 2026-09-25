"use client";

import React from "react";
import { Ticket } from "@/lib/types";
import { Inbox, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface StatsOverviewProps {
  tickets: Ticket[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ tickets }) => {
  const total = tickets.length;
  const pending = tickets.filter((t) => t.status !== "analyzed").length;
  const highPriority = tickets.filter((t) => t.priority === "високий").length;
  const analyzed = tickets.filter((t) => t.status === "analyzed").length;

  const stats = [
    {
      label: "Всього звернень",
      value: total,
      icon: Inbox,
      color: "text-zinc-900",
      bg: "bg-zinc-100",
    },
    {
      label: "Очікують аналізу",
      value: pending,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Високий пріоритет",
      value: highPriority,
      icon: AlertTriangle,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "AI опрацьовано",
      value: analyzed,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="apple-card rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">{item.label}</p>
              <p className="text-2xl font-bold tracking-tight text-zinc-900">{item.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
