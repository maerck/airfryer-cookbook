"use client";

import { useEffect } from "react";

interface ComModelContext {
  modelContext?: { registerTool?: unknown };
}

function temWebMCP(): boolean {
  return (
    typeof (document as Document & ComModelContext).modelContext?.registerTool === "function" ||
    typeof (navigator as Navigator & ComModelContext).modelContext?.registerTool === "function"
  );
}

/**
 * Regista as ferramentas WebMCP (só de leitura) no navegador — invisível, só no cliente.
 * `lib/webmcp` traz o dataset completo, por isso só é descarregado quando o navegador tem WebMCP.
 */
export default function WebMCPTools() {
  useEffect(() => {
    if (!temWebMCP()) return;
    let cancelado = false;
    let unregister: (() => void) | undefined;
    import("@/lib/webmcp")
      .then((m) => {
        if (!cancelado) unregister = m.registrarFerramentasWebMCP();
      })
      .catch((erro: unknown) => console.error("[webmcp] não foi possível carregar:", erro));
    return () => {
      cancelado = true;
      unregister?.();
    };
  }, []);
  return null;
}
