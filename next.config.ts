import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança para todas as respostas. O 'unsafe-inline' em script-src é
 * inevitável aqui: o HTML estático do Next arranca com scripts inline (payload de
 * flight + injeção de tema) e não há middleware para nonces. Sem sinks de XSS
 * (todo o conteúdo é JSX escapado), o CSP funciona como camada de defesa adicional.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'", // Tailwind/next-themes injetam estilos inline
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
