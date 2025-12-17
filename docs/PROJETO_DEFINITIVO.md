═══════════════════════════════════════════════════════════════════════════════
🗺️ LOCALIST (KOALOCATE) - PROJETO DEFINITIVO
═══════════════════════════════════════════════════════════════════════════════

**Nome**: LocaList (anteriormente Koalocate/Monsan Maps)
**Descrição**: Sistema de mapeamento colaborativo profissional com reviews, favoritos e busca
**Domínio**: https://map.monsan.duckdns.org
**Versão**: 2.0 - Documento Executável Definitivo
**Data**: 17/12/2024

═══════════════════════════════════════════════════════════════════════════════
📊 ESTADO ATUAL DO PROJETO (71% COMPLETO)
═══════════════════════════════════════════════════════════════════════════════

✅ **15/21 COMMITS CORE IMPLEMENTADOS** (71%)

### ✅ Implementado e Funcional:

1. ✅ Lucide icons - 18 ícones profissionais integrados
2. ✅ Search history - Histórico localStorage (últimas 5 buscas)
3. ✅ Splash screen - Geolocalização GPS com animação
4. ✅ Haptic feedback - Vibração em todas interações mobile
5. ✅ Navigation service - History API com query params
6. ✅ BottomSheet - Swipe gestures (30% ↔ 80%)
7. ✅ Review system - Completo (rating, comentário, fotos, upvotes)
8. ✅ Favorite pins - Sistema + página /favorites
9. ✅ Ghost Pin - Criação interativa com verificação proximidade
10. ✅ Category icons - 18 categorias Lucide com cores
11. ✅ User location pin - Tracking GPS + pulse animation
12. ✅ Pin clustering - MarkerCluster para performance
13. ✅ Content moderation - Filtro profanidade + spam
14. ✅ Rate limiting - Anti-spam client-side
15. ✅ Error handling - Handler centralizado + página 404

### 🔧 Infraestrutura Completa:

✅ SvelteKit + TypeScript strict + adapter-node
✅ Supabase (Database + Auth + RLS + Índices)
✅ Cloudflare R2 (Upload imagens com compressão WebP/JPEG)
✅ Leaflet.js + MarkerCluster
✅ Photon OSM API (Geocoding + Reverse)
✅ SSO com Monsan Auth (cookies compartilhadas)
✅ i18n completo (pt-BR + en-US)
✅ Tema claro/escuro/auto
✅ Stores reativos (Svelte 5 Runes)
✅ Services layer (pins, categories, storage, navigation)

═══════════════════════════════════════════════════════════════════════════════
🎯 FASE 1: CRÍTICA - BLOQUEADORES DE PRODUÇÃO (OBRIGATÓRIO)
═══════════════════════════════════════════════════════════════════════════════

Estas tarefas DEVEM ser implementadas antes de qualquer deploy em produção.
São bloqueadores críticos de segurança, SEO e usabilidade.

───────────────────────────────────────────────────────────────────────────────
TAREFA 1.1: Remover console.logs e implementar logging profissional
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🔴 CRÍTICA
**Tempo estimado**: 1-2 horas
**Relacionado**: Todo o projeto

**O que fazer**:

1. Criar `src/lib/utils/logger.ts`:
   ```typescript
   type LogLevel = 'debug' | 'info' | 'warn' | 'error';
   
   class Logger {
     private isDev = import.meta.env.DEV;
     
     debug(message: string, context?: any) {
       if (this.isDev) {
         console.log(`[DEBUG]`, message, context);
       }
     }
     
     info(message: string, context?: any) {
       if (this.isDev) {
         console.info(`[INFO]`, message, context);
       }
     }
     
     warn(message: string, context?: any) {
       console.warn(`[WARN]`, message, context);
       // Em produção: enviar para Sentry
     }
     
     error(message: string, error?: any) {
       console.error(`[ERROR]`, message, error);
       // Em produção: enviar para Sentry
       if (!this.isDev && typeof window !== 'undefined') {
         // Sentry.captureException(error);
       }
     }
   }
   
   export const logger = new Logger();
   ```

2. Buscar e substituir TODOS os `console.log`:
   - `console.log` → `logger.debug`
   - `console.info` → `logger.info`
   - `console.warn` → `logger.warn`
   - `console.error` → `logger.error`

3. Arquivos específicos mencionados:
   - `src/lib/services/pins.service.ts:265`
   - `src/routes/+layout.svelte:89`
   - Fazer busca global: `grep -r "console\." src/`

4. Validar build de produção:
   - `npm run build`
   - Verificar que não há console.logs no bundle

**Teste**:
- Build de produção não deve ter logs no console
- Em desenvolvimento: logs devem aparecer normalmente

───────────────────────────────────────────────────────────────────────────────
TAREFA 1.2: Implementar validação robusta de inputs
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🔴 CRÍTICA
**Tempo estimado**: 3-4 horas
**Relacionado**: Todos os formulários

**O que fazer**:

1. Criar `src/lib/utils/validation.ts`:
   ```typescript
   import DOMPurify from 'isomorphic-dompurify';
   
   export const validation = {
     // Coordenadas
     isValidLat(lat: number): boolean {
       return lat >= -90 && lat <= 90;
     },
     
     isValidLng(lng: number): boolean {
       return lng >= -180 && lng <= 180;
     },
     
     // Strings
     sanitizeHTML(dirty: string): string {
       return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
     },
     
     isValidPinName(name: string): boolean {
       return name.length >= 3 && name.length <= 255;
     },
     
     isValidDescription(desc: string): boolean {
       return desc.length <= 1000;
     },
     
     isValidComment(comment: string): boolean {
       return comment.length >= 1 && comment.length <= 500;
     },
     
     // Email
     isValidEmail(email: string): boolean {
       const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
       return regex.test(email);
     },
     
     // UUID
     isValidUUID(uuid: string): boolean {
       const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
       return regex.test(uuid);
     },
     
     // Imagem
     isValidImageType(file: File): boolean {
       const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
       return validTypes.includes(file.type);
     },
     
     isValidImageSize(file: File, maxMB = 5): boolean {
       return file.size <= maxMB * 1024 * 1024;
     }
   };
   ```

