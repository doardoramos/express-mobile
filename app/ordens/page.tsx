"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { formatBRL } from "@/lib/pdf";
import { STATUS_LABELS, STATUS_COLORS, type Ordem, type OsStatus } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, FileText, ChevronRight } from "lucide-react";

const FILTROS: { value: OsStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todas" },
  { value: "em_aberto", label: "Em Aberto" },
  { value: "aprovado", label: "Aprovados" },
  { value: "concluido", label: "Concluídos" },
  { value: "pago", label: "Pagos" },
];

export default function OrdensPage() {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [filtro, setFiltro] = useState<OsStatus | "todos">("todos");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      const { data } = await supabase
        .from("ordens")
        .select("*, clientes(nome)")
        .order("created_at", { ascending: false });
      if (data) setOrdens(data as Ordem[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtradas = filtro === "todos" ? ordens : ordens.filter((o) => o.status === filtro);

  return (
    <div className="min-h-screen bg-surface-0">
      <AppHeader
        title="Ordens de Serviço"
        subtitle={`${ordens.length} total`}
        right={
          <Link href="/ordens/nova" className="btn-primary py-2.5 px-4 w-auto text-sm">
            <Plus className="w-4 h-4" /> Nova OS
          </Link>
        }
      />

      <div className="page-container pt-4">
        {/* Filtros de status */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                filtro === f.value
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-surface-2 text-gray-400 border-surface-border hover:border-gray-500"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-surface-4 rounded w-1/2 mb-2" />
                <div className="h-3 bg-surface-4 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtradas.length === 0 ? (
          <div className="card p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center">
              <FileText className="w-7 h-7 text-gray-600" />
            </div>
            <div>
              <p className="text-white font-semibold">Nenhuma OS aqui</p>
              <p className="text-sm text-gray-500 mt-1">Crie uma nova ordem de serviço</p>
            </div>
            <Link href="/ordens/nova" className="btn-primary w-auto px-6 py-3 text-sm">
              <Plus className="w-4 h-4" /> Nova OS
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtradas.map((ordem) => (
              <Link key={ordem.id} href={`/ordens/${ordem.id}`}>
                <div className="card p-4 active:scale-[0.99] transition-transform">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono text-gray-500 font-medium">
                          #{String(ordem.numero).padStart(4, "0")}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[ordem.status]}`}>
                          {STATUS_LABELS[ordem.status]}
                        </span>
                      </div>
                      <p className="font-semibold text-white truncate text-base">
                        {ordem.clientes?.nome || "—"}
                      </p>
                      {ordem.descricao && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{ordem.descricao}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-1">
                        {format(new Date(ordem.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-brand-400 font-bold text-lg">{formatBRL(ordem.total)}</span>
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
