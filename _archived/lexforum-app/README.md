# LexForum — Simulador de Fóruns Jurídicos

MVP da plataforma de simulação de fóruns jurídicos com agentes de IA especializados em direito brasileiro.

## Pré-requisitos

- Node.js 18+
- npm, yarn ou pnpm

## Configuração inicial

1. **Clone o repositório e acesse a pasta:**

   ```bash
   cd lexforum-app
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**

   ```bash
   cp .env.local.example .env.local
   ```

   Edite `.env.local` com suas credenciais reais:

   | Variável | Descrição |
   |---|---|
   | `ANTHROPIC_API_KEY` | Chave da API Anthropic (Claude) |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |

## Rodando localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção (requer build) |
| `npm run lint` | Verificação de lint |

## Estrutura do projeto

```
lexforum-app/
├── src/
│   └── app/
│       ├── layout.tsx      # Layout raiz com metadata
│       ├── page.tsx        # Página inicial
│       └── globals.css     # Estilos globais + Tailwind
├── .env.local.example      # Variáveis de ambiente (template)
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Stack

- [Next.js 16](https://nextjs.org/) — App Router
- [Tailwind CSS](https://tailwindcss.com/) — estilização
- [Anthropic Claude](https://anthropic.com/) — agentes de IA jurídicos
- [Supabase](https://supabase.com/) — banco de dados e autenticação