2. Instalar: `bun add isomorphic-dompurify`

3. Aplicar validação em TODOS os formulários:
   - `GhostPinModal.svelte` - validar nome, descrição, coordenadas
   - `ReviewForm.svelte` - validar comentário, rating, fotos
   - `pins.service.ts` - validar server-side também

4. Server-side validation em API routes (se houver)

**Teste**:
- Tentar inserir: `<script>alert('xss')</script>` → deve sanitizar
- Tentar coordenadas inválidas: lat=999 → deve rejeitar
- Tentar imagem > 5MB → deve rejeitar

───────────────────────────────────────────────────────────────────────────────
TAREFA 1.3: Melhorar mensagem de criar novo local (CRÍTICA UX)
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🔴 CRÍTICA
**Tempo estimado**: 2-3 horas
**Relacionado**: Commit 9 (Ghost Pin)

**O que fazer**:

1. Em `GhostPinModal.svelte`:
   - Centralizar modal corretamente (flexbox center)
   - Fazer reverse geocoding com Photon API:
     ```typescript
     async function reverseGeocode(lat: number, lng: number) {
       const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
       const res = await fetch(url);
       const data = await res.json();
       return data.features[0]?.properties;
     }
     ```
   - Exibir: **"Criar local em: Rua X, 123 - Bairro Y"**
   - Melhorar ghost pin visual:
     - Pulsar mais suave
     - Cor mais visível
     - Ícone de MapPin do Lucide

2. Validar coordenadas antes de abrir modal:
   ```typescript
   if (!validation.isValidLat(lat) || !validation.isValidLng(lng)) {
     toast.error('Coordenadas inválidas');
     return;
   }
   ```

3. CSS do modal:
   ```css
   .ghost-pin-modal {
     display: flex;
     flex-direction: column;
     align-items: center;
     justify-content: center;
     text-align: center;
   }
   ```

**Teste**:
- Clicar no mapa → verificar endereço aparece
- Coordenadas inválidas → verificar erro
- Modal centralizado em mobile e desktop

───────────────────────────────────────────────────────────────────────────────
TAREFA 1.4: Detectar idioma automaticamente (ALTA PRIORIDADE)
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🔴 CRÍTICA
**Tempo estimado**: 1 hora
**Relacionado**: i18n já implementado

**O que fazer**:

1. Em `src/lib/i18n/i18n.svelte.ts`:
   ```typescript
   function detectLanguage(): 'pt-BR' | 'en-US' {
     // 1. Verificar localStorage (preferência do usuário)
     const saved = localStorage.getItem('language');
     if (saved) return saved as any;
     
     // 2. Detectar do navegador
     const browserLang = navigator.language || navigator.languages?.[0] || 'pt-BR';
     
     // 3. Mapear códigos
     if (browserLang.startsWith('pt')) return 'pt-BR';
     if (browserLang.startsWith('en')) return 'en-US';
     
     // 4. Fallback
     return 'pt-BR';
   }
   
   class I18n {
     locale = $state<Locale>(detectLanguage());
     
     init() {
       this.locale = detectLanguage();
       this.updateHtmlLang();
     }
     
     setLocale(locale: Locale) {
       this.locale = locale;
       localStorage.setItem('language', locale);
       this.updateHtmlLang();
     }
     
     private updateHtmlLang() {
       if (typeof document !== 'undefined') {
         document.documentElement.lang = this.locale;
       }
     }
   }
   ```

2. Chamar `i18n.init()` em `+layout.svelte`:
   ```svelte
   onMount(() => {
     i18n.init();
   });
   ```

3. Atualizar `src/app.html`:
   ```html
   <html lang="pt-BR">
   ```

**Teste**:
- Mudar idioma do navegador para inglês → verificar app detecta
- Mudar manualmente no app → verificar respeita escolha
- Recarregar → verificar mantém idioma escolhido

───────────────────────────────────────────────────────────────────────────────
TAREFA 1.5: Implementar meta tags e SEO completo
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🔴 CRÍTICA
**Tempo estimado**: 2-3 horas
**Relacionado**: SEO

**O que fazer**:

1. Criar `src/lib/utils/seo.ts`:
   ```typescript
   interface SEOProps {
     title: string;
     description: string;
     image?: string;
     url?: string;
     type?: 'website' | 'article';
   }
   
   export function generateMetaTags(props: SEOProps) {
     const baseUrl = 'https://map.monsan.duckdns.org';
     const defaultImage = `${baseUrl}/og-image.png`;
     
     return {
       title: props.title,
       description: props.description,
       og: {
         title: props.title,
         description: props.description,
         image: props.image || defaultImage,
         url: props.url || baseUrl,
         type: props.type || 'website'
       },
       twitter: {
         card: 'summary_large_image',
         title: props.title,
         description: props.description,
         image: props.image || defaultImage
       }
     };
   }
   ```

2. Em `src/routes/+page.svelte`:
   ```svelte
   <script>
     import { generateMetaTags } from '$lib/utils/seo';
     const meta = generateMetaTags({
       title: 'LocaList - Mapeamento Colaborativo',
       description: 'Descubra e compartilhe locais incríveis com reviews e fotos',
       url: 'https://map.monsan.duckdns.org'
     });
   </script>
   
   <svelte:head>
     <title>{meta.title}</title>
     <meta name="description" content={meta.description} />
     <meta property="og:title" content={meta.og.title} />
     <meta property="og:description" content={meta.og.description} />
     <meta property="og:image" content={meta.og.image} />
     <meta property="og:url" content={meta.og.url} />
     <meta property="og:type" content={meta.og.type} />
     <meta name="twitter:card" content={meta.twitter.card} />
     <meta name="twitter:title" content={meta.twitter.title} />
     <meta name="twitter:description" content={meta.twitter.description} />
     <meta name="twitter:image" content={meta.twitter.image} />
     <link rel="canonical" href={meta.og.url} />
   </svelte:head>
   ```

