"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { t as translate, type Lang, type StringKey } from "@/lib/i18n";

type LangApi = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
};

const LangContext = createContext<LangApi | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  // Mémorise la langue choisie sur l'appareil (persiste entre les pages).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("menuvid:lang");
      if (saved === "en" || saved === "fr") setLangState(saved);
    } catch {}
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem("menuvid:lang", l);
    } catch {}
  }

  return (
    <LangContext.Provider
      value={{ lang, setLang, t: (key) => translate(lang, key) }}
    >
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangApi {
  const ctx = useContext(LangContext);
  // Repli : hors provider, on reste en français.
  if (!ctx) return { lang: "fr", setLang: () => {}, t: (k) => translate("fr", k) };
  return ctx;
}
