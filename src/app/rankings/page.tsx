import { getPeriodRankings } from "@/lib/actions/rankings";
import { Trophy, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function RankingsPage() {
  const { period, rankings } = await getPeriodRankings("monthly-2026-04");

  if (!period) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Nenhum ranking disponível</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Ranking Global Interagências</h2>
          <p className="text-sm text-zinc-400 mt-1">Classificação oficial baseada no score consolidado (Período: {period.code})</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-black/40 border-b border-white/10">
            <TableRow className="hover:bg-transparent border-white/10">
              <TableHead className="w-20 text-center font-bold text-zinc-300">Pos.</TableHead>
              <TableHead className="font-bold text-zinc-300">Agente</TableHead>
              <TableHead className="font-bold text-zinc-300">Time / Função</TableHead>
              <TableHead className="text-center font-bold text-zinc-300">Amostra</TableHead>
              <TableHead className="text-center font-bold text-zinc-300">Score</TableHead>
              <TableHead className="text-right font-bold text-zinc-300"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((row) => (
              <TableRow 
                key={row.id} 
                className="hover:bg-white/[0.04] transition-colors border-white/5 group cursor-pointer"
              >
                <TableCell className="text-center font-medium">
                  {row.rankPosition === 1 ? (
                    <div className="flex justify-center"><Trophy size={20} className="text-yellow-400" /></div>
                  ) : row.rankPosition === 2 ? (
                    <div className="flex justify-center"><Trophy size={20} className="text-zinc-300" /></div>
                  ) : row.rankPosition === 3 ? (
                    <div className="flex justify-center"><Trophy size={20} className="text-amber-600" /></div>
                  ) : (
                    <span className="text-zinc-500">#{row.rankPosition}</span>
                  )}
                </TableCell>
                <TableCell className="font-medium text-white">
                  <Link href={`/agents/${row.agent?.code}`} className="hover:underline underline-offset-4 flex flex-col">
                    <span>{row.agent?.displayName}</span>
                    <span className="text-xs text-zinc-500 font-normal">{row.agent?.code}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-zinc-300">ID Time: {row.agent?.owningTeamId || "Sem Squad"}</div>
                  <div className="text-xs text-zinc-500">ID Função: {row.agent?.primaryFunctionId || "Genérica"}</div>
                </TableCell>
                <TableCell className="text-center text-zinc-400">
                  {row.sampleSize}
                </TableCell>
                <TableCell className="text-center">
                  <div className={`inline-flex px-2 py-0.5 rounded text-sm font-semibold border ${
                     row.operationalBand === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                     row.operationalBand === 'yellow' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                     row.operationalBand === 'orange' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                     'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {row.scoreValue.toFixed(1)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/agents/${row.agent?.code}`} className="inline-flex items-center justify-center p-2 text-zinc-500 hover:text-white transition-colors">
                     <ChevronRight size={18} />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