3. Para página de pin (quando `?pin=X`):
   - Usar dados do pin nas meta tags
   - Foto do pin como og:image
   - Nome do pin como title

4. Criar `static/og-image.png` (1200x630px) - logo do app

**Teste**:
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator

───────────────────────────────────────────────────────────────────────────────
TAREFA 1.6: Criar sitemap.xml dinâmico
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🔴 CRÍTICA
**Tempo estimado**: 1-2 horas
**Relacionado**: SEO

**O que fazer**:

1. Criar `src/routes/sitemap.xml/+server.ts`:
   ```typescript
   import { supabase } from '$lib/services/supabase';
   import type { RequestHandler } from './$types';
   
   export const GET: RequestHandler = async () => {
     const baseUrl = 'https://map.monsan.duckdns.org';
     
     // Buscar pins públicos
     const { data: pins } = await supabase
       .from('map_pins')
       .select('id, updated_at')
       .eq('is_public', true)
       .limit(50000); // Limite do Google
     
     const xml = `<?xml version="1.0" encoding="UTF-8"?>
     <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
       <url>
         <loc>${baseUrl}/</loc>
         <changefreq>daily</changefreq>
         <priority>1.0</priority>
       </url>
       <url>
         <loc>${baseUrl}/favorites</loc>
         <changefreq>weekly</changefreq>
         <priority>0.5</priority>
       </url>
       ${pins?.map(pin => `
         <url>
           <loc>${baseUrl}/?pin=${pin.id}</loc>
           <lastmod>${new Date(pin.updated_at).toISOString()}</lastmod>
           <changefreq>weekly</changefreq>
           <priority>0.8</priority>
         </url>
       `).join('')}
     </urlset>`;
     
     return new Response(xml, {
       headers: {
         'Content-Type': 'application/xml',
         'Cache-Control': 'max-age=3600' // Cache 1 hora
       }
     });
   };
   ```

2. Atualizar `static/robots.txt`:
   ```
   User-agent: *
   Allow: /
   Disallow: /api/
   
   Sitemap: https://map.monsan.duckdns.org/sitemap.xml
   Crawl-delay: 1
   ```

**Teste**:
- Acessar `/sitemap.xml` → verificar XML válido
- Google Search Console → submeter sitemap

───────────────────────────────────────────────────────────────────────────────
TAREFA 1.7: Auditoria completa de acessibilidade (a11y)
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🔴 CRÍTICA
**Tempo estimado**: 4-6 horas
**Relacionado**: Todo o projeto

**O que fazer**:

1. **Revisar TODOS os aria-labels**:
   - SearchBar: botões de busca e limpar
   - Dock: todos os botões
   - ProfileMenu: botões de tema e idioma
   - BottomSheet: botão fechar
   - ReviewForm: botões de rating

2. **Adicionar aria-live**:
   - Toast: `<div role="status" aria-live="polite">`
   - SearchResults: `<div role="region" aria-live="polite">`

3. **Adicionar roles apropriados**:
   - Modais: `role="dialog" aria-modal="true"`
   - Listas: `role="list"` e items com `role="listitem"`

4. **Hierarquia de headings**:
   - Garantir h1 → h2 → h3 (sem pular)
   - Cada página deve ter APENAS 1 h1

5. **Navegação por teclado**:
   - Tab em todos os elementos interativos
   - Enter/Space ativam botões
   - ESC fecha modais
   - Setas navegam em listas

6. **Focus trap em modais**:
   - Criar `src/lib/utils/focusTrap.ts`:
     ```typescript
     export function focusTrap(node: HTMLElement) {
       const focusableElements = node.querySelectorAll(
         'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
       );
       const firstElement = focusableElements[0] as HTMLElement;
       const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
       
       function handleKeyDown(e: KeyboardEvent) {
         if (e.key === 'Tab') {
           if (e.shiftKey && document.activeElement === firstElement) {
             e.preventDefault();
             lastElement.focus();
           } else if (!e.shiftKey && document.activeElement === lastElement) {
             e.preventDefault();
             firstElement.focus();
           }
         }
       }
       
       node.addEventListener('keydown', handleKeyDown);
       firstElement?.focus();
       
       return {
         destroy() {
           node.removeEventListener('keydown', handleKeyDown);
         }
       };
     }
     ```

7. **Contraste de cores**:
   - Verificar todos os textos: mínimo 4.5:1
   - Usar ferramenta: https://whocanuse.com/

8. **Alt text em imagens**:
   - Fotos de pins: `alt="Foto de [nome do local]"`
   - Avatar de usuário: `alt="Avatar de [nome]"`
   - Decorativas: `alt=""`

9. **Focus visible**:
   - Garantir outline em todos os elementos focados
   - Usar `:focus-visible` para não aparecer no click

10. **Skip links**:
    - Adicionar em `+layout.svelte`:
      ```svelte
      <a href="#main-content" class="skip-link">
        Pular para conteúdo principal
      </a>
      
      <main id="main-content">
        <slot />
      </main>
      ```

**Teste**:
- Lighthouse Accessibility > 95
- Navegar TODO o app apenas com teclado
- Testar com screen reader (NVDA no Windows)

═══════════════════════════════════════════════════════════════════════════════
🎨 FASE 2: ALTA - MELHORIAS DE UX E QUALIDADE (RECOMENDADO)
═══════════════════════════════════════════════════════════════════════════════

Estas tarefas melhoram significativamente a experiência do usuário e a qualidade
percebida da aplicação. Altamente recomendadas antes do lançamento.

───────────────────────────────────────────────────────────────────────────────
TAREFA 2.1: Deixar local pesquisado em evidência
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟠 ALTA
**Tempo estimado**: 2 horas
**Relacionado**: Commits 6 (BottomSheet) e 12 (Clustering)

**O que fazer**:

1. Em `src/lib/components/map/map.svelte.ts`:
   ```typescript
   selectedPinId = $state<string | null>(null);
   
   selectPin(pinId: string) {
     this.selectedPinId = pinId;
     // Adicionar classe .pin-selected ao marker
   }
   
   deselectPin() {
     this.selectedPinId = null;
   }
   ```

