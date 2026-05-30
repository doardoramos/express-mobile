"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { formatBRL } from "@/lib/pdf";
import { STATUS_LABELS, STATUS_COLORS, type Ordem } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, DollarSign, Clock, Plus, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      const { data: perfil } = await supabase.from("perfis").select("nome").eq("id", user.id).single();
      if (perfil) setNomeUsuario(perfil.nome);

      const { data } = await supabase
        .from("ordens")
        .select("*, clientes(nome, whatsapp)")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setOrdens(data as Ordem[]);
      setLoading(false);
    }
    load();
  }, []);

  const totalReceber = ordens
    .filter((o) => o.status === "aprovado" || o.status === "em_aberto")
    .reduce((s, o) => s + o.total, 0);

  const now = new Date();
  const totalRecebidoMes = ordens
    .filter((o) => {
      if (o.status !== "pago") return false;
      const d = new Date(o.updated_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, o) => s + o.total, 0);

  const ultimas5 = ordens.slice(0, 5);

  return (
    <div className="min-h-screen bg-surface-0">
      <AppHeader
        title="OS Express"
        subtitle={nomeUsuario ? `Olá, ${nomeUsuario.split(" ")[0]} 👋` : "Dashboard"}
        right={
          <Link href="/ordens/nova" className="btn-primary py-2.5 px-4 w-auto text-sm">
            <Plus className="w-4 h-4" /> Nova OS
          </Link>
        }
      />

      <div className="page-container pt-5">
        {/* Cards de métricas */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-xs text-gray-500 font-medium">A Receber</span>
            </div>
            <p className="text-xl font-bold text-white">{formatBRL(totalReceber)}</p>
            <p className="text-xs text-gray-600 mt-0.5">em aberto + aprovados</p>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-brand-400" />
              </div>
              <span className="text-xs text-gray-500 font-medium">Recebido</span>
            </div>
            <p className="text-xl font-bold text-brand-400">{formatBRL(totalRecebidoMes)}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {format(now, "MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Total de OS */}
        <div className="card p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Total de OS</p>
              <p className="text-xs text-gray-500">todas as ordens</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-white">{ordens.length}</span>
        </div>

        {/* Últimas OS */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Últimas OS</h2>
          <Link href="/ordens" className="text-xs text-brand-400 font-medium">Ver todas →</Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-surface-4 rounded w-1/2 mb-2" />
                <div className="h-3 bg-surface-4 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : ultimas5.length === 0 ? (
          <div className="card p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-gray-600" />
            </div>
            <div>
              <p className="text-white font-semibold">Nenhuma OS ainda</p>
              <p className="text-sm text-gray-500 mt-1">Crie sua primeira ordem de serviço</p>
            </div>
            <Link href="/ordens/nova" className="btn-primary w-auto px-6 py-3 text-sm">
              <Plus className="w-4 h-4" /> Criar OS
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ultimas5.map((ordem) => (
              <Link key={ordem.id} href={`/ordens/${ordem.id}`}>
                <div className="card p-4 active:scale-[0.99] transition-transform">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-500">
                          #{String(ordem.numero).padStart(4, "0")}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[ordem.status]}`}>
                          {STATUS_LABELS[ordem.status]}
                        </span>
                      </div>
                      <p className="font-semibold text-white truncate">
                        {ordem.clientes?.nome || "—"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(ordem.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-brand-400 font-bold">{formatBRL(ordem.total)}</span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
