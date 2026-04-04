# Bora Floripa — Frontend

Interface do Bora Floripa. Construída com React 19 + Vite. Deploy automático para Azure Static Web Apps.

---

## Stack

- **React 19** + **React Router v7**
- **Vite 8** (build + dev server com proxy)
- **Axios** com interceptors (auth + city injection)
- **Leaflet** + React Leaflet (mapa)
- **CSS custom** — sem Tailwind, sem styled-components

---

## Rodar localmente

```bash
# 1. Clone e entre no diretório
git clone https://github.com/xxcaioken/borafloripa-front.git
cd borafloripa-front

# 2. Instale as dependências
npm install

# 3. (Opcional) configure o .env.local
# O Vite já faz proxy de /api → localhost:8000 por padrão
# Só necessário se o backend estiver em outra porta/host
cp .env.example .env.local

# 4. Inicie o dev server (backend deve estar rodando em :8000)
npm run dev
# Abrir: http://localhost:5173
```

### Variáveis de ambiente

| Variável | Dev | Produção |
|----------|-----|----------|
| `VITE_API_BASE_URL` | *(não necessário — proxy automático)* | `https://bora-floripa-api.azurewebsites.net` |
| `VITE_DEV_BACKEND_URL` | `http://localhost:8000` | — |

> Em dev, o Vite faz proxy automático de `/api` para `localhost:8000` via `vite.config.js`.  
> Em produção, `VITE_API_BASE_URL` é configurado como GitHub Secret.

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server com HMR |
| `npm run build` | Build de produção (output: `dist/`) |
| `npm run preview` | Preview do build local |
| `npm run lint` | Verificação ESLint |

---

## Páginas

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/` | `Feed.jsx` | Feed principal — busca, filtros, bairros, ordenação |
| `/locais` | `Venues.jsx` | Lista de todos os venues |
| `/mapa` | `MapView.jsx` | Mapa com pins de venues/eventos |
| `/parceiro` | `PartnerDashboard.jsx` | Dashboard do parceiro (requer login) |
| `/turista` | `Tourist.jsx` | Guia para turistas |
| `/comunidades` | `Communities.jsx` | Comunidades por estilo musical (requer login) |
| `/perfil` | `Profile.jsx` | Perfil do usuário |
| `*` | `NotFound.jsx` | 404 |

---

## Estrutura do projeto

```
borafloripa-front/
├── index.html
├── vite.config.js          # proxy /api → backend
├── package.json
├── .env.example
└── src/
    ├── App.jsx             # router, layout, sidebar, bottom nav
    ├── App.css             # design tokens, grid, breakpoints
    ├── main.jsx
    ├── pages/
    │   ├── Feed.jsx
    │   ├── Venues.jsx
    │   ├── MapView.jsx
    │   ├── PartnerDashboard.jsx
    │   ├── Tourist.jsx
    │   ├── Communities.jsx
    │   ├── Profile.jsx
    │   ├── Auth.jsx
    │   ├── Onboarding.jsx
    │   └── NotFound.jsx
    ├── components/
    │   ├── EventCard.jsx   # card com hero mode (bento desktop)
    │   ├── EventDetail.jsx # modal de detalhe do evento
    │   └── ErrorBoundary.jsx
    └── services/
        └── api.js          # axios + interceptors
```

---

## Design system

Tokens CSS em `:root` em `App.css`:

| Token | Valor | Uso |
|-------|-------|-----|
| `--accent` | `#00e676` | Verde neon — CTA principal |
| `--accent2` | `#7c4dff` | Violeta — destaque secundário |
| `--accent3` | `#00b8d4` | Cyan — filtros, banners |

**Fontes:** Syne (headings) + DM Sans (body)  
**Animações:** apenas `transform` e `opacity` — nunca `height`/`width`  
**Responsivo:** mobile-first; sidebar a partir de 900px; bottom nav some a partir de 900px

---

## Autenticação

- Token JWT salvo em `localStorage` (`bf_token`)
- Injetado automaticamente em todas as requisições via interceptor do Axios
- Em 401: token removido automaticamente

---

## Deploy (produção)

Push em `main` → GitHub Actions → Azure Static Web Apps.

> **Importante:** o workflow usa `app_build_command: 'npm run build'`.  
> Não usar `skip_app_build: true` — deploya o source cru sem build.