2. Criar CSS em `src/lib/styles/pins.css`:
   ```css
   .pin-selected {
     filter: drop-shadow(0 0 8px var(--brand-primary)) !important;
     z-index: 1000 !important;
     animation: pinBounce 0.6s ease-out;
   }
   
   @keyframes pinBounce {
     0%, 100% { transform: translateY(0); }
     25% { transform: translateY(-10px); }
     50% { transform: translateY(0); }
     75% { transform: translateY(-5px); }
   }
   ```

3. Integrar com BottomSheet:
   - Quando abre BottomSheet: `mapState.selectPin(pin.id)`
   - Quando fecha: `mapState.deselectPin()`

4. Zoom suave para o pin:
   ```typescript
   this.map?.flyTo([lat, lng], 16, { duration: 0.5 });
   ```

**Teste**:
- Buscar local → verificar pin destaca e faz bounce
- Fechar BottomSheet → verificar destaque remove

───────────────────────────────────────────────────────────────────────────────
TAREFA 2.2: Melhorar animação e estética do toast
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟠 ALTA
**Tempo estimado**: 2 horas
**Relacionado**: Toast já implementado

**O que fazer**:

1. Substituir emojis por Lucide icons em `Toast.svelte`:
   ```svelte
   import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-svelte';
   
   const icons = {
     success: CheckCircle,
     error: XCircle,
     warning: AlertTriangle,
     info: Info
   };
   ```

2. Melhorar animações CSS:
   ```css
   .toast {
     animation: slideDown 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
   }
   
   .toast.closing {
     animation: slideUp 200ms ease-in forwards;
   }
   
   @keyframes slideDown {
     from {
       transform: translateY(-100%);
       opacity: 0;
     }
     to {
       transform: translateY(0);
       opacity: 1;
     }
   }
   
   @keyframes slideUp {
     to {
       transform: translateY(-100%);
       opacity: 0;
     }
   }
   ```

3. Adicionar progress bar:
   ```svelte
   <div class="toast-progress" style="animation-duration: {duration}ms"></div>
   ```
   
   ```css
   .toast-progress {
     position: absolute;
     bottom: 0;
     left: 0;
     height: 3px;
     background: currentColor;
     opacity: 0.5;
     animation: progressBar linear forwards;
   }
   
   @keyframes progressBar {
     from { width: 100%; }
     to { width: 0%; }
   }
   ```

4. Implementar toast queue em `toast.svelte.ts`:
   ```typescript
   toasts = $state<Toast[]>([]);
   maxToasts = 3;
   
   show(message: string, type: ToastType) {
     const toast = { id: Date.now(), message, type };
     
     if (this.toasts.length >= this.maxToasts) {
       this.toasts.shift(); // Remove mais antigo
     }
     
     this.toasts.push(toast);
     
     setTimeout(() => {
       this.remove(toast.id);
     }, 5000);
   }
   ```

5. Posicionar no topo da tela:
   ```css
   .toast-container {
     position: fixed;
     top: var(--lg);
     left: 50%;
     transform: translateX(-50%);
     z-index: var(--z-toast);
   }
   ```

**Teste**:
- Disparar múltiplos toasts → verificar empilham corretamente
- Verificar animações suaves
- Progress bar deve diminuir em 5s

───────────────────────────────────────────────────────────────────────────────
TAREFA 2.3: Revisar cobertura de traduções (i18n)
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟠 ALTA
**Tempo estimado**: 2-3 horas
**Relacionado**: i18n já implementado

**O que fazer**:

1. Fazer auditoria de textos hardcoded:
   - Buscar por strings entre aspas nos componentes
   - Buscar por `placeholder`, `title`, `aria-label` sem i18n

2. Adicionar traduções faltantes em `pt-BR.ts` e `en-US.ts`:
   - Mensagens de validação
   - Labels de formulários
   - Tooltips
   - Placeholders
   - Aria-labels

3. Padronizar keys de tradução:
   - Usar dot notation: `errors.loginRequired`
   - Agrupar por contexto: `pin.*`, `review.*`, `search.*`

4. Traduzir TODAS as mensagens de erro

5. Verificar nomes de categorias estão traduzidos

**Teste**:
- Alternar idioma → verificar TUDO está traduzido
- Não deve haver texto em inglês quando idioma é pt-BR

───────────────────────────────────────────────────────────────────────────────
TAREFA 2.4: Expandir lista de palavras proibidas (moderação)
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟠 ALTA
**Tempo estimado**: 1-2 horas
**Relacionado**: profanityFilter já implementado

**O que fazer**:

1. Opção 1 (Rápida): Expandir lista manual em `profanityFilter.ts`
   - Adicionar 50+ palavras ofensivas em pt-BR
   - Adicionar 50+ palavras ofensivas em en-US
   - Adicionar palavras de spam: "compre agora", "clique aqui"

2. Opção 2 (Profissional): Usar biblioteca externa
   ```bash
   bun add bad-words-ptbr bad-words
   ```
   
   ```typescript
   import BadWordsPT from 'bad-words-ptbr';
   import BadWords from 'bad-words';
   
   const filterPT = new BadWordsPT();
   const filterEN = new BadWords();
   
   export class ProfanityFilter {
     static contains(text: string, locale: 'pt-BR' | 'en-US' = 'pt-BR'): boolean {
       if (locale === 'pt-BR') {
         return filterPT.isProfane(text);
       }
       return filterEN.isProfane(text);
     }
   }
   ```

3. Implementar sistema de reports (já existe, validar):
   - Botão "Denunciar" em reviews
   - Salvar em `map_review_reports`

**Teste**:
- Tentar postar palavrão → deve bloquear
- Tentar spam → deve detectar

═══════════════════════════════════════════════════════════════════════════════
⚡ FASE 3: MÉDIA - OTIMIZAÇÃO E REFINAMENTO (IMPORTANTE)
═══════════════════════════════════════════════════════════════════════════════

Melhorias de performance, UX e refinamento visual. Importantes mas não bloqueantes.

