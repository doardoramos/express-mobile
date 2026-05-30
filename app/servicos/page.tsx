"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { formatBRL } from "@/lib/pdf";
import type { Servico } from "@/types";
import { Plus, Wrench, Pencil, Trash2, X, Save, Loader2 } from "lucide-react";

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Servico | null>(null);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth"); return; }
    const { data } = await supabase.from("servicos").select("*").order("nome");
    if (data) setServicos(data as Servico[]);
    setLoading(false);
  }

  function abrirForm(s?: Servico) {
    setEditando(s || null);
    setNome(s?.nome || "");
    setValor(s ? String(s.valor) : "");
    setShowForm(true);
  }

  function fecharForm() {
    setShowForm(false);
    setEditando(null);
    setNome("");
    setValor("");
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = { nome, valor: parseFloat(valor.replace(",", ".")), user_id: user.id };

    if (editando) {
      await supabase.from("servicos").update(payload).eq("id", editando.id);
    } else {
      await supabase.from("servicos").insert(payload);
    }

    await load();
    fecharForm();
    setSalvando(false);
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    await supabase.from("servicos").delete().eq("id", id);
    setServicos((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <AppHeader
        title="Serviços"
        subtitle={`${servicos.length} cadastrado${servicos.length !== 1 ? "s" : ""}`}
        right={
          <button onClick={() => abrirForm()} className="btn-primary py-2.5 px-4 w-auto text-sm">
            <Plus className="w-4 h-4" /> Novo
          </button>
        }
      />

      <div className="page-container pt-4">
        {/* Modal de formulário */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-surface-1 border border-surface-border rounded-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">
                  {editando ? "Editar Serviço" : "Novo Serviço"}
                </h2>
                <button onClick={fecharForm} className="btn-ghost p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={salvar} className="flex flex-col gap-4">
                <div>
                  <label className="label">Nome do serviço *</label>
                  <input
                    className="input"
                    placeholder="Ex: Troca de Disjuntor"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Valor padrão (R$) *</label>
                  <input
                    className="input"
                    placeholder="0,00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={fecharForm} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={salvando}>
                    {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-surface-4 rounded w-1/2 mb-2" />
                <div className="h-3 bg-surface-4 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : servicos.length === 0 ? (
          <div className="card p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center">
              <Wrench className="w-7 h-7 text-gray-600" />
            </div>
            <div>
              <p className="text-white font-semibold">Nenhum serviço</p>
              <p className="text-sm text-gray-500 mt-1">Cadastre seus serviços e valores</p>
            </div>
            <button onClick={() => abrirForm()} className="btn-primary w-auto px-6 py-3 text-sm">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {servicos.map((s) => (
              <div key={s.id} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{s.nome}</p>
                  <p className="text-brand-400 font-bold text-sm">{formatBRL(s.valor)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => abrirForm(s)} className="btn-ghost p-2.5">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => excluir(s.id)} className="btn-ghost p-2.5 text-red-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
