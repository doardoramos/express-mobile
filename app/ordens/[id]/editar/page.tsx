"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { formatBRL } from "@/lib/pdf";
import type { Servico, OsStatus, ItemOrdem } from "@/types";
import {
  ArrowLeft, Plus, Minus, Trash2,
  Loader2, Save, Search, X
} from "lucide-react";
import Link from "next/link";

interface ItemLocal {
  id?: string; // se já existe no banco
  servico_id: string | null;
  nome: string;
  valor_unit: number;
  quantidade: number;
}

const STATUS_OPTS: { value: OsStatus; label: string }[] = [
  { value: "em_aberto", label: "Em Aberto" },
  { value: "aprovado", label: "Aprovado" },
  { value: "concluido", label: "Concluído" },
  { value: "pago", label: "Pago" },
];

export default function EditarOSPage() {
  const params = useParams();
  const id = params?.id as string;

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<OsStatus>("em_aberto");
  const [itens, setItens] = useState<ItemLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [showServicos, setShowServicos] = useState(false);
  const [buscaServico, setBuscaServico] = useState("");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      const [{ data: o }, { data: s }] = await Promise.all([
        supabase.from("ordens").select("*, itens_ordem(*)").eq("id", id).single(),
        supabase.from("servicos").select("*").order("nome"),
      ]);

      if (o) {
        setDescricao(o.descricao || "");
        setStatus(o.status);
        setItens((o.itens_ordem as ItemOrdem[]).map((i) => ({
          id: i.id,
          servico_id: i.servico_id,
          nome: i.nome,
          valor_unit: i.valor_unit,
          quantidade: i.quantidade,
        })));
      }
      if (s) setServicos(s as Servico[]);
      setLoading(false);
    }
    load();
  }, [id]);

  const servicosFiltrados = servicos.filter((s) =>
    s.nome.toLowerCase().includes(buscaServico.toLowerCase())
  );
  const total = itens.reduce((s, i) => s + i.valor_unit * i.quantidade, 0);

  function adicionarServico(s: Servico) {
    setItens([...itens, { servico_id: s.id, nome: s.nome, valor_unit: s.valor, quantidade: 1 }]);
    setShowServicos(false);
    setBuscaServico("");
  }

  function ajustarQtd(idx: number, delta: number) {
    const novos = [...itens];
    novos[idx].quantidade = Math.max(1, novos[idx].quantidade + delta);
    setItens(novos);
  }

  function removerItem(idx: number) {
    setItens(itens.filter((_, i) => i !== idx));
  }

  async function salvar() {
    setSalvando(true);

    // 1. Atualiza a ordem
    await supabase.from("ordens").update({ descricao: descricao || null, status }).eq("id", id);

    // 2. Remove todos os itens antigos e reinsere (forma mais simples para MVP)
    await supabase.from("itens_ordem").delete().eq("ordem_id", id);
    if (itens.length > 0) {
      await supabase.from("itens_ordem").insert(
        itens.map((i) => ({
          ordem_id: id,
          servico_id: i.servico_id,
          nome: i.nome,
          valor_unit: i.valor_unit,
          quantidade: i.quantidade,
        }))
      );
    }

    router.push(`/ordens/${id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <AppHeader
        title="Editar OS"
        right={
          <Link href={`/ordens/${id}`} className="btn-ghost">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        }
      />

      <div className="page-container pt-4 flex flex-col gap-5">
        {/* Descrição */}
        <div>
          <label className="label">Descrição / Observação</label>
          <textarea className="input resize-none h-20" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>

        {/* Status */}
        <div>
          <label className="label">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTS.map((s) => (
              <button key={s.value} onClick={() => setStatus(s.value)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  status === s.value ? "bg-brand-500/20 border-brand-500 text-brand-400" : "bg-surface-2 border-surface-border text-gray-500"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Itens */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="label mb-0">Itens</label>
            <button onClick={() => setShowServicos(true)} className="flex items-center gap-1.5 text-sm font-medium text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-lg">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {itens.map((item, idx) => (
              <div key={idx} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-semibold text-white flex-1 pr-2">{item.nome}</p>
                  <button onClick={() => removerItem(idx)} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0 bg-surface-3 rounded-xl overflow-hidden border border-surface-border">
                    <button onClick={() => ajustarQtd(idx, -1)} className="w-12 h-12 flex items-center justify-center text-white"><Minus className="w-4 h-4" /></button>
                    <span className="w-10 text-center font-bold text-white text-lg">{item.quantidade}</span>
                    <button onClick={() => ajustarQtd(idx, 1)} className="w-12 h-12 flex items-center justify-center text-white"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatBRL(item.valor_unit)} × {item.quantidade}</p>
                    <p className="text-brand-400 font-bold text-lg">{formatBRL(item.valor_unit * item.quantidade)}</p>
                  </div>
                </div>
              </div>
            ))}
            {itens.length > 0 && (
              <div className="card p-4 bg-surface-3 flex items-center justify-between">
                <span className="text-gray-400 font-semibold">Total</span>
                <span className="text-2xl font-bold text-brand-400">{formatBRL(total)}</span>
              </div>
            )}
          </div>
        </div>

        <button onClick={salvar} className="btn-primary" disabled={salvando}>
          {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Alterações</>}
        </button>
      </div>

      {showServicos && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-1 border-t border-surface-border rounded-t-3xl p-5 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Adicionar Serviço</h2>
              <button onClick={() => setShowServicos(false)} className="btn-ghost p-2"><X className="w-5 h-5" /></button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input className="input pl-10" placeholder="Buscar..." value={buscaServico} onChange={(e) => setBuscaServico(e.target.value)} autoFocus />
            </div>
            <div className="overflow-y-auto flex flex-col gap-2 pb-4">
              {servicosFiltrados.map((s) => (
                <button key={s.id} onClick={() => adicionarServico(s)} className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-surface-border active:bg-surface-3">
                  <p className="font-medium text-white text-left">{s.nome}</p>
                  <span className="text-brand-400 font-bold shrink-0 ml-3">{formatBRL(s.valor)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