───────────────────────────────────────────────────────────────────────────────
TAREFA 3.1: Tema como toggle switch (UX melhorada)
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟡 MÉDIA
**Tempo estimado**: 1-2 horas

**O que fazer**:

1. Em `ProfileMenu.svelte`, substituir lista por segmented control:
   ```svelte
   <div class="theme-toggle">
     <button
       class:active={theme === 'light'}
       onclick={() => themeState.setTheme('light')}
       aria-label="Tema claro"
     >
       <Sun size={18} />
     </button>
     <button
       class:active={theme === 'auto'}
       onclick={() => themeState.setTheme('auto')}
       aria-label="Tema automático"
     >
       <SunMoon size={18} />
     </button>
     <button
       class:active={theme === 'dark'}
       onclick={() => themeState.setTheme('dark')}
       aria-label="Tema escuro"
     >
       <Moon size={18} />
     </button>
   </div>
   ```

2. CSS:
   ```css
   .theme-toggle {
     display: flex;
     gap: 0;
     background: var(--bg-2);
     border-radius: var(--radius-md);
     padding: 2px;
   }
   
   .theme-toggle button {
     padding: var(--xs) var(--sm);
     border: none;
     background: transparent;
     color: var(--text-secondary);
     transition: all 200ms;
   }
   
   .theme-toggle button.active {
     background: var(--brand-primary);
     color: white;
     border-radius: var(--radius-sm);
   }
   ```

**Teste**:
- Alternar tema → verificar animação suave
- Verificar visual compacto

───────────────────────────────────────────────────────────────────────────────
TAREFA 3.2: Idioma com radio buttons de bandeiras
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟡 MÉDIA
**Tempo estimado**: 1 hora

**O que fazer**:

1. Em `ProfileMenu.svelte`:
   ```svelte
   <div class="language-toggle">
     <button
       class:active={locale === 'pt-BR'}
       onclick={() => i18n.setLocale('pt-BR')}
       aria-label="Português"
     >
       🇧🇷 Português
     </button>
     <button
       class:active={locale === 'en-US'}
       onclick={() => i18n.setLocale('en-US')}
       aria-label="English"
     >
       🇺🇸 English
     </button>
   </div>
   ```

2. CSS (mesmo do theme-toggle)

**Teste**:
- Alternar idioma → verificar UI atualiza

───────────────────────────────────────────────────────────────────────────────
TAREFA 3.3: Melhorar efeito de loading da SearchBar
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟡 MÉDIA
**Tempo estimado**: 1-2 horas

**O que fazer**:

1. Shimmer effect na progress bar:
   ```css
   .search-progress {
     background: linear-gradient(
       90deg,
       var(--brand-primary) 0%,
       var(--brand-secondary) 50%,
       var(--brand-primary) 100%
     );
     background-size: 200% 100%;
     animation: shimmer 1.5s infinite;
   }
   
   @keyframes shimmer {
     0% { background-position: -200% 0; }
     100% { background-position: 200% 0; }
   }
   ```

2. Skeleton loading em `SearchResults.svelte`:
   ```svelte
   {#if loading}
     {#each Array(3) as _}
       <div class="result-skeleton">
         <div class="skeleton-icon"></div>
         <div class="skeleton-text"></div>
       </div>
     {/each}
   {/if}
   ```
   
   ```css
   .result-skeleton {
     display: flex;
     gap: var(--sm);
     padding: var(--sm);
     animation: pulse 1.5s infinite;
   }
   
   @keyframes pulse {
     0%, 100% { opacity: 1; }
     50% { opacity: 0.5; }
   }
   ```

3. Transições suaves:
   ```svelte
   <div class="results" transition:slide={{ duration: 300 }}>
   ```

**Teste**:
- Fazer busca → verificar shimmer effect
- Skeleton deve aparecer durante loading

───────────────────────────────────────────────────────────────────────────────
TAREFA 3.4: Hover do botão de pesquisa invisível
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟡 MÉDIA
**Tempo estimado**: 30 minutos

**O que fazer**:

1. Em `SearchBar.svelte`:
   ```css
   .search-button:disabled {
     pointer-events: none;
   }
   
   .search-button:not(:disabled):hover {
     background: var(--bg-2);
   }
   
   .clear-button:hover {
     background: var(--bg-2);
   }
   ```

**Teste**:
- Input vazio → botão não tem hover
- Input com texto → botão X tem hover

───────────────────────────────────────────────────────────────────────────────
TAREFA 3.5: Melhorar Splash Screen
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟡 MÉDIA
**Tempo estimado**: 1-2 horas

**O que fazer**:

1. Em `Splash.svelte`:
   ```svelte
   <div class="splash">
     <div class="logo" style="animation-delay: 0ms">
       <LogoIcon />
     </div>
     <div class="loader" style="animation-delay: 300ms">
       <Loader2 />
     </div>
     <p class="message" style="animation-delay: 600ms">
       {loadingMessage}
     </p>
   </div>
   ```

2. CSS:
   ```css
   .logo {
     animation: fadeInScale 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
   }
   
   @keyframes fadeInScale {
     from {
       opacity: 0;
       transform: scale(0.8);
     }
     to {
       opacity: 1;
       transform: scale(1);
     }
   }
   
   .splash.closing {
     animation: fadeOut 800ms ease-out forwards;
   }
   ```

3. Mensagens contextuais:
   ```typescript
   let loadingMessage = $state('Carregando mapa...');
   
   onMount(() => {
     setTimeout(() => {
       loadingMessage = 'Obtendo sua localização...';
     }, 1000);
   });
   ```

**Teste**:
- Recarregar app → verificar animações suaves
- Transição para mapa deve ser fluida

───────────────────────────────────────────────────────────────────────────────
TAREFA 3.6: Otimizar renderização do mapa (Performance)
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟡 MÉDIA
**Tempo estimado**: 3-4 horas

**O que fazer**:

