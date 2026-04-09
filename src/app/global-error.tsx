'use client';

import { Inter } from "next/font/google";
import { AlertTriangle, RefreshCcw } from 'lucide-react';

const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#060606] text-white`}>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
            <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 rotate-12">
                <AlertTriangle size={48} className="text-emerald-500 -rotate-12" />
            </div>
            
            <h1 className="text-4xl font-black mb-4 tracking-tighter">
                ERRO CRÍTICO DE SISTEMA
            </h1>
            
            <p className="text-zinc-400 max-w-md mb-10 text-lg">
                Ocorreu um erro no núcleo da interface. Tentamos isolar a falha, mas uma reinicialização do componente raiz é necessária.
            </p>

            <button
                onClick={() => reset()}
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20"
            >
                <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                Reinicializar Interface
            </button>

            {error.digest && (
                <p className="mt-12 text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
                    System Digest ID: {error.digest}
                </p>
            )}
        </div>
      </body>
    </html>
  );
}
