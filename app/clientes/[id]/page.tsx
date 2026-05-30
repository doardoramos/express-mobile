"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import type { Cliente } from "@/types";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

export default function ClienteFormPage() {
  const params = useParams();
  const id = params?.id as string;
  const isNovo = id === "novo";

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [endereco, setEndereco] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const router = useRouter();
  

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("clientes").select("*").eq("id", id).single();
      if (data) {
        const cliente = data as Cliente;
        setNome(cliente.nome);
        setWhatsapp(cliente.whatsapp);
        setEndereco(cliente.endereco || "");
      }
    };
    if (!isNovo) {
      load();
    }
  }, [id, supabase]);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth"); return; }

    const payload = { nome, whatsapp, endereco: endereco || null, user_id: user.id };

    const { error } = isNovo
      ? await supabase.from("clientes").insert(payload)
      : await supabase.from("clientes").update(payload).eq("id", id);

    if (error) {
      setErro("Erro ao salvar. Tente novamente.");
      setLoading(false);
    } else {
      router.push("/clientes");
    }
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <AppHeader
        title={isNovo ? "Novo Cliente" : "Editar Cliente"}
        right={
          <Link href="/clientes" className="btn-ghost">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        }
      />

      <div className="page-container pt-6">
        <form onSubmit={handleSalvar} className="flex flex-col gap-5">
          <div>
            <label className="label">Nome completo *</label>
            <input
              className="input"
              placeholder="Ex: Maria Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">WhatsApp *</label>
            <input
              className="input"
              placeholder="(21) 99999-0000"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
            />
            <p className="text-xs text-gray-600 mt-1">Usado para enviar o PDF via WhatsApp</p>
          </div>

          <div>
            <label className="label">Endereço</label>
            <input
              className="input"
              placeholder="Rua, número, bairro..."
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
          </div>

          {erro && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {erro}
            </p>
          )}

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Cliente</>}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