1. Lazy load de pins fora do viewport:
   ```typescript
   loadPinsInBounds() {
     const bounds = this.map!.getBounds();
     const buffer = 0.2; // 20% de buffer
     
     const ne = bounds.getNorthEast();
     const sw = bounds.getSouthWest();
     
     // Buscar apenas pins visíveis + buffer
     pinsService.fetchByBounds(
       sw.lat - buffer,
       sw.lng - buffer,
       ne.lat + buffer,
       ne.lng + buffer
     );
   }
   ```

2. Debounce na movimentação:
   ```typescript
   map.on('moveend', debounce(() => {
     this.loadPinsInBounds();
   }, 300));
   ```

3. Virtualização de markers:
   - Renderizar apenas markers visíveis
   - Remover markers fora do viewport

4. Limitar pins simultâneos:
   ```typescript
   const MAX_PINS = 500;
   ```

**Teste**:
- Carregar 1000+ pins → verificar performance mantém
- FPS deve manter > 30 ao mover mapa

───────────────────────────────────────────────────────────────────────────────
TAREFA 3.7: Implementar caching estratégico
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟡 MÉDIA
**Tempo estimado**: 2-3 horas

**O que fazer**:

1. Criar `src/lib/utils/cache.ts`:
   ```typescript
   import { openDB } from 'idb';
   
   const DB_NAME = 'localista-cache';
   const PINS_STORE = 'pins';
   
   export const cache = {
     async savePins(bounds: string, pins: Pin[]) {
       const db = await openDB(DB_NAME, 1);
       await db.put(PINS_STORE, {
         bounds,
         pins,
         timestamp: Date.now()
       });
     },
     
     async getPins(bounds: string): Promise<Pin[] | null> {
       const db = await openDB(DB_NAME, 1);
       const cached = await db.get(PINS_STORE, bounds);
       
       if (!cached) return null;
       
       // Expirar após 1 hora
       if (Date.now() - cached.timestamp > 3600000) {
         return null;
       }
       
       return cached.pins;
     }
   };
   ```

2. Instalar: `bun add idb`

3. Usar no `pins.service.ts`:
   ```typescript
   async fetchByBounds(lat1, lng1, lat2, lng2) {
     const boundsKey = `${lat1},${lng1},${lat2},${lng2}`;
     
     // Tentar cache primeiro
     const cached = await cache.getPins(boundsKey);
     if (cached) return cached;
     
     // Buscar do servidor
     const pins = await supabase...
     
     // Salvar em cache
     await cache.savePins(boundsKey, pins);
     
     return pins;
   }
   ```

4. Cache de categorias em localStorage (raramente mudam)

**Teste**:
- Visitar área → sair → voltar → verificar carrega do cache
- Cache deve expirar após 1 hora

═══════════════════════════════════════════════════════════════════════════════
📊 FASE 4: BAIXA - REFINAMENTOS E EXTRAS (OPCIONAL)
═══════════════════════════════════════════════════════════════════════════════

Melhorias estéticas e funcionalidades extras. Podem ser implementadas após lançamento.

───────────────────────────────────────────────────────────────────────────────
TAREFA 4.1: Melhorar hover dos buttons
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟢 BAIXA
**Tempo estimado**: 1 hora

**O que fazer**:

1. Em `Button.svelte`:
   ```css
   .button {
     transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
   }
   
   .button:hover {
     transform: scale(1.02);
     box-shadow: var(--shadow-md);
   }
   
   .button:active {
     transform: scale(0.98);
   }
   ```

**Teste**:
- Hover em botões → verificar animação suave

───────────────────────────────────────────────────────────────────────────────
TAREFA 4.2: Melhorar ícone de GPS
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟢 BAIXA
**Tempo estimado**: 30 minutos

**O que fazer**:

1. Em `Dock.svelte`, substituir `Navigation` por `Locate`:
   ```svelte
   import { Locate } from 'lucide-svelte';
   
   <button onclick={handleCenterOnUser} aria-label="Centralizar no GPS">
     <Locate size={24} />
   </button>
   ```

2. Adicionar pulse quando localizando:
   ```css
   .gps-button.locating {
     animation: pulse 1s infinite;
   }
   ```

**Teste**:
- Clicar em GPS → verificar ícone mais representativo

───────────────────────────────────────────────────────────────────────────────
TAREFA 4.3: Criar reviews aleatórios para teste (BH e Curitiba)
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: 🟢 BAIXA
**Tempo estimado**: 2-3 horas

**O que fazer**:

1. Criar `scripts/seed-reviews.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   
   const supabase = createClient(
     process.env.PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   );
   
   const locations = {
     bh: [
       { name: 'Praça da Liberdade', lat: -19.9321, lng: -43.9378, category: 'park' },
       { name: 'Mercado Central', lat: -19.9203, lng: -43.9420, category: 'market' },
       // ... mais 48 locais
     ],
     curitiba: [
       { name: 'Jardim Botânico', lat: -25.4449, lng: -49.2390, category: 'park' },
       // ... mais 49 locais
     ]
   };
   
   const comments = [
     'Lugar incrível! Recomendo muito.',
     'Ótima experiência, voltarei com certeza.',
     // ... mais comentários
   ];
   
   async function seed() {
     for (const [city, locs] of Object.entries(locations)) {
       for (const loc of locs) {
         // Criar pin
         const { data: pin } = await supabase
           .from('map_pins')
           .insert({ ...loc, is_public: true })
           .select()
           .single();
         
         // Criar 3-5 reviews por pin
         const numReviews = Math.floor(Math.random() * 3) + 3;
         for (let i = 0; i < numReviews; i++) {
           await supabase.from('map_reviews').insert({
             pin_id: pin.id,
             user_id: 'USER_ID_AQUI',
             rating: Math.floor(Math.random() * 5) + 1,
             comment: comments[Math.floor(Math.random() * comments.length)]
           });
         }
       }
     }
   }
   
   seed();
   ```

2. Rodar: `bun run scripts/seed-reviews.ts`

**Teste**:
- Verificar pins e reviews no banco

═══════════════════════════════════════════════════════════════════════════════
🚀 FASE 5: PWA E AVANÇADO (PÓS-LANÇAMENTO)
═══════════════════════════════════════════════════════════════════════════════

