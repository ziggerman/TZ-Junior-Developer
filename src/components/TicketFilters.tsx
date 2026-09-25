"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, SlidersHorizontal, Sparkles } from "lucide-react";

interface TicketFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: "all" | "pending" | "analyzed";
  onStatusFilterChange: (status: "all" | "pending" | "analyzed") => void;
  priorityFilter: string;
  onPriorityFilterChange: (priority: string) => void;
}

const PRIORITY_OPTIONS = [
  {
    value: "all",
    label: "Усі пріоритети",
    color: "bg-zinc-400",
    ring: "ring-zinc-100",
  },
  {
    value: "високий",
    label: "Високий пріоритет",
    color: "bg-rose-500",
    ring: "ring-rose-100",
  },
  {
    value: "середній",
    label: "Середній пріоритет",
    color: "bg-amber-500",
    ring: "ring-amber-100",
  },
  {
    value: "низький",
    label: "Низький пріоритет",
    color: "bg-emerald-500",
    ring: "ring-emerald-100",
  },
];

export const TicketFilters: React.FC<TicketFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedPriority =
    PRIORITY_OPTIONS.find((opt) => opt.value === priorityFilter) || PRIORITY_OPTIONS[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 mb-6">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Пошук за клієнтом або текстом..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-zinc-200/90 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition-all placeholder:text-zinc-400"
        />
      </div>

      {/* Segmented Controls & Custom Dropdown */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Segmented Control */}
        <div className="bg-zinc-100/90 p-1 rounded-full border border-black/5 flex items-center shadow-xs">
          <button
            onClick={() => onStatusFilterChange("all")}
            className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
              statusFilter === "all"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Усі
          </button>
          <button
            onClick={() => onStatusFilterChange("pending")}
            className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
              statusFilter === "pending"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Очікують
          </button>
          <button
            onClick={() => onStatusFilterChange("analyzed")}
            className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
              statusFilter === "analyzed"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Опрацьовані
          </button>
        </div>

        {/* Custom Apple-Style Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
            className={`text-xs font-medium bg-white border py-1.5 pl-3 pr-3 rounded-full flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-xs ${
              isDropdownOpen
                ? "border-blue-500 ring-2 ring-blue-500/20 text-zinc-900"
                : "border-zinc-200/90 hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${selectedPriority.color} ring-2 ${selectedPriority.ring}`}
              />
              <span>{selectedPriority.label}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180 text-blue-600" : ""
              }`}
            />
          </button>

          {/* Floating Dropdown Popover */}
          {isDropdownOpen && (
            <div
              role="listbox"
              className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-xl border border-black/8 rounded-2xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] z-50 transform origin-top-right transition-all duration-150 animate-in fade-in-0 zoom-in-95"
            >
              <div className="px-2.5 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 mb-1">
                <SlidersHorizontal className="w-3 h-3 text-zinc-400" />
                Фільтр за пріоритетом
              </div>
              <div className="space-y-0.5">
                {PRIORITY_OPTIONS.map((option) => {
                  const isSelected = option.value === priorityFilter;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onPriorityFilterChange(option.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                        isSelected
                          ? "bg-blue-50/80 text-blue-900 font-semibold"
                          : "text-zinc-700 hover:bg-zinc-100/70 hover:text-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${option.color} ring-2 ${option.ring}`}
                        />
                        <span>{option.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
