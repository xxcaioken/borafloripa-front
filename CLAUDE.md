# CLAUDE.md — borafloripa-front

> Contexto completo para qualquer sessão futura. Leia antes de tocar em código.

---

## Stack

| Tech | Versão | Obs |
|------|--------|-----|
| React | 19 | `useRef`, `useState`, `useEffect`, `useMemo`, `useCallback`, `lazy`, `Suspense` |
| TypeScript | 5.x | `strict: true` — zero `any` implícito |
| Vite | 5.x | Bundle target: ES2020 |
| React Router | v7 | `BrowserRouter`, `lazy` routes |
| Axios | — | instância em `src/services/api.ts` com `VITE_API_BASE_URL` |
| Leaflet + react-leaflet | v5 | Cast components: `_MapContainer as React.ComponentType<any>` |
| CSS puro | — | Custom properties em `:root`, sem Tailwind, sem styled-components |

---

## Estrutura de pastas

```
src/
├── App.tsx          ← Layout, Sidebar, BottomNav, Routes, EventPage, BackToTopBtn
├── App.css          ← TODOS os estilos (~4000 linhas), design tokens em :root
├── index.html       ← og:tags estáticas, manifest.json, theme-color
├── main.tsx         ← monta app + registra service worker (/sw.js)
├── pages/
│   ├── Feed.tsx         ← página principal: filtros, bairros, sort, Rola Hoje, entrada grátis
│   ├── Agenda.tsx       ← agenda semanal 7 dias (week strip)
│   ├── VenueDetail.tsx  ← check-in, follow, vibe voting, avaliações (reviews)
│   ├── Search.tsx       ← busca global (Tudo/Eventos/Locais), debounce 300ms
│   ├── Profile.tsx      ← preferências, feed de seguidos, push notifications toggle
│   ├── PartnerDashboard.tsx ← analytics SVG, lista de eventos
│   ├── Auth.tsx         ← email/senha + Google GSI (só se VITE_GOOGLE_CLIENT_ID)
│   ├── Communities.tsx  ← grupos por tag, join/leave
│   ├── MapView.tsx      ← Leaflet, pins SVG coloridos por categoria + pulse hot zone
│   ├── Tourist.tsx      ← agenda por data customizada
│   ├── Venues.tsx       ← grid de todos os venues
│   └── Onboarding.tsx   ← wizard de preferências (primeira visita)
├── components/
│   ├── EventCard.tsx    ← card de evento com hero mode
│   ├── EventDetail.tsx  ← modal/sheet com vibe voting, share enriquecido
│   └── ErrorBoundary.tsx
├── hooks/
│   ├── useBora.ts           ← toggle reação "Bora!" em evento
│   ├── useFollowVenue.ts    ← toggle follow/unfollow venue
│   ├── useNotifications.ts  ← poll /notifications/unread-count a cada 60s
│   ├── useInstallPrompt.ts  ← captura beforeinstallprompt para PWA install
│   ├── usePushNotifications.ts ← subscribe/unsubscribe VAPID push
│   ├── usePageTitle.ts      ← document.title dinâmico
│   ├── useSaved.ts          ← toggle salvar evento
│   └── useSessionId.ts      ← fingerprint anônimo do browser (localStorage)
├── utils/
│   └── dateHelpers.ts       ← groupByDate, formatDateLabel, addDays, toDateKey
├── context/
│   ├── AuthContext.tsx      ← login/logout/user, JWT em localStorage (bf_token)
│   └── ToastContext.tsx     ← sistema de toast global
└── services/
    └── api.ts               ← axios instance, tipos EventOut/VenueOut/etc.
```

---

## Design tokens (App.css :root)

```css
--accent:      #00e676   /* verde neon — só CTA principal */
--accent2:     #7c4dff   /* violeta — secondary */
--accent3:     #00b8d4   /* cyan — neighborhood filter */
--accent-dim:  rgba(0,230,118,0.12)
--bg:          #060908
--surface1:    #0d110e
--surface2:    #131a14
--surface3:    #1a231b
--border2:     rgba(255,255,255,0.09)
--text1:       #f0f4f1
--text2:       #8fa892
--muted:       #5a7060
--radius-xs:   8px
--radius-sm:   12px
--radius-md:   18px
```

