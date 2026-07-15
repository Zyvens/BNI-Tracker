# Guia de Publicação — BNI Tracker

Este guia coloca o app numa URL pública e fixa (ex: `https://bni-tracker.vercel.app`),
acessível pelo celular de qualquer lugar, sem precisar do seu computador ligado.

Usa dois serviços **gratuitos**: [Neon](https://neon.tech) (banco de dados Postgres) e
[Vercel](https://vercel.com) (hospedagem do site). Nenhum cartão de crédito é exigido nos
planos gratuitos usados aqui.

Tempo estimado: 15–20 minutos, feito uma única vez.

---

## Parte 1 — Criar o banco de dados (Neon)

1. Acesse **https://neon.tech** e crie uma conta (pode entrar com Google/GitHub).
2. Crie um projeto novo. Dê um nome como `bni-tracker`.
3. Na tela do projeto, copie a **Connection string** (algo como
   `postgresql://usuario:senha@ep-xxxxx.neon.tech/neondb?sslmode=require`).
   Guarde esse valor — é a sua `DATABASE_URL`.

## Parte 2 — Preparar o banco localmente

No seu computador, dentro da pasta `bni-members-app`:

```bash
cp .env.example .env
```

Abra o arquivo `.env` e cole a connection string do Neon em `DATABASE_URL`. Gere também um
`AUTH_SECRET` novo e forte:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cole o resultado em `AUTH_SECRET` no `.env`.

Agora crie as tabelas no banco novo e o login do coordenador:

```bash
npm install
npm run db:migrate   # cria as tabelas (pergunta um nome, digite: init)
npm run db:seed       # cria o login mestre: admin / admin123
```

Teste local rapidamente: `npm run dev`, acesse `http://localhost:3000`, entre com
`admin` / `admin123` e confirme que abre o painel do coordenador. Se funcionar, o banco está
pronto.

## Parte 3 — Colocar o código no GitHub

A Vercel publica direto a partir de um repositório do GitHub.

1. Crie uma conta em **https://github.com** se ainda não tiver.
2. Crie um repositório novo, vazio, privado (ex: nome `bni-tracker`). Não marque nenhuma opção
   de "adicionar README" — deixe totalmente vazio.
3. No terminal, dentro de `bni-members-app`:

```bash
git add -A
git commit -m "Preparar app para deploy"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/bni-tracker.git
git push -u origin main
```

(Troque `SEU-USUARIO` pelo seu usuário do GitHub. Na primeira vez ele vai pedir login — use o
navegador que abrir, ou um Personal Access Token se pedir senha.)

## Parte 4 — Publicar na Vercel

1. Acesse **https://vercel.com** e crie uma conta — escolha **"Continue with GitHub"** para já
   conectar as contas.
2. Clique em **"Add New" → "Project"**.
3. Selecione o repositório `bni-tracker` que você acabou de subir e clique em **Import**.
4. Antes de clicar em Deploy, abra **"Environment Variables"** e adicione duas:
   - `DATABASE_URL` → cole a mesma connection string do Neon (Parte 1).
   - `AUTH_SECRET` → cole o mesmo valor gerado na Parte 2.
5. Clique em **Deploy**. Em 1–2 minutos a Vercel te dá uma URL pública, algo como
   `https://bni-tracker-xxxx.vercel.app`.

Pronto — essa URL já funciona de qualquer lugar com internet, 24 horas por dia, sem depender do
seu computador.

## Parte 5 — Domínio mais bonito (opcional)

Por padrão a URL é do tipo `bni-tracker-xxxx.vercel.app`. Para deixar mais curta e fácil de
divulgar aos membros:

- Em **Project → Settings → Domains**, você pode trocar por um subdomínio gratuito da Vercel
  (ex: `bni-fire-tracker.vercel.app`, sem o sufixo aleatório).
- Se tiver um domínio próprio (ex: `bnifire.com.br`), pode apontá-lo lá também.

## Instalar como app no celular (sem loja de aplicativos)

Compartilhe a URL com os membros. No celular:

- **iPhone (Safari):** abrir o link → botão de compartilhar → "Adicionar à Tela de Início".
- **Android (Chrome):** abrir o link → menu (⋮) → "Adicionar à tela inicial" / "Instalar app".

Fica com ícone próprio, abre em tela cheia, como um app nativo.

## Depois de publicado: cadastrando os membros

Entre em `https://SUA-URL.vercel.app/admin` com `admin` / `admin123`, troque a senha quando
pedido, e cadastre os membros em **Membros → Cadastrar membro**. Cada um recebe um usuário e
senha inicial (troca no primeiro acesso). Importe os relatórios mensais em **Relatórios**.

## Atualizando o app no futuro

Sempre que eu (ou você) alterar o código:

```bash
git add -A
git commit -m "descrição da mudança"
git push
```

A Vercel detecta o push automaticamente e publica a nova versão em ~1 minuto, sem downtime.

## Alternativa rápida (só para testar hoje, sem publicar)

Se quiser só testar com membros que estão na mesma rede Wi-Fi que você agora, sem passar pelos
passos acima:

```bash
npm run dev
```

Depois descubra o IP do seu computador na rede (`ipconfig` no Windows, procure por "IPv4") e
compartilhe `http://SEU-IP:3000` com quem estiver no mesmo Wi-Fi. Isso só funciona enquanto seu
computador estiver ligado e todos na mesma rede — não é acesso "de qualquer lugar". Para isso,
siga o guia completo acima.