Funcionalidades avançadas que transformam a aplicação em PWA completo.

───────────────────────────────────────────────────────────────────────────────
TAREFA 5.1: Implementar Service Worker (PWA)
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: ⚪ OPCIONAL
**Tempo estimado**: 4-6 horas

**O que fazer**:

1. Criar `static/sw.js`
2. Implementar estratégias de cache
3. Offline fallback
4. Background sync

*(Detalhes completos no ROADMAP_COMPLETO.md)*

───────────────────────────────────────────────────────────────────────────────
TAREFA 5.2: Criar manifest.json (PWA)
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: ⚪ OPCIONAL
**Tempo estimado**: 1-2 horas

*(Detalhes completos no ROADMAP_COMPLETO.md)*

───────────────────────────────────────────────────────────────────────────────
TAREFA 5.3: Implementar Realtime subscriptions (Supabase)
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: ⚪ OPCIONAL
**Tempo estimado**: 2-3 horas

*(Da lista de commits extras - COMMIT 15)*

───────────────────────────────────────────────────────────────────────────────
TAREFA 5.4: Routing com GraphHopper API
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: ⚪ OPCIONAL
**Tempo estimado**: 3-4 horas

*(Da lista de commits extras - COMMIT 17)*

───────────────────────────────────────────────────────────────────────────────
TAREFA 5.5: Sistema de notificações
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: ⚪ OPCIONAL
**Tempo estimado**: 3-4 horas

*(Da lista de commits extras - COMMIT 18)*

───────────────────────────────────────────────────────────────────────────────
TAREFA 5.6: Analytics tracking
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: ⚪ OPCIONAL
**Tempo estimado**: 2 horas

*(Da lista de commits extras - COMMIT 19)*

───────────────────────────────────────────────────────────────────────────────
TAREFA 5.7: Testes automatizados (Unit + E2E)
───────────────────────────────────────────────────────────────────────────────

**Prioridade**: ⚪ OPCIONAL
**Tempo estimado**: 8-12 horas

*(Da lista de commits extras - COMMIT 21)*

═══════════════════════════════════════════════════════════════════════════════
📋 CHECKLIST PRÉ-PRODUÇÃO (VALIDAÇÃO FINAL)
═══════════════════════════════════════════════════════════════════════════════

Antes de fazer deploy em produção, TODAS estas verificações devem passar:

### 🔒 Segurança
- [ ] Console.logs removidos
- [ ] Validação de inputs implementada (client + server)
- [ ] Rate limiting configurado
- [ ] Variáveis de ambiente configuradas (.env.production)
- [ ] RLS (Row Level Security) validado no Supabase
- [ ] npm audit sem vulnerabilidades críticas

### 🌐 SEO
- [ ] Meta tags completas em todas as páginas
- [ ] Open Graph tags configuradas
- [ ] Twitter Cards configuradas
- [ ] Sitemap.xml funcionando
- [ ] robots.txt configurado
- [ ] Structured data (JSON-LD) implementado

### ♿ Acessibilidade
- [ ] Lighthouse Accessibility > 95
- [ ] Navegação completa por teclado
- [ ] Aria-labels em todos os botões
- [ ] Focus trap em modais
- [ ] Contraste mínimo 4.5:1 (WCAG AA)
- [ ] Alt text em todas as imagens
- [ ] Testado com screen reader

### ⚡ Performance
- [ ] Lighthouse Performance > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Imagens otimizadas (WebP + lazy loading)
- [ ] Code splitting implementado

### 🌍 Internacionalização
- [ ] Detecção automática de idioma
- [ ] TODOS os textos traduzidos (pt-BR + en-US)
- [ ] Atributo lang do HTML atualiza dinamicamente
- [ ] Nenhum texto hardcoded

### 🎨 UX
- [ ] Botão voltar funciona em todos os fluxos
- [ ] Splash screen animado
- [ ] Toast com ícones Lucide
- [ ] Local pesquisado destacado
- [ ] Ghost pin com endereço
- [ ] Haptic feedback em mobile
- [ ] Tema como toggle switch
- [ ] Idioma com bandeiras

### 🧪 Testes
- [ ] Testado em Chrome, Firefox, Safari, Edge
- [ ] Testado em mobile (iOS + Android)
- [ ] Testado em tablet
- [ ] Testado em desktop
- [ ] Fluxo completo de ponta a ponta funcional

### 📊 Monitoramento
- [ ] Error tracking configurado (Sentry ou similar)
- [ ] Analytics configurado (GA, Plausible, etc)
- [ ] Health check endpoint (/api/health)
- [ ] Backup do banco configurado

### 🔧 Deploy
- [ ] Build de produção sem erros
- [ ] Build de produção sem warnings TypeScript
- [ ] Variáveis de ambiente configuradas no servidor
- [ ] CDN configurado para assets (Cloudflare)
- [ ] HTTPS configurado
- [ ] CI/CD configurado (opcional)

═══════════════════════════════════════════════════════════════════════════════
🎯 MÉTRICAS DE SUCESSO (OBJETIVOS)
═══════════════════════════════════════════════════════════════════════════════

### Performance (Lighthouse)
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 95
- **PWA**: > 90 (se implementar)

### Core Web Vitals
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3s
- **Total Blocking Time (TBT)**: < 300ms

### Qualidade de Código
- **Cobertura de testes**: > 70% (se implementar)
- **0 erros no console** em produção
- **0 warnings TypeScript**
- **0 warnings ESLint**
- **0 vulnerabilidades críticas** (npm audit)

### Acessibilidade
- **WCAG 2.1 Level AA**: 100% compliance
- **Navegação por teclado**: 100% funcional
- **Screen readers**: Compatível com NVDA, JAWS, VoiceOver

═══════════════════════════════════════════════════════════════════════════════
📚 REFERÊNCIAS E CONTEXTO TÉCNICO
═══════════════════════════════════════════════════════════════════════════════

