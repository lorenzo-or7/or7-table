# Or7 Table — configuração e publicação

Guia curto para colocar o Or7 Table no ar. Nada aqui faz deploy sozinho.

## 1. Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha os valores (seção 2)
npm run dev                  # http://localhost:5173
npm run build                # gera dist/ (typecheck + build de produção)
```

Sem `.env.local`, o site abre com os três cardápios demonstrativos (dados locais) e o login mostra o aviso de configuração.

## 2. Supabase (uma vez) — ordem exata

> Nada aqui roda sozinho. Cada passo é feito por você no Dashboard do projeto `or7-table`.
> Rode cada arquivo **inteiro**, numa consulta nova do SQL Editor, e confira "Success" antes do próximo.
> Se um arquivo falhar, ele não deixa alterações pela metade: corrija e rode o mesmo arquivo de novo.

**A. Configurações antes do SQL**
1. Authentication → Multi-Factor → **TOTP (App Authenticator)**: *Enroll* e *Verify* habilitados.
2. Authentication → Sign In / Providers → Email: desligue **Allow new users to sign up** (todo acesso nasce por convite).
3. Authentication → URL Configuration:
   - Site URL: `https://SEU-DOMINIO`
   - Redirect URLs: `https://SEU-DOMINIO/redefinir-senha` e `http://localhost:5173/redefinir-senha`
   - Enquanto o site estiver só no GitHub Pages (sem domínio próprio): Site URL `https://lorenzo-or7.github.io/or7-table`
     e Redirect URL `https://lorenzo-or7.github.io/or7-table/redefinir-senha`.

**B. SQL Editor, nesta ordem**
1. `supabase/migrations/0001_or7table.sql` — tabelas, RLS, Storage (bucket `menu-media`), funções públicas
2. `supabase/migrations/0002_product_variants.sql` — preços por tamanho
3. `supabase/migrations/0003_finalization.sql` — destaques, convites com validade, financeiro
4. `supabase/migrations/0004_mfa.sql` — MFA obrigatório (aal2) e eventos de segurança
5. `supabase/migrations/0005_production_hardening.sql` — permissões mínimas e travas finais
6. **Não rode** `supabase/seed_demo.sql` em produção. Os três cardápios de demonstração já funcionam com os
   dados embutidos no site; o seed criaria estabelecimentos fictícios no banco real.

Para conferir depois: Database → Advisors → Security deve mostrar no máximo avisos informativos.

**C. Edge Function** `invite-owner` (convites, reenvio, exclusão e redefinição de MFA)
- `npx supabase functions deploy invite-owner --project-ref <ref-do-projeto>` (ou Dashboard → Edge Functions).
- Mantenha **Verify JWT ligado**. A função usa as chaves injetadas pelo Supabase (`SUPABASE_SECRET_KEYS`, ou a legada
  `SUPABASE_SERVICE_ROLE_KEY`); não cadastre nenhuma chave à mão.

**D. Chaves do site** (`.env.local` / `.env.production.local`)
- Project Settings → API Keys: copie a **Publishable key** (`sb_publishable_…`) para `VITE_SUPABASE_ANON_KEY`
  (a anon legada também funciona) e a Project URL para `VITE_SUPABASE_URL`.
- **Nunca** coloque a Secret key nem a service_role no site: tudo que começa com `VITE_` vai para o navegador.
- **GitHub Pages:** repositório → Settings → Secrets and variables → Actions → aba **Variables** → crie
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (a Publishable key) e `VITE_PUBLIC_SITE_URL`
  (`https://lorenzo-or7.github.io/or7-table`). O workflow `deploy.yml` já lê essas variáveis; sem elas o site
  publicado continua em modo demonstração. A Publishable key é pública por natureza (a proteção é a RLS).

