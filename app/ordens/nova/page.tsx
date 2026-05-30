"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { formatBRL } from "@/lib/pdf";
import type { Cliente, Servico, OsStatus } from "@/types";
import {
  ArrowLeft, Plus, Minus, Trash2, ChevronDown,
  Loader2, Save, Search, X
} from "lucide-react";
import Link from "next/link";

interface ItemLocal {
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

export default function NovaOSPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<OsStatus>("em_aberto");
  const [itens, setItens] = useState<ItemLocal[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [showClientes, setShowClientes] = useState(false);
  const [showServicos, setShowServicos] = useState(false);
  const [buscaServico, setBuscaServico] = useState("");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from("clientes").select("*").order("nome"),
        supabase.from("servicos").select("*").order("nome"),
      ]);
      if (c) setClientes(c as Cliente[]);
      if (s) setServicos(s as Servico[]);
    }
    load();
  }, []);

  const clienteSelecionado = clientes.find((c) => c.id === clienteId);
  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase())
  );
  const servicosFiltrados = servicos.filter((s) =>
    s.nome.toLowerCase().includes(buscaServico.toLowerCase())
  );
  const total = itens.reduce((s, i) => s + i.valor_unit * i.quantidade, 0);

  function adicionarServico(s: Servico) {
    const existe = itens.findIndex((i) => i.servico_id === s.id);
    if (existe >= 0) {
      const novos = [...itens];
      novos[existe].quantidade += 1;
      setItens(novos);
    } else {
      setItens([...itens, { servico_id: s.id, nome: s.nome, valor_unit: s.valor, quantidade: 1 }]);
    }
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
    if (!clienteId) { alert("Selecione um cliente"); return; }
    if (itens.length === 0) { alert("Adicione pelo menos um serviço"); return; }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: ordem, error } = await supabase
      .from("ordens")
      .insert({ user_id: user.id, cliente_id: clienteId, descricao: descricao || null, status })
      .select()
      .single();

    if (error || !ordem) { alert("Erro ao criar OS"); setLoading(false); return; }

    const itensPayload = itens.map((i) => ({
      ordem_id: ordem.id,
      servico_id: i.servico_id,
      nome: i.nome,
      valor_unit: i.valor_unit,
      quantidade: i.quantidade,
    }));

    await supabase.from("itens_ordem").insert(itensPayload);
    router.push(`/ordens/${ordem.id}`);
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <AppHeader
        title="Nova OS"
        right={
          <Link href="/ordens" className="btn-ghost">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        }
      />

      <div className="page-container pt-4 flex flex-col gap-5">

        {/* ── Cliente */}
        <div>
          <label className="label">Cliente *</label>
          {clienteSelecionado ? (
            <div className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{clienteSelecionado.nome}</p>
                <p className="text-sm text-gray-500">{clienteSelecionado.whatsapp}</p>
              </div>
              <button onClick={() => setClienteId("")} className="btn-ghost p-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClientes(true)}
              className="input flex items-center justify-between text-gray-500"
            >
              Selecionar cliente
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Descrição */}
        <div>
          <label className="label">Descrição / Observação</label>
          <textarea
            className="input resize-none h-20"
            placeholder="Ex: Trocar instalação do banheiro..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        {/* ── Status */}
        <div>
          <label className="label">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  status === s.value
                    ? "bg-brand-500/20 border-brand-500 text-brand-400"
                    : "bg-surface-2 border-surface-border text-gray-500"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Itens */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="label mb-0">Serviços / Itens *</label>
            <button
              onClick={() => setShowServicos(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>

          {itens.length === 0 ? (
            <button
              onClick={() => setShowServicos(true)}
              className="w-full card p-6 flex flex-col items-center gap-3 text-gray-500 border-dashed"
            >
              <Plus className="w-8 h-8 text-gray-700" />
              <span className="text-sm">Toque para adicionar serviços</span>
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              {itens.map((item, idx) => (
                <div key={idx} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-semibold text-white flex-1 pr-2">{item.nome}</p>
                    <button onClick={() => removerItem(idx)} className="text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    {/* Controle de quantidade — botões grandes para dedo */}
                    <div className="flex items-center gap-0 bg-surface-3 rounded-xl overflow-hidden border border-surface-border">
                      <button
                        onClick={() => ajustarQtd(idx, -1)}
                        className="w-12 h-12 flex items-center justify-center text-white active:bg-surface-4"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-bold text-white text-lg">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => ajustarQtd(idx, 1)}
                        className="w-12 h-12 flex items-center justify-center text-white active:bg-surface-4"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatBRL(item.valor_unit)} × {item.quantidade}</p>
                      <p className="text-brand-400 font-bold text-lg">
                        {formatBRL(item.valor_unit * item.quantidade)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="card p-4 bg-surface-3 flex items-center justify-between">
                <span className="text-gray-400 font-semibold">Total</span>
                <span className="text-2xl font-bold text-brand-400">{formatBRL(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Salvar */}
        <button onClick={salvar} className="btn-primary" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar OS</>}
        </button>
      </div>

      {/* ── Modal: Selecionar Cliente */}
      {showClientes && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-1 border-t border-surface-border rounded-t-3xl p-5 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Selecionar Cliente</h2>
              <button onClick={() => setShowClientes(false)} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input className="input pl-10" placeholder="Buscar..." value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} />
            </div>
            <div className="overflow-y-auto flex flex-col gap-2 pb-4">
              <Link
                href="/clientes/novo"
                className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Cadastrar novo cliente</span>
              </Link>
              {clientesFiltrados.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setClienteId(c.id); setShowClientes(false); }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-surface-border active:bg-surface-3 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center shrink-0">
                    <span className="font-bold text-brand-400">{c.nome.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{c.nome}</p>
                    <p className="text-sm text-gray-500">{c.whatsapp}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Selecionar Serviço */}
      {showServicos && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-1 border-t border-surface-border rounded-t-3xl p-5 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Adicionar Serviço</h2>
              <button onClick={() => setShowServicos(false)} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input className="input pl-10" placeholder="Buscar serviço..." value={buscaServico} onChange={(e) => setBuscaServico(e.target.value)} autoFocus />
            </div>
            <div className="overflow-y-auto flex flex-col gap-2 pb-4">
              <Link
                href="/servicos"
                className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Cadastrar novo serviço</span>
              </Link>
              {servicosFiltrados.map((s) => (
                <button
                  key={s.id}
                  onClick={() => adicionarServico(s)}
                  className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-surface-border active:bg-surface-3"
                >
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
