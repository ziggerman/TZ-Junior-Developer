"use client";

import React from "react";
import { Plus } from "lucide-react";

interface HeaderProps {
  onOpenCreate: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCreate }) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-black/[0.06] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white border border-zinc-200/90 shadow-[0_1px_4px_rgba(0,0,0,0.05)] flex items-center justify-center relative">
            <span className="text-xs font-bold tracking-tight text-zinc-900">
              S<span className="text-[#0071e3]">D</span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-zinc-900 tracking-tight">
                SupportDesk <span className="text-[#0071e3] font-normal">AI</span>
              </h1>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Інтелектуальна обробка звернень
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Create ticket primary button */}
          <button
            onClick={onOpenCreate}
            className="apple-button-primary px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Додати звернення</span>
          </button>
        </div>
      </div>
    </header>
  );
};