**E. Super Admin** (só quando for criar a conta principal)
1. Authentication → Users → Add user → Create new user: seu e-mail, senha forte e única, **Auto Confirm User**.
2. Edite o e-mail em `supabase/bootstrap_super_admin.sql` e rode no SQL Editor (exige 0001–0005 aplicadas).
3. Entre em `/entrar`: o primeiro login pede o cadastro do Authenticator.

**F. E-mails**
- Authentication → Emails: o link de convite vale pelo *Email OTP Expiration* (padrão 24 h); "Reenviar convite" gera outro.
- Para produção, configure um SMTP próprio (Authentication → Emails → SMTP). O SMTP padrão do Supabase tem limite baixo
  de envios por hora e serve só para testes.

**G. Backups e continuidade (plano Free)**
- O plano Free **não tem backups automáticos** nem download de backup pelo painel. Faça cópias manuais periódicas
  com a Supabase CLI (`supabase db dump`, que exige Docker) e guarde fora do Supabase. Arquivos do Storage
  (fotos) não entram no dump do banco: mantenha também os originais.
- Projetos Free podem ser pausados por inatividade. Antes de atender clientes pagantes, avalie o plano Pro
  (backups diários e sem pausa).

**H. Revogação de acesso**
- Remover o vínculo (Usuários e acessos → "Sem acesso"): vale na próxima consulta, porque a RLS lê o vínculo a cada pedido.
- Excluir a conta (pelo painel, via Edge Function) ou banir em Authentication → Users: impede novos logins.
- Um token já emitido continua válido até expirar (cerca de 1 h), mas sem vínculo ele não enxerga nenhum dado.

**Regra de manutenção:** as migrações formam uma sequência. Nunca rode de novo só a 0001 (ou outra antiga) isoladamente:
ela recria funções na versão anterior. Se precisar repetir, rode 0001 → 0005 inteiras, em ordem.

## 3. Autenticação em duas etapas (MFA)

Obrigatória para **todo** acesso administrativo (Super Admin e restaurantes). Cardápios públicos não pedem login.

- **Primeiro acesso:** e-mail + senha → tela "Ative o Authenticator" → QR Code (ou chave manual) → código de 6 números → painel.
- **Acessos seguintes:** e-mail + senha → código do Authenticator → painel. O destino pedido é preservado.
- **No banco (0004):** com sessão só de senha (`aal1`) nenhuma tabela administrativa, função de admin ou upload responde.
  As permissões por papel e por restaurante continuam iguais; o MFA é exigência adicional.
- **Edge Function:** toda ação exige papel super_admin **e** token `aal2`. Tentativas sem MFA ficam registradas.
- O segredo TOTP nunca é salvo pelo Or7 Table (nem banco próprio, nem log, nem navegador). Ele fica no Supabase Auth.
- Não há "desligar MFA" no painel. O Supabase só permite remover um fator verificado com sessão `aal2`.

### Perdeu o celular / Authenticator

**Dono de restaurante**
1. A pessoa fala com a Or7 por um canal já conhecido (WhatsApp ou telefone do contrato).
2. A Or7 confirma a identidade por um canal independente do e-mail (ex.: ligação para o número do contrato).
3. Super Admin (com MFA) → Usuários e acessos → ícone de escudo "Redefinir Authenticator" → descreve como confirmou a identidade.
4. No próximo login, a pessoa cadastra um Authenticator novo. O evento fica em "Eventos de segurança".
   A sessão que já estiver aberta no aparelho antigo continua até o token vencer (até 1 h). Em caso de roubo do aparelho,
   troque também a senha da conta (Authentication → Users → Send password recovery).

**Super Admin (procedimento fora da aplicação)**
O painel não permite que o Super Admin redefina o próprio MFA. Quem tiver acesso de dono ao projeto Supabase:
1. Confirme a identidade de quem pede por um meio independente (presencial ou chamada de vídeo com documento).
2. Entre no Dashboard do Supabase **com a conta da organização, que também deve ter MFA ativo**.
3. Authentication → Users → abra o usuário → **Remove MFA factors** (ou, no SQL Editor:
   `delete from auth.mfa_factors where user_id = '<id do usuário>';`).
