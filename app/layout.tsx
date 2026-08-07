import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import DecimalesProvider from "./components/DecimalesProvider";
import { getSettings } from "@/lib/queries";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "miga — Ale",
  description: "Control de gastos personal",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const decimales = settings?.decimales ?? 0;

  return (
    <html lang="es" className={`h-full antialiased ${inter.variable}`}>
      <body className="min-h-full flex bg-background text-foreground font-sans">
        <DecimalesProvider decimales={decimales}>
          <Nav />
          <main className="flex-1 min-h-screen">{children}</main>
        </DecimalesProvider>
      </body>
    </html>
  );
}
