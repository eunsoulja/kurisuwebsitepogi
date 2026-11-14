# kurisuwebsitepogi

# Kurisu landing page (Vite + TypeScript)

Single-file index.html converted into a Vite + vanilla TypeScript project. Source is readable/editable; production build is minified and obfuscated.

## Run

`ash
npm install
npm run dev      # start dev server
npm run build    # typecheck + production build (dist/)
npm run preview  # serve dist/ locally
`

## Edit content

- src/config.ts — the only file intended for routine content edits:
  - CFG: public values (id bot application/client ID, support invite URL, site URL). **No secrets**.
  - DEVS: developer cards (Discord IDs, roles, tags, banner/accent/tagline). Users must be in the Lanyard Discord server for live presence.

## Deploy to Cloudflare Pages

- **Build command:** 
pm run build
- **Build output directory:** dist
- public/_headers is copied to dist/_headers and applies security headers (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options) while allowing Google Fonts, pi.lanyard.rest, cdn.discordapp.com, and ile.garden.

## Project structure

`
src/
  main.ts            bootstrap only
  config.ts          CFG and DEVS (edit content here)
  ascii-logo.ts      asciiLogo() moved verbatim in logic
  loader.ts          loading screen -> hero handoff
  carousel/
    index.ts         developers carousel + scroll timeline (TUNABLES at top)
    halo-wall.ts     blurred halo canvases + tile wall
    lanyard.ts       presence polling
  nav.ts             mobile nav
  reveal.ts          scroll reveal
styles/
  base.css, hero.css, carousel.css, sections.css
index.html           Vite entry (markup unchanged)
public/
  _headers           Cloudflare Pages headers/CSP
vite.config.ts       build + obfuscation config
`

## Build hardening notes

- JS: esbuild minify, then javascript-obfuscator (via ite-plugin-javascript-obfuscator) with identifier mangling and base64 string array. Control-flow flattening, dead-code injection, self-defending, and debug protection are **off** to avoid runtime/perf cost on animation-heavy code.
- CSS class names are **not** mangled: the JS builds/queries many class names and selectors dynamically (and some are set via template strings/attributes), so automated class renaming is risky. Vite still minifies and emits hashed asset filenames.
- Client-side code cannot be made truly secret; this build only raises the bar for casual reading/copying.