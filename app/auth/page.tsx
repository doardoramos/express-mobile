"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "cadastro">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmacao, setConfirmacao] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setErro("Confirme seu email antes de entrar. Verifique sua caixa de entrada.");
      } else if (error.message.includes("Invalid login credentials")) {
        setErro("Email ou senha incorretos.");
      } else {
        setErro(error.message);
      }
      setLoading(false);
    } else {
      router.replace("/dashboard");
    }
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }

    // Se sessão foi criada direto (confirmação desativada no Supabase)
    if (data.session) {
      router.replace("/dashboard");
      return;
    }

    // Se precisa confirmar email
    setConfirmacao(true);
    setLoading(false);
  }

  if (confirmacao) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-surface-0">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Confirme seu email</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Enviamos um link de confirmação para <strong className="text-white">{email}</strong>.
            Clique no link e volte aqui para entrar.
          </p>
          <button
            onClick={() => { setConfirmacao(false); setTab("login"); }}
            className="btn-primary"
          >
            Já confirmei, entrar
          </button>
          <p className="text-xs text-gray-600 mt-4">
            Não recebeu? Verifique a pasta de spam.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-surface-0">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center shadow-xl shadow-brand-900/40">
          <Zap className="w-8 h-8 text-white fill-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">OS Express</h1>
          <p className="text-sm text-gray-500 mt-0.5">Orçamentos profissionais em segundos</p>
        </div>
      </div>

      <div className="w-full max-w-sm">
        {/* Tabs */}
        <div className="flex rounded-xl bg-surface-2 border border-surface-border p-1 mb-6">
          {(["login", "cadastro"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setErro(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? "bg-brand-500 text-white shadow" : "text-gray-500 hover:text-white"
              }`}
            >
              {t === "login" ? "Entrar" : "Criar Conta"}
            </button>
          ))}
        </div>

        <form onSubmit={tab === "login" ? handleLogin : handleCadastro} className="flex flex-col gap-4">
          {tab === "cadastro" && (
            <div>
              <label className="label">Seu nome / empresa</label>
              <input
                className="input"
                type="text"
                placeholder="Ex: João Eletricista"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Senha</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              autoComplete={tab === "login" ? "current-password" : "new-password"}
            />
          </div>

          {erro && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {erro}
            </p>
          )}

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : tab === "login" ? (
              "Entrar"
            ) : (
              "Criar minha conta"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
