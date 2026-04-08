import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Agent Efficiency Hub",
  description: "Monitoramento e Gamificação de Agentes Virtuais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="font-sans min-h-screen bg-[#060606] text-zinc-100 flex overflow-hidden selection:bg-emerald-500/30" suppressHydrationWarning>
        <AppSidebar />
        <div className="flex-1 md:ml-64 flex flex-col h-screen relative bg-black/40">
          <div className="absolute top-0 right-0 w-[800px] h-[500px] bg-gradient-to-bl from-emerald-500/20 via-cyan-500/5 to-transparent pointer-events-none -z-10 blur-[120px] opacity-60 rounded-full" />
          
          <AppHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden pt-6 px-4 pb-12 sm:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
               {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
