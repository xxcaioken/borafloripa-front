# Bora Floripa — Frontend

Interface web do Bora Floripa. PWA em React 19 + TypeScript + Vite. Deploy automático na Azure Static Web Apps.

[![CI](https://github.com/xxcaioken/borafloripa-front/actions/workflows/frontend.yml/badge.svg)](https://github.com/xxcaioken/borafloripa-front/actions/workflows/frontend.yml)

**Produção:** [orange-flower-0182c6b0f.2.azurestaticapps.net](https://orange-flower-0182c6b0f.2.azurestaticapps.net)

---

## Stack

| Tech | Versão | Decisão |
|------|--------|---------|
| React | 19 | — |
| TypeScript | 5 (strict) | Zero `any` implícito |
| Vite | 8 | Build + dev server |
| React Router | v7 | `lazy()` em todas as rotas exceto Feed |
| Axios | — | Instância com interceptores em `src/services/api.ts` |
| Mantine | 9 | Tabs, Drawer, Notifications |
| Tabler Icons | — | Ícones SVG (sem emojis em UI de sistema) |
| Leaflet | v5 | Mapa interativo |
| CSS puro | — | Custom properties, sem Tailwind |
| Vitest | 4 | Testes unitários e de componente |

---

## Setup local

```bash
git clone https://github.com/xxcaioken/borafloripa-front.git
cd borafloripa-front
npm install
```

Crie `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
# Opcional — botão Google some se ausente
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
# Opcional — push notifications somem se ausente
VITE_VAPID_PUBLIC_KEY=sua-chave-vapid-publica
```

```bash
npm run dev           # dev server em http://localhost:5173
npm run build         # build de produção
npm test              # roda os testes (vitest)
npm run test:watch    # modo watch para desenvolvimento
npm run test:coverage # relatório de cobertura HTML
npm run lint          # ESLint
```

O dev server faz proxy automático de `/api/*` para `http://localhost:8000` (ou `VITE_DEV_BACKEND_URL`).

---

## Estrutura

```
src/
├── App.tsx              # Layout raiz: sidebar, bottom nav, rotas, modal de evento
├── App.css              # Todos os estilos (~4000 linhas) + design tokens :root
├── pages/
│   ├── Feed.tsx             # Página principal: filtros, bairros, sort, entrada grátis
│   ├── Agenda.tsx           # Agenda semanal (7 dias)
│   ├── VenueDetail.tsx      # Check-in, follow, vibe voting, reviews, foto hero
│   ├── Search.tsx           # Busca global: Tudo / Eventos / Locais (debounce 300ms)
│   ├── MapView.tsx          # Leaflet, pins SVG por categoria, pulse hot zone
│   ├── PartnerDashboard.tsx # Analytics, eventos, cupons, edição de venue, upload foto
│   ├── Profile.tsx          # Preferências, feed de seguidos, toggle push
│   ├── Auth.tsx             # E-mail/senha + Google GSI
│   ├── Onboarding.tsx       # Wizard de preferências (3 steps, primeira visita)
│   ├── Communities.tsx      # Grupos por tag, join/leave, cupons exclusivos
│   ├── Tourist.tsx          # Busca por período de datas
│   └── Venues.tsx           # Grid completo de venues
├── components/
│   ├── EventCard.tsx        # Card com hero mode no desktop, badges de recorrência
│   ├── EventDetail.tsx      # Modal/sheet: vibe voting, share enriquecido
│   └── ErrorBoundary.tsx
├── hooks/
│   ├── useBora.ts               # Toggle reação "Bora!"
│   ├── useFollowVenue.ts        # Toggle follow/unfollow venue
│   ├── useNotifications.ts      # Poll unread-count a cada 60s
│   ├── usePushNotifications.ts  # Subscribe/unsubscribe VAPID
│   ├── useInstallPrompt.ts      # Captura beforeinstallprompt (PWA install)
│   ├── usePageTitle.ts          # document.title dinâmico
│   ├── useSaved.ts              # Toggle salvar evento
│   └── useSessionId.ts          # Fingerprint anônimo (localStorage)
├── utils/
│   └── dateHelpers.ts       # groupByDate, formatDateLabel, addDays, toDateKey
├── context/
│   ├── AuthContext.tsx      # Login/logout/user, JWT em localStorage (bf_token)
│   └── ToastContext.tsx     # Sistema de toast global
├── services/
│   └── api.ts               # Instância axios + tipos EventOut/VenueOut/etc.
└── test/
    └── setup.ts             # @testing-library/jest-dom
```

---

## Design system

Todas as variáveis CSS em `:root` no `App.css`:

```css
--accent:   #00e676   /* verde neon — só CTA principal */
--accent2:  #7c4dff   /* violeta — ações secundárias */
--accent3:  #00b8d4   /* cyan — filtro de bairro */
--bg:       #060908
--surface1: #0d110e
--text1:    #f0f4f1
--text2:    #8fa892
```

Fontes: **Syne** (headings) + **DM Sans** (body) via Google Fonts.

**Regra de animação:** só `transform` e `opacity` — nunca `height`/`width` (performance).  
**Breakpoints:** sidebar ≥ 900px, bottom nav < 900px, grid 2 colunas ≥ 1100px, 3 colunas ≥ 1400px.

---

## Rotas

| Path | Componente | Notas |
|------|-----------|-------|
| `/` | Feed | Critical path — carregado eager |
| `/agenda` | Agenda | 7 dias, week strip |
| `/locais` | Venues | Grid completo |
| `/mapa` | MapView | Leaflet, lazy |
| `/busca` | Search | Tabs + debounce 300ms |
| `/turista` | Tourist | Busca por datas |
| `/comunidades` | Communities | Join/leave + cupons |
| `/perfil` | Profile | Prefs + push toggle |
| `/parceiro` | PartnerDashboard | Requer autenticação |
| `/venue/:id` | VenueDetail | Check-in, follow, reviews |
| `/evento/:id` | EventPage | og:meta dinâmicas |
| `/reset-password` | ResetPassword | Token via query param |

---

## Testes

```bash
npm test              # roda uma vez (modo CI)
npm run test:watch    # modo interativo (desenvolvimento)
npm run test:coverage # relatório de cobertura HTML em coverage/
```

| Arquivo | O que cobre |
|---------|-------------|
| `src/utils/dateHelpers.test.ts` | `groupByDate`, `formatDateLabel` (Hoje/Amanhã/outra data), `addDays`, `toDateKey` |
| `src/services/api.test.ts` | City injection por endpoint, auth header, limpeza de token em 401 |
| `src/components/EventCard.test.tsx` | Render, badges (Destaque/Especial/Semanal/Mensal), preço, clique Bora!, acessibilidade teclado |

**Regra:** toda feature nova exige testes. Testes falhos bloqueiam o deploy (CI gate no GitHub Actions).

---

## Deploy

Push em `main` → GitHub Actions → testes → build → Azure Static Web Apps.

**Fluxo do workflow:**
1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 20, cache npm)
3. `npm ci && npm test` — falha aqui = deploy cancelado
4. `Azure/static-web-apps-deploy@v1` com `app_build_command: 'npm run build'`

> Não usar `skip_app_build: true` — deploya o source cru sem build.

### Secrets necessários no GitHub

| Secret | Obrigatório |
|--------|-------------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Sim |
| `VITE_API_BASE_URL` | Sim |
| `VITE_GOOGLE_CLIENT_ID` | Não |
| `VITE_VAPID_PUBLIC_KEY` | Não |

---

## Decisões técnicas

| Decisão | Escolha | Alternativa rejeitada | Motivo |
|---------|---------|----------------------|--------|
| CSS | CSS puro + custom properties | Tailwind | Controle total do design system dark |
| State | React Context | Redux/Zustand | Complexidade não justificada no escopo |
| Auth storage | localStorage (`bf_token`) | httpOnly cookie | Compatibilidade com PWA offline |
| Maps | Leaflet | Google Maps JS API | Sem quota, sem billing |
| Icons | Tabler Icons SVG | Emojis | Acessibilidade, consistência visual |
| Tests | Vitest + Testing Library | Jest + Enzyme | Zero config com Vite, testa comportamento |