Fontes: **Syne** (headings) + **DM Sans** (body) — carregadas via Google Fonts no index.html.

---

## Convenções

- **Animações**: só `transform` e `opacity` — nunca `height`/`width`
- **Mobile-first**: sidebar ≥ 900px, bottom nav < 900px
- **Lazy routes**: todo page/ é `lazy()` exceto Feed e Onboarding (critical path)
- **TypeScript**: sem `any` implícito; react-leaflet usa cast `as React.ComponentType<any>` (documentado)
- **Imports**: relativos (`../services/api`) — `baseUrl` removido do tsconfig
- **CSS classes**: snake-case com prefixo do componente (`vd-` = VenueDetail, `bell-` = notification bell)

---

## Variáveis de ambiente

| Variável | Onde | Obrigatório |
|----------|------|-------------|
| `VITE_API_BASE_URL` | `.env.local` / GitHub Secret | Sim |
| `VITE_GOOGLE_CLIENT_ID` | GitHub Secret | Não (botão Google some se ausente) |
| `VITE_VAPID_PUBLIC_KEY` | GitHub Secret | Não (push some se ausente) |

---

## Rotas disponíveis

| Path | Componente | Observação |
|------|-----------|------------|
| `/` | Feed | critical path |
| `/agenda` | Agenda | 7 dias, week strip |
| `/locais` | Venues | grid de venues |
| `/mapa` | MapView | Leaflet, pins SVG |
| `/busca` | Search | tabs + debounce |
| `/turista` | Tourist | agenda por datas |
| `/comunidades` | Communities | join/leave |
| `/perfil` | Profile | prefs + feed seguidos |
| `/parceiro` | PartnerDashboard | analytics |
| `/venue/:id` | VenueDetail | checkin + follow + vibes + reviews |
| `/evento/:id` | EventPage | og:meta injetadas dinamicamente |
| `/reset-password` | ResetPassword | — |

---

## O que foi feito (histórico de sessões)

### Sessão 1 (2026-04-03) — fundação
- Migração completa JS→TS (`strict: true`)
- Checkin button no VenueDetail
- Analytics SVG no PartnerDashboard
- Login com Google (GSI, sem npm)

### Sessão 2 (2026-04-03)
- Follow venues + push notifications (infra)
- Página de busca global (`/busca`)
- Curador "Rola hoje?" no Feed
- Filtro entrada grátis
- Fix: filtro de bairro (useMemo deps + free events)

### Sessão 3 (2026-04-04) — `feat/sprint-next`
- Agenda Semanal (`/agenda`) + `utils/dateHelpers.ts`
- Follow button + Vibe pulse no VenueDetail
- Smart empty state no Feed (mostra próximos eventos)
- Share enriquecido no EventDetail (data + preço no texto)

### Sessão 4 (2026-04-05) — `feat/sprint-2`
- Reviews de venues: estrelas + texto, upsert, avg/count
- Sino de notificações no topbar: badge, dropdown, polling 60s
- `useNotifications` hook (poll + markAllRead)
- `useInstallPrompt` hook (beforeinstallprompt PWA)
- Banner PWA install (dispensável, salvo em localStorage)
- EventPage: og:meta dinâmicas para share WhatsApp/Instagram
- Desktop layout: 2 colunas ≥1100px, 3 colunas ≥1400px no venue grid
- manifest.json: shortcuts, theme_color verde neon

---

## Pendências / bloqueadores de infraestrutura

| Item | O que falta |
|------|------------|
| Push notifications | `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_EMAIL` no Azure |
| Login Google | `VITE_GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_ID` no Azure |
| Ícones PWA PNG | Criar icon-192.png e icon-512.png (atualmente usa SVG) |
| Horários dos venues | Reexecutar scraper em dia útil (0/127 com horários) |

---

## Próximos passos recomendados

1. **Ativar push + Google login** (30min, só config Azure)
2. **Form de criar evento no PartnerDashboard** (back já tem POST/PUT/DELETE)
3. **EventPage layout próprio** (hoje renderiza o modal sobre feed, não tem página real)
4. **Eventos recorrentes** (`recurrence: weekly|biweekly` no Event)
5. **Cupons para comunidades** (model Coupon, parceiro cria, exibe no EventDetail)
