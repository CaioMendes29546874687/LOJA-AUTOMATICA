import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Loja Automática", description: "Loja online — versão inicial de demonstração" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
