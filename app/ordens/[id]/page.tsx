"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { formatBRL, gerarPDF, buildWhatsAppUrl } from "@/lib/pdf";
import { STATUS_LABELS, STATUS_COLORS, type Ordem, type Perfil, type OsStatus } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft, FileDown, MessageCircle, Pencil,
  Loader2, CheckCircle, ChevronDown
} from "lucide-react";
import Link from "next/link";

const STATUS_OPTS: OsStatus[] = ["em_aberto", "aprovado", "concluido", "pago"];

export default function OrdemDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [ordem, setOrdem] = useState<Ordem | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [salvandoStatus, setSalvandoStatus] = useState(false);

  const router = useRouter();
  

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      const [{ data: o }, { data: p }] = await Promise.all([
        supabase
          .from("ordens")
          .select("*, clientes(*), itens_ordem(*)")
          .eq("id", id)
          .single(),
        supabase.from("perfis").select("*").eq("id", user.id).single(),
      ]);

      if (o) setOrdem(o as Ordem);
      if (p) setPerfil(p as Perfil);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleGerarPDF() {
    if (!ordem || !perfil) return;
    setGerandoPDF(true);
    try {
      const blob = await gerarPDF(ordem, perfil);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `OS-${String(ordem.numero).padStart(4, "0")}-${ordem.clientes?.nome?.replace(/\s+/g, "-") || "cliente"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar PDF");
    }
    setGerandoPDF(false);
  }

  function handleWhatsApp() {
    if (!ordem?.clientes) return;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const linkOS = `${appUrl}/ordens/${ordem.id}`;
    const url = buildWhatsAppUrl(
      ordem.clientes.whatsapp,
      ordem.clientes.nome,
      ordem.numero,
      linkOS
    );
    window.open(url, "_blank");
  }

  async function atualizarStatus(novoStatus: OsStatus) {
    if (!ordem) return;
    setSalvandoStatus(true);
    const { data } = await supabase
      .from("ordens")
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq("id", ordem.id)
      .select()
      .single();
    if (data) setOrdem({ ...ordem, status: novoStatus });
    setSalvandoStatus(false);
    setShowStatus(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!ordem) {
    return (
      <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">OS não encontrada</p>
        <Link href="/ordens" className="btn-primary w-auto px-6">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <AppHeader
        title={`OS #${String(ordem.numero).padStart(4, "0")}`}
        subtitle={format(new Date(ordem.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        right={
          <div className="flex items-center gap-2">
            <Link href={`/ordens/${id}/editar`} className="btn-ghost p-2.5">
              <Pencil className="w-4 h-4" />
            </Link>
            <Link href="/ordens" className="btn-ghost p-2.5">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        }
      />

      <div className="page-container pt-5 flex flex-col gap-5">

        {/* Status */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Status atual</p>
              <span className={`text-sm px-3 py-1 rounded-full border font-semibold ${STATUS_COLORS[ordem.status]}`}>
                {STATUS_LABELS[ordem.status]}
              </span>
            </div>
            <button
              onClick={() => setShowStatus(!showStatus)}
              className="flex items-center gap-1.5 text-sm text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-2 rounded-xl"
            >
              {salvandoStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Pencil className="w-3.5 h-3.5" /> Alterar</>}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStatus ? "rotate-180" : ""}`} />
            </button>
          </div>
          {showStatus && (
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-surface-border">
              {STATUS_OPTS.map((s) => (
                <button
                  key={s}
                  onClick={() => atualizarStatus(s)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-1.5 ${
                    ordem.status === s
                      ? "bg-brand-500/20 border-brand-500 text-brand-400"
                      : "bg-surface-3 border-surface-border text-gray-400"
                  }`}
                >
                  {ordem.status === s && <CheckCircle className="w-3.5 h-3.5" />}
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cliente */}
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">Cliente</p>
          <p className="font-bold text-white text-lg">{ordem.clientes?.nome}</p>
          <p className="text-gray-400 text-sm">{ordem.clientes?.whatsapp}</p>
          {ordem.clientes?.endereco && (
            <p className="text-gray-500 text-sm mt-0.5">{ordem.clientes.endereco}</p>
          )}
        </div>

        {/* Itens */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
            Serviços / Itens
          </p>
          <div className="flex flex-col gap-2">
            {(ordem.itens_ordem || []).map((item) => (
              <div key={item.id} className="card p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{item.nome}</p>
                  <p className="text-sm text-gray-500">
                    {formatBRL(item.valor_unit)} × {item.quantidade}
                  </p>
                </div>
                <span className="font-bold text-brand-400 shrink-0">
                  {formatBRL(item.subtotal)}
                </span>
              </div>
            ))}

            {/* Total */}
            <div className="card p-4 bg-surface-3 flex items-center justify-between">
              <span className="font-semibold text-gray-300">Total</span>
              <span className="text-2xl font-bold text-brand-400">{formatBRL(ordem.total)}</span>
            </div>
          </div>
        </div>

        {/* Descrição */}
        {ordem.descricao && (
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">Observação</p>
            <p className="text-gray-300 text-sm leading-relaxed">{ordem.descricao}</p>
          </div>
        )}

        {/* Pagamento Pix */}
        {perfil?.chave_pix && (
          <div className="card p-4 border-brand-500/20 bg-brand-500/5">
            <p className="text-xs text-brand-400 mb-1.5 uppercase tracking-wider font-medium">💳 Pagamento via Pix</p>
            <p className="font-mono text-white text-sm break-all">{perfil.chave_pix}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col gap-3 pt-2">
          <button onClick={handleGerarPDF} className="btn-primary" disabled={gerandoPDF}>
            {gerandoPDF
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <><FileDown className="w-5 h-5" /> Baixar PDF</>
            }
          </button>

          <button onClick={handleWhatsApp} className="btn-secondary">
            <MessageCircle className="w-5 h-5 text-green-400" />
            <span>Enviar via WhatsApp</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
