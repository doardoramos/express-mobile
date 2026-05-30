# ⚡ OS Express

> Gere orçamentos e Ordens de Serviço profissionais em segundos. Envie direto pelo WhatsApp.

**Stack:** Next.js 14 · Supabase · Tailwind CSS · jsPDF  
**Deploy:** Vercel (zero configuração)  
**Sincronia:** 100% em nuvem via Supabase — funciona em qualquer dispositivo

---

## 🚀 Setup em 5 passos

### 1. Clone e instale

```bash
git clone <seu-repo>
cd os-express
npm install
```

### 2. Crie o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito
2. Vá em **SQL Editor** e cole o conteúdo de `supabase-schema.sql`
3. Execute — isso cria todas as tabelas, políticas RLS e triggers

### 3. Configure as variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com as credenciais do seu projeto Supabase:
- `NEXT_PUBLIC_SUPABASE_URL` → Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Settings > API > anon/public key

### 4. Rode localmente

```bash
npm run dev
# Acesse http://localhost:3000
```

### 5. Deploy na Vercel

```bash
npm install -g vercel
vercel
```

Ou conecte o repositório direto no [vercel.com](https://vercel.com) e adicione as variáveis de ambiente no painel.

---

## 📱 Funcionalidades

| Feature | Status |
|---|---|
| Login / Cadastro | ✅ |
| Perfil com logo + Pix | ✅ |
| CRUD de Clientes | ✅ |
| CRUD de Serviços com valores | ✅ |
| Criar OS com itens | ✅ |
| Editar OS e status | ✅ |
| Geração de PDF profissional | ✅ |
| Envio via WhatsApp (link) | ✅ |
| Dashboard com métricas | ✅ |
| Autenticação protegida | ✅ |
| RLS (dados isolados por usuário) | ✅ |
| Mobile-First / PWA instalável | ✅ |

---

## 🗂️ Estrutura de Pastas

```
os-express/
├── app/
│   ├── auth/           # Login e cadastro
│   ├── dashboard/      # Tela inicial com métricas
│   ├── clientes/       # Lista e formulário de clientes
│   ├── servicos/       # Lista e formulário de serviços
│   ├── ordens/
│   │   ├── nova/       # Criar nova OS
│   │   └── [id]/
│   │       ├── page    # Detalhe da OS + PDF + WhatsApp
│   │       └── editar/ # Editar OS existente
│   └── perfil/         # Dados da empresa
├── components/
│   └── layout/         # Header, BottomNav
├── lib/
│   ├── supabase.ts     # Client Supabase
│   └── pdf.ts          # Gerador de PDF + URL WhatsApp
├── types/              # TypeScript types
├── middleware.ts        # Proteção de rotas
└── supabase-schema.sql # Schema completo do banco
```

---

## 🔒 Segurança

- **Row Level Security (RLS)** ativado em todas as tabelas
- Cada usuário vê **apenas seus próprios dados**
- Autenticação via Supabase Auth (email + senha)
- Middleware Next.js protege todas as rotas privadas

---

## 📄 Como funciona o PDF

O PDF é gerado **100% no navegador** usando `jsPDF + jspdf-autotable`:

1. Usuário clica em "Baixar PDF" na tela da OS
2. `lib/pdf.ts` monta o documento com: dados do prestador, dados do cliente, tabela de itens e chave Pix
3. O arquivo é baixado diretamente — **sem servidor, sem custo**

## 💬 Como funciona o WhatsApp

Usa a API pública gratuita do WhatsApp:

```
https://api.whatsapp.com/send?phone=55DDNÚMERO&text=Mensagem
```

Nenhuma API paga necessária para o MVP!

---

## 🎨 Próximas melhorias (pós-MVP)

- [ ] Upload do PDF para Supabase Storage (link direto no WhatsApp)
- [ ] Filtros avançados por data no dashboard
- [ ] Relatório mensal em PDF
- [ ] Envio de email automático
- [ ] Assinatura digital do cliente
- [ ] Plano Pro com Stripe
