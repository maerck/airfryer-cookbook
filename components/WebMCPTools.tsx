"use client";

import { useEffect } from "react";
import { registrarFerramentasWebMCP } from "@/lib/webmcp";

/** Regista as ferramentas WebMCP (só de leitura) no navegador — invisível, só no cliente. */
export default function WebMCPTools() {
  useEffect(() => registrarFerramentasWebMCP(), []);
  return null;
}
