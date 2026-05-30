"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import type { Cliente } from "@/types";
import { Plus, Search, User, ChevronRight, Trash2 } from "lucide-react";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      const { data } = await supabase
        .from("clientes")
        .select("*")
        .order("nome");
      if (data) setClientes(data as Cliente[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    c.whatsapp.includes(filtro)
  );

  async function excluir(id: string) {
    if (!confirm("Excluir este cliente?")) return;
    await supabase.from("clientes").delete().eq("id", id);
    setClientes((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <AppHeader
        title="Clientes"
        subtitle={`${clientes.length} cadastrado${clientes.length !== 1 ? "s" : ""}`}
        right={
          <Link href="/clientes/novo" className="btn-primary py-2.5 px-4 w-auto text-sm">
            <Plus className="w-4 h-4" /> Novo
          </Link>
        }
      />

      <div className="page-container pt-4">
        {/* Busca */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            className="input pl-10"
            placeholder="Buscar por nome ou WhatsApp..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
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
        ) : filtrados.length === 0 ? (
          <div className="card p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center">
              <User className="w-7 h-7 text-gray-600" />
            </div>
            <div>
              <p className="text-white font-semibold">Nenhum cliente</p>
              <p className="text-sm text-gray-500 mt-1">Adicione seu primeiro cliente</p>
            </div>
            <Link href="/clientes/novo" className="btn-primary w-auto px-6 py-3 text-sm">
              <Plus className="w-4 h-4" /> Adicionar
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtrados.map((c) => (
              <div key={c.id} className="card p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-surface-3 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-brand-400">
                    {c.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <Link href={`/clientes/${c.id}`} className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{c.nome}</p>
                  <p className="text-sm text-gray-500">{c.whatsapp}</p>
                  {c.endereco && (
                    <p className="text-xs text-gray-600 truncate mt-0.5">{c.endereco}</p>
                  )}
                </Link>
                <div className="flex items-center gap-1">
                  <Link href={`/clientes/${c.id}`} className="btn-ghost p-2.5">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => excluir(c.id)}
                    className="btn-ghost p-2.5 text-red-500 hover:text-red-400"
                  >
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
