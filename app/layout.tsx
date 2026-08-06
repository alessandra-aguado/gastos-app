import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";

export const metadata: Metadata = {
  title: "Mis Gastos — Ale",
  description: "Control de gastos personal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex bg-background text-foreground">
        <Nav />
        <main className="flex-1 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
