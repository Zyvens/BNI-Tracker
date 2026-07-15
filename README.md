# BNI Tracker — App dos Membros

Aplicativo mobile-first para membros do BNI acompanharem seu desempenho semestral e se manterem
com 100 pontos, com análise de janela móvel de 6 meses, previsão de caducidade, plano de ação,
CRM de referências com base compartilhada e notificações inteligentes.

Complementa (sem substituir) o **BNI Performance Tool** do coordenador: usa o mesmo PDF mensal
"Semáforos" e o mesmo parser de colunas.

## Como rodar (desenvolvimento local)

O banco é PostgreSQL (necessário para hospedar depois na Vercel). Para desenvolver localmente,
crie um banco gratuito no [Neon](https://neon.tech) — leva 2 minutos, veja o passo a passo em
[DEPLOY.md](DEPLOY.md).

```bash
npm install
cp .env.example .env     # depois edite com sua DATABASE_URL do Neon
npm run db:migrate       # cria as tabelas
npm run db:seed          # cria o login mestre
npm run dev
```

Acesse `http://localhost:3000`.

**Login mestre inicial:** usuário `admin` · senha `admin123` (o sistema pede troca no primeiro acesso).

## Publicar na internet (para os membros acessarem do celular, de qualquer lugar)

Veja o guia completo em [DEPLOY.md](DEPLOY.md) — hospedagem gratuita na Vercel + banco no Neon,
com URL pública fixa (ex: `bni-tracker.vercel.app`).

## Perfis

- **Coordenador (ADMIN)** — `/admin`: cadastra membros e gera logins, importa o PDF Semáforos
  mensal, vê o semáforo do capítulo e configura as regras/metas (variam por capítulo).
- **Membro (MEMBER)**: dashboard em tempo real, registro semanal, CRM de referências,
  convidados, análise e notificações.

## Telas do membro

| Rota | Função |
| --- | --- |
| `/` | Dashboard: anel de pontuação, projeção, dias restantes, margem, probabilidade, banner de status, plano de ação, KPIs, projeção de 6 meses |
| `/saude-dmi` | Detalhe de cada KPI com semáforo, progresso e dica |
| `/rumo-100` | "O que falta para os 100": plano por indicador com prazos de caducidade + margem de segurança |
| `/registro-semana` | Registro semanal (presença, atraso, UEG, testemunho, refs, convidados, 1-a-1, ONF) |
| `/semanas` | Histórico de reuniões + totais da janela |
| `/referencias` | CRM: recebidas (pipeline) e dadas (ciclo de valor) |
| `/referencias/[id]` | Detalhe: avançar pipeline, declarar/confirmar/contestar valor, histórico |
| `/convidados` | Convite → confirmação → comparecimento → conversão |
| `/analise` | Insights, funil de conversão, evolução da pontuação, reciprocidade por membro |
| `/notificacoes` | Central de alertas inteligentes |

## Regras de negócio principais

- **Janela móvel de 6 meses** — os valores atuais combinam o último relatório oficial com os
  registros semanais do próprio membro (`max(oficial, registrado)`, sem dupla contagem).
- **Pontuação (0–100)** — pesos do Semáforo oficial: refs 20 · convidados 20 · 1-a-1 10 ·
  UEG 10 · testemunhos 5 · OPNF 15 · presenças 15 (−5/ausência) · pontualidade 5.
- **Caducidade** — a produção mensal (registros semanais + deltas entre relatórios oficiais)
  permite projetar as 6 próximas janelas: quando um mês antigo sai da janela, o app avisa
  quanto registrar e até quando. Precisão máxima com 6+ meses de dados.
- **Base compartilhada** — quem recebe a referência declara o valor fechado; quem deu confirma
  ou contesta; ambos são notificados. Estados: aguardando declaração → valor declarado →
  confirmada / contestada → corrigida.
- **Metas configuráveis** — em `/admin/config` (por capítulo/região).

## Stack

Next.js 14 (App Router) · Prisma + PostgreSQL · JWT em cookie httpOnly (jose) + bcryptjs ·
pdf-parse (parser portado do BNI Performance Tool) · Tailwind + framer-motion + lucide.

Arquivos-chave: `src/lib/engine.ts` (pontuação/projeção), `src/lib/snapshot.ts` (agregação por
membro), `src/lib/pdfParser.ts` (PDF Semáforos), `src/lib/notifications.ts` (alertas),
`src/middleware.ts` (autenticação/perfis).