4. Registre o fato: `insert into public.security_events (target_id, event, details) values ('<id>', 'mfa_reset_by_admin', '{"via":"dashboard"}');`
5. Troque a senha da conta e faça o novo cadastro do Authenticator no próximo login.
Recomendação: mantenha um segundo membro de confiança com acesso à organização Supabase, para não depender de uma única pessoa.

## 4. Variáveis de produção (`.env.production.local` antes do build)

| Variável | Uso |
|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | API pública (protegida por RLS) |
| `VITE_PUBLIC_SITE_URL` | `https://SEU-DOMINIO`, sem barra final. Base dos QR Codes e dos links de convite/recuperação |
| `VITE_CONTACT_WHATSAPP` / `VITE_CONTACT_EMAIL` | Opcionais. Sem eles vale o WhatsApp oficial +55 41 99626-2776 |

O build embute esses valores: troque-os e gere o build de novo.

## 5. HostGator (hospedagem estática)

O Or7 Table é um site estático (SPA). **Não precisa de Node no servidor**: o backend é o Supabase.
Qualquer plano com Apache + `.htaccess` serve.

1. `npm run build`
2. Envie o **conteúdo** de `dist/` para `public_html/` (inclui o `.htaccess`, que é arquivo oculto).
3. Ative o SSL gratuito (AutoSSL/Let's Encrypt) no cPanel e confirme que `http://` redireciona para `https://`.
4. Depois de confirmar o HTTPS, descomente a linha `Strict-Transport-Security` no `.htaccess`.

O `.htaccess` já faz: fallback de rotas (`/table/slug`, `/admin`, `/painel` → `index.html`), HTTPS forçado,
cache longo para `/assets` (arquivos com hash), `no-cache` no `index.html`, compressão e cabeçalhos de segurança.

## 6. Checklist antes de publicar

- [ ] Migrações 0001–0005 rodadas, em ordem; signup público desligado; Redirect URLs com o domínio final
- [ ] TOTP habilitado no Supabase antes das migrações
- [ ] SMTP próprio configurado para convites e recuperação de senha
- [ ] Super Admin criado pelo `bootstrap_super_admin.sql`, Authenticator cadastrado no primeiro login
- [ ] Teste real: login com código errado é recusado; sem código o painel não abre
- [ ] Teste real: "Redefinir Authenticator" de um dono de teste e novo cadastro no login seguinte
- [ ] Edge Function `invite-owner` publicada; convite de teste recebido, senha definida, login cai em `/painel`
- [ ] `VITE_PUBLIC_SITE_URL` com o domínio final **antes** de gerar QR Codes para impressão
- [ ] Teste real: dono altera preço/disponibilidade e o cardápio público mostra a mudança
- [ ] Teste real: dono de um restaurante não vê nem edita outro (já coberto pelos testes de RLS, repetir no projeto real)
- [ ] `og:image` em `index.html` com URL absoluta do domínio (redes sociais não aceitam caminho relativo)
- [ ] SSL ativo e HSTS ligado

## 7. O que já foi validado e como

- **RLS e migrações**: 86 cenários (tokens `aal1` e `aal2`, sem grants automáticos, como no Supabase após 30/10/2026) em Postgres real (PGlite) com papéis simulados do Supabase — isolamento entre restaurantes,
  bloqueio de autopromoção, financeiro só para o Super Admin, uploads por pasta, convites vencidos, API pública.
  Isso valida o SQL, **não** o projeto Supabase hospedado.
- **Interface**: login, redirecionamento por papel, financeiro, usuários e painel do dono testados contra uma imitação local
  da API do Supabase. Integração com o Supabase real, envio de e-mails e Edge Function: **pendentes de teste real**.
