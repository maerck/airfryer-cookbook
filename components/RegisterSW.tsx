"use client";

import { useEffect } from "react";

/** Regista o service worker (/sw.js) para a app funcionar offline — só no cliente. */
export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const registar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    if (document.readyState === "complete") registar();
    else window.addEventListener("load", registar, { once: true });
    return () => window.removeEventListener("load", registar);
  }, []);

  return null;
}
