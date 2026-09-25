"use client";

import React, { useState, useEffect } from "react";
import { Key, X, Check, ShieldCheck, Sparkles } from "lucide-react";
import { LLMProvider } from "@/lib/types";

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [provider, setProvider] = useState<LLMProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [isSavedLocally, setIsSavedLocally] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedProvider = (localStorage.getItem("ai_provider") as LLMProvider) || "openai";
      const savedKey = localStorage.getItem("ai_api_key") || "";
      const savedModel = localStorage.getItem("ai_model") || "";
      setProvider(savedProvider);
      setApiKey(savedKey);
      setModel(savedModel);
      setIsSavedLocally(Boolean(savedKey));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== "undefined") {
      if (apiKey.trim()) {
        localStorage.setItem("ai_api_key", apiKey.trim());
        localStorage.setItem("ai_provider", provider);
        if (model.trim()) localStorage.setItem("ai_model", model.trim());
        else localStorage.removeItem("ai_model");
        setIsSavedLocally(true);
      } else {
        localStorage.removeItem("ai_api_key");
        localStorage.removeItem("ai_provider");
        localStorage.removeItem("ai_model");
        setIsSavedLocally(false);
      }
    }
    onSaved();
    onClose();
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ai_api_key");
      localStorage.removeItem("ai_provider");
      localStorage.removeItem("ai_model");
      setApiKey("");
      setModel("");
      setIsSavedLocally(false);
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 tracking-tight">Налаштування AI</h3>
              <p className="text-xs text-zinc-500">Виберіть провайдера або свій ключ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-3.5 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-900 leading-relaxed">
              Якщо API-ключ уже заданий на сервері в <code className="font-semibold text-blue-950">.env</code> (наприклад, для Vercel), залишати це поле пустим — система автоматично використає серверний ключ.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
              LLM Провайдер
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "openai", label: "OpenAI", desc: "GPT-4o mini" },
                { id: "anthropic", label: "Claude", desc: "Haiku 3.5" },
                { id: "gemini", label: "Gemini", desc: "1.5 Flash" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setProvider(item.id as LLMProvider)}
                  className={`p-2.5 text-left rounded-2xl border transition-all ${
                    provider === item.id
                      ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-600/20"
                      : "border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-white"
                  }`}
                >
                  <div className="font-medium text-xs">{item.label}</div>
                  <div className="text-[10px] text-zinc-500">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
              API Ключ
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                provider === "openai"
                  ? "sk-..."
                  : provider === "anthropic"
                  ? "sk-ant-..."
                  : "AIzaSy..."
              }
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Зберігається локально у вашому браузері (localStorage)
            </p>
          </div>

          {isSavedLocally && (
            <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Ключ збережено в браузері</span>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-600 hover:underline"
              >
                Видалити
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-zinc-50/80 border-t border-black/5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 font-medium transition-colors"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full transition-all shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
};