### Stack Tecnológica
- **Frontend**: Svelte 5 (Runes), TypeScript strict mode
- **Backend**: SvelteKit + Supabase
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth + SSO com Monsan Auth (Owlth)
- **Storage**: Cloudflare R2 (imagens)
- **Mapa**: Leaflet.js + MarkerCluster
- **Geocoding**: Photon OSM API
- **Ícones**: Lucide Svelte
- **Deploy**: Coolify (adapter-node)

### Navegação e Botão Voltar (CRÍTICO)

A aplicação usa **query parameters + History API** para navegação fluida:

**Rotas**:
- `/` - Mapa principal
- `/?pin=<id>` - BottomSheet colapsado (30%)
- `/?pin=<id>&expanded=true` - BottomSheet expandido (80%)
- `/?pin=<id>&expanded=true&review=true` - ReviewForm aberto
- `/favorites` - Lista de favoritos
- `/favorites?pin=<id>` - Favoritos com BottomSheet

**Fluxo do botão voltar**:
1. ReviewForm → BottomSheet expandido
2. BottomSheet expandido → BottomSheet colapsado
3. BottomSheet colapsado → Mapa principal
4. Favoritos com pin → Favoritos
5. Favoritos → Mapa principal

**Implementação**:
- `navigationService` gerencia todas as navegações
- `+layout.svelte` sincroniza URL com estado via `$effect`
- Swipe down sempre remove um nível de URL
- `replaceState: false` para adicionar ao histórico

### Fluxo de Criação de Pins

1. Usuário clica no **MAPA** (não em botão da dock)
2. Sistema cria "ghost pin" temporário
3. Verifica pins próximos (raio 50m)
4. Se não há duplicata: abre modal de criação
5. Faz reverse geocoding para obter endereço
6. Usuário preenche dados + fotos
7. Salva no Supabase
8. Remove ghost pin + adiciona pin real
9. Abre BottomSheet do novo pin
10. Usuário pode adicionar review via BottomSheet

### Autenticação SSO

- Compartilha sessão com Monsan Auth (Owlth)
- Cookies com domínio `.monsan.duckdns.org`
- `@supabase/ssr` versão 0.8.0 (importante!)
- hooks.server.ts gerencia sessão
- Verificar `authState.user` antes de ações autenticadas

### Imagens (Cloudflare R2)

- Upload para bucket `map-pins`
- Compressão no cliente: max 1200x1200, 80% quality
- Formato: WebP ou JPEG
- Max 5 fotos por review/pin
- Validar tipo (apenas imagens) e tamanho (< 5MB)

### Banco de Dados (Supabase)

**Tabelas principais**:
- `map_pins` - Pins no mapa
- `map_pin_categories` - Categorias (18 tipos)
- `map_reviews` - Reviews dos pins
- `map_favorites` - Pins favoritados
- `map_review_upvotes` - Upvotes em reviews

**RLS configurado**: Usuários só podem editar próprios pins/reviews

═══════════════════════════════════════════════════════════════════════════════
🚀 ORDEM DE EXECUÇÃO RECOMENDADA
═══════════════════════════════════════════════════════════════════════════════

**FASE 1 - CRÍTICA** (7 tarefas, ~15-22 horas):
1. Remover console.logs (1-2h)
2. Validação de inputs (3-4h)
3. Melhorar mensagem criar local (2-3h)
4. Detectar idioma automaticamente (1h)
5. Meta tags e SEO (2-3h)
6. Sitemap.xml (1-2h)
7. Auditoria acessibilidade (4-6h)

**FASE 2 - ALTA** (4 tarefas, ~7-10 horas):
1. Local em evidência (2h)
2. Melhorar toast (2h)
3. Revisar traduções (2-3h)
4. Expandir palavras proibidas (1-2h)

**FASE 3 - MÉDIA** (7 tarefas, ~10-16 horas):
1. Tema toggle switch (1-2h)
2. Idioma com bandeiras (1h)
3. Loading searchbar (1-2h)
4. Hover botão pesquisa (30min)
5. Melhorar Splash (1-2h)
6. Otimizar mapa (3-4h)
7. Caching (2-3h)

**FASE 4 - BAIXA** (3 tarefas, ~3-4 horas):
1. Hover buttons (1h)
2. Ícone GPS (30min)
3. Seed reviews (2-3h)

**TOTAL ESTIMADO FASES 1-4**: ~35-52 horas

**FASE 5 - OPCIONAL** (pós-lançamento):
- Service Worker + PWA (~6-8h)
- Realtime + Routing + Notificações (~8-10h)
- Analytics + Testes (~10-14h)

═══════════════════════════════════════════════════════════════════════════════
✅ CRITÉRIO DE "PRONTO PARA PRODUÇÃO"
═══════════════════════════════════════════════════════════════════════════════

A aplicação está pronta quando:

1. ✅ **Todas as tarefas da FASE 1 (CRÍTICA)** estão completas
2. ✅ **Checklist pré-produção** está 100% validado
3. ✅ **Lighthouse scores** atingem as métricas de sucesso
4. ✅ **Testes manuais** em múltiplos dispositivos/navegadores passam
5. ✅ **Monitoramento** (Sentry, Analytics) configurado
6. ✅ **Backup do banco** configurado
7. ✅ **Deploy em staging** testado e funcional

**FASES 2-4 são altamente recomendadas mas não bloqueantes.**

═══════════════════════════════════════════════════════════════════════════════
📝 NOTAS FINAIS
═══════════════════════════════════════════════════════════════════════════════

1. **Este documento é executável sequencialmente** - siga as fases na ordem
2. **Cada tarefa é independente** (exceto dependências explícitas)
3. **Teste após cada tarefa** antes de prosseguir
4. **Marque como concluído** usando `[x]` nos checkboxes
5. **Commits devem ser atômicos** - um commit por tarefa
6. **Mensagens de commit em inglês** - seguir convenção existente
7. **Atualizar este documento** conforme o projeto evolui

**Este é o documento definitivo consolidado.**
Combina list_commits.md + new_list.md + ROADMAP_COMPLETO.md em um único guia executável.

═══════════════════════════════════════════════════════════════════════════════
FIM DO DOCUMENTO
═══════════════════════════════════════════════════════════════════════════════

