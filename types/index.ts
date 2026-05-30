export type OsStatus = "em_aberto" | "aprovado" | "concluido" | "pago";

export interface Perfil {
  id: string;
  nome: string;
  telefone: string | null;
  chave_pix: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Cliente {
  id: string;
  user_id: string;
  nome: string;
  whatsapp: string;
  endereco: string | null;
  created_at: string;
}

export interface Servico {
  id: string;
  user_id: string;
  nome: string;
  valor: number;
  created_at: string;
}

export interface ItemOrdem {
  id: string;
  ordem_id: string;
  servico_id: string | null;
  nome: string;
  valor_unit: number;
  quantidade: number;
  subtotal: number;
}

export interface Ordem {
  id: string;
  user_id: string;
  cliente_id: string;
  numero: number;
  descricao: string | null;
  status: OsStatus;
  total: number;
  created_at: string;
  updated_at: string;
  // joins
  clientes?: Cliente;
  itens_ordem?: ItemOrdem[];
}

export const STATUS_LABELS: Record<OsStatus, string> = {
  em_aberto: "Em Aberto",
  aprovado: "Aprovado",
  concluido: "Concluído",
  pago: "Pago",
};

export const STATUS_COLORS: Record<OsStatus, string> = {
  em_aberto: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  aprovado: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  concluido: "bg-brand-500/20 text-brand-400 border-brand-500/30",
  pago: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};
