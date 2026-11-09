import { defineConfig, loadEnv } from 'vite'
import preact from '@preact/preset-vite'

// Starts the entry script only after the first paint (the static shell in
// index.html), instead of letting the browser fetch it — and its vendor
// chunks — while the HTML is still being parsed. The shell paints from the
// HTML alone; the app then downloads in parallel (modulepreload links are
// added at the same moment, so there is no request waterfall). Timing comes
// from window.__afterFirstPaint in index.html (first-contentful-paint).
function deferEntryPlugin() {
  return {
    name: 'cia-defer-entry',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const entry = /<script type="module" crossorigin src="([^"]+)"><\/script>\s*/.exec(html)
        if (!entry) return html
        const preloads = [...html.matchAll(/<link rel="modulepreload" crossorigin href="([^"]+)">\s*/g)]
        let out = html.replace(entry[0], '')
        preloads.forEach((p) => {
          out = out.replace(p[0], '')
        })
        const deps = JSON.stringify(preloads.map((p) => p[1]))
        const loader =
          `<script>(function(){var done=0;function go(){if(done)return;done=1;var h=document.head;` +
          `${deps}.forEach(function(u){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=u;h.appendChild(l)});` +
          `var s=document.createElement('script');s.type='module';s.crossOrigin='';s.src=${JSON.stringify(entry[1])};h.appendChild(s)}` +
          `window.__afterFirstPaint(go)})()</script>`
        return out.replace('</body>', `${loader}\n</body>`)
      },
    },
  }
}

// Fetches the hero slides straight from Supabase's REST endpoint (no SDK
// needed) right after the first paint — in parallel with the app's own
// download — so the hero image can start loading before the app is ready. The Hero component uses this result until the
// regular Supabase sync takes over. On repeat visits, the hero image URL
// remembered by the Hero is preloaded immediately.
function heroPrefetchPlugin(supabaseUrl, supabaseKey) {
  return {
    name: 'cia-hero-prefetch',
    transformIndexHtml(html) {
      const valid = supabaseUrl && supabaseUrl.startsWith('https://') && supabaseKey
      const fetchPart = valid
        ? `window.__ciaHeroSlides=new Promise(function(ok){window.__afterFirstPaint(ok)}).then(function(){return fetch(${JSON.stringify(
            `${supabaseUrl.replace(/\/$/, '')}/rest/v1/cia_hero_slides?select=id,image,title,subtitle&order=display_order.asc`
          )},{headers:{apikey:${JSON.stringify(supabaseKey)}}})}).then(function(r){return r.ok?r.json():null}).then(function(rows){` +
          `var img=rows&&rows[0]&&rows[0].image;if(img&&/^https?:/.test(img))pre({href:img});return rows}).catch(function(){return null});`
        : ''
      const script =
        `<script>(function(){if(location.pathname.indexOf('/admin')===0)return;` +
        `var added={};function pre(p){if(!p||!p.href||added[p.href])return;added[p.href]=1;var l=document.createElement('link');l.rel='preload';l.as='image';l.href=p.href;` +
        `if(p.srcset){l.setAttribute('imagesrcset',p.srcset);l.setAttribute('imagesizes',p.sizes||'100vw')}if(p.type)l.type=p.type;l.setAttribute('fetchpriority','high');document.head.appendChild(l)}` +
        `try{pre(JSON.parse(localStorage.getItem('site:hero-preload')))}catch(e){}${fetchPart}})()</script>`
      return html.replace('<!--hero-prefetch-->', script)
    },
  }
}

// Warms up the TLS connection to the Supabase project as early as possible.
function supabasePreconnectPlugin(supabaseUrl) {
  return {
    name: 'cia-supabase-preconnect',
    transformIndexHtml() {
      if (!supabaseUrl || !supabaseUrl.startsWith('https://')) return []
      const origin = new URL(supabaseUrl).origin
      return [{ tag: 'link', attrs: { rel: 'preconnect', href: origin, crossorigin: '' }, injectTo: 'head-prepend' }]
    },
  }
}

// Netlify _headers generated at build time: a Link preload header for the
// hero font, so its download starts as soon as the HTML response headers
// arrive. (JS is intentionally not preloaded here — see deferEntryPlugin.)
function netlifyHeadersPlugin() {
  return {
    name: 'cia-netlify-headers',
    apply: 'build',
    generateBundle() {
      const link = '</fonts/montserrat-800-latin-v1.woff2>; rel=preload; as=font; type=font/woff2; crossorigin'
      this.emitFile({
        type: 'asset',
        fileName: '_headers',
        source: `/\n  Link: ${link}\n/index.html\n  Link: ${link}\n`,
      })
    },
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [
      preact(),
      heroPrefetchPlugin(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY),
      deferEntryPlugin(),
      supabasePreconnectPlugin(env.VITE_SUPABASE_URL),
      netlifyHeadersPlugin(),
    ],
    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom/client': 'preact/compat/client',
        'react-dom': 'preact/compat',
        'react/jsx-runtime': 'preact/jsx-runtime',
      },
    },
    server: {
      port: 5173,
      open: true,
    },
    // Production builds strip every console.* call and debugger statement.
    esbuild: command === 'build' ? { drop: ['console', 'debugger'], legalComments: 'none' } : undefined,
    build: {
      target: 'es2020',
      sourcemap: false,
      minify: 'esbuild',
      cssCodeSplit: true,
      cssMinify: true,
      reportCompressedSize: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('@supabase')) return 'supabase'
            if (/[\\/]node_modules[\\/](react-router|react-router-dom|@remix-run)[\\/]/.test(id)) return 'router'
            return 'vendor'
          },
        },
      },
    },
  }
})
