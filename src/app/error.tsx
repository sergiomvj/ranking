'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para monitoramento (opcional)
    console.error('Render Error Captured:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 animate-pulse">
        <AlertTriangle size={40} className="text-rose-500" />
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
        Algo não correu bem na renderização
      </h2>
      
      <p className="text-zinc-400 max-w-md mb-8">
        Houve um erro técnico ao processar esta página. Isso pode ser causado por dados inválidos ou falha na conexão com o servidor.
      </p>

      {error.digest && (
        <div className="mb-8 px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
          <code className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Digest: {error.digest}
          </code>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-all active:scale-95"
        >
          <RefreshCcw size={18} />
          Tentar Novamente
        </button>
        
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all active:scale-95"
        >
          <Home size={18} />
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
