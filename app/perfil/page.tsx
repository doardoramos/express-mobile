"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { Loader2, Save, LogOut, Camera, User } from "lucide-react";
import Image from "next/image";

export default function PerfilPage() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      const { data } = await supabase.from("perfis").select("*").eq("id", user.id).single();
      if (data) {
        setNome(data.nome || "");
        setTelefone(data.telefone || "");
        setChavePix(data.chave_pix || "");
        setLogoUrl(data.logo_url || null);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo.${ext}`;

    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("logos").getPublicUrl(path);
      const urlWithCache = `${data.publicUrl}?t=${Date.now()}`;
      setLogoUrl(urlWithCache);
      await supabase.from("perfis").update({ logo_url: urlWithCache }).eq("id", user.id);
    }
    setUploadingLogo(false);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("perfis").update({
      nome,
      telefone: telefone || null,
      chave_pix: chavePix || null,
    }).eq("id", user.id);

    setSucesso(true);
    setTimeout(() => setSucesso(false), 2500);
    setSalvando(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth");
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
      <AppHeader title="Meu Perfil" subtitle="Dados da sua empresa" />

      <div className="page-container pt-6">
        {/* Logo upload */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="relative w-24 h-24 rounded-2xl bg-surface-3 border-2 border-dashed border-surface-border cursor-pointer overflow-hidden"
            onClick={() => fileRef.current?.click()}
          >
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-10 h-10 text-gray-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              {uploadingLogo ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Toque para alterar logo</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
        </div>

        <form onSubmit={salvar} className="flex flex-col gap-5">
          <div>
            <label className="label">Nome / Empresa *</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: João Eletricista" />
          </div>

          <div>
            <label className="label">Telefone / WhatsApp</label>
            <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(21) 99999-0000" type="tel" />
          </div>

          <div>
            <label className="label">Chave Pix</label>
            <input className="input" value={chavePix} onChange={(e) => setChavePix(e.target.value)} placeholder="CPF, email, telefone ou chave aleatória" />
            <p className="text-xs text-gray-600 mt-1">Aparece no PDF para o cliente fazer o pagamento</p>
          </div>

          {sucesso && (
            <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl px-4 py-3 text-brand-400 text-sm font-medium">
              ✓ Perfil salvo com sucesso!
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={salvando}>
            {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Perfil</>}
          </button>

          <button type="button" onClick={logout} className="btn-secondary mt-2 text-red-400">
            <LogOut className="w-5 h-5" /> Sair da conta
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
