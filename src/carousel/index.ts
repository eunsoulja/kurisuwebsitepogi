/* ---------- developers: ALCHE-style curved carousel + Lanyard ---------- */
import { CFG, DEVS } from "../config";
import { SC, getDevView, pollLanyard, type LanyardData } from "./lanyard";
import { createHaloWall } from "./halo-wall";

export function initCarousel(): void {
  const $ = (id: string) => document.getElementById(id);
  const _DECK = $("dvDeck");
  const _stage = $("dvStage");
  const _info = $("dvInfo");
  const _track = $("journey");
  const _st = $("jnSt");
  const _hero = $("top");
  const _bgL = $("jnBg");
  const _lay = $("cyLay");
  const _world = $("cyWorld");
  const _ui = $("cyUi");
  const _about = $("about");
  const _mk = $("developers");
  if (!_DECK || !_stage || !_info || !_track || !_st || !_hero || !_bgL || !_lay || !_world || !_ui || !_about || !_mk) return;
  const DECK = _DECK as HTMLElement;
  const stage = _stage as HTMLElement;
  const info = _info as HTMLElement;
  const track = _track as HTMLElement;
  const st = _st as HTMLElement;
  const hero = _hero as HTMLElement;
  const bgL = _bgL as HTMLElement;
  const lay = _lay as HTMLElement;
  const world = _world as HTMLElement;
  const ui = _ui as HTMLElement;
  const about = _about as HTMLElement;
  const mk = _mk as HTMLElement;
  const RMQ = matchMedia("(prefers-reduced-motion:reduce)");
  const TL = { a: 1.1, lead: .4, gap: .9, tail: .4, c: .9 }, N = 16; let vh = innerHeight, tot = 0;

  /* ---- tunables ---- */
  const TUNABLES = {
    CY: .49,          /* active card centre as a fraction of the pinned viewport height (reference: ~0.49) */
    REST_TILT: 0,     /* deg. World pitch at rest. A non-zero value is auto-compensated so the active card stays centred */
    PERSP: 1500,      /* must equal .dv-stage perspective in the CSS */
    ORB: {
      ringK: 1.85,           /* ring radius = card width * ringK */
      step: 40, stepMobile: 32,/* degrees between neighbouring cards: bigger = side cards sit further out */
      arc: .09,              /* lift of both side cards (ring seen from above). 0 = they sit on one tilted line */
      diag: .113,            /* tilt of the ring: left side high, right side low (reference: left -115px, right +110px at 1905x990) */
      lean: 3.2,             /* roll of side cards, degrees */
      pop: 90,               /* active card is pushed this many px toward the camera */
      tiltV: 2.2, rollV: .9, lagV: 10, zV: 14, /* velocity response: yaw deg, roll deg, x lag px, z pull px per (card/s) */
      margin: 18,           /* minimum gap between a side card and the heading / info text, px */
      minVis: 190            /* a side card nudged sideways keeps at least this many px on screen; otherwise it moves in y */
    },
    TL,
    spring: { K: 95, Cd: 13.5 },
    N,
  };
  const { CY, REST_TILT, PERSP, ORB } = TUNABLES;

  let current = 0;
  const states: (LanyardData | null)[] = DEVS.map(() => null);
  let cards: HTMLElement[] = [], dots: HTMLButtonElement[] = [], startX: number | null = null;
  let BD: [number, number, number][][] = [], SH: number[] = [];
  let pos = 0, vel = 0, R = 1200, step = ORB.step, CW = 800, CH = 450, VW = innerWidth;
  let UIR: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = (x: number) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eo = (x: number) => 1 - Math.pow(1 - x, 3);
  const hx = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255] as [number, number, number]; };
  const AC = DEVS.map(d => hx(d.accent || "#6f86ff"));
  /* banner images: used for strip backgrounds (CSS) and for the blurred halo + tile wall (canvas) */
  const WI: (HTMLImageElement | null)[] = DEVS.map(d => { if (!d.banner) return null; const im = new Image(); im.onload = im.onerror = () => { if (cards.length) bend(); }; im.src = d.banner; return im; });
  const imgOK = (k: number) => { const im = WI[k]; return !!(im && im.complete && im.naturalWidth); };

  const get = (k: number) => getDevView(DEVS[k], states[k], k);
  function avatarNode(src: string, name: string): HTMLElement {
    const ini = () => { const f = document.createElement("span"); f.className = "ini"; f.textContent = (name || "D").charAt(0).toUpperCase(); return f; };
    if (!src) return ini();
    const im = document.createElement("img"); im.alt = name + " profile picture"; im.src = src; im.onerror = () => im.replaceWith(ini()); return im;
  }
  /* glitch-scramble text */
  function scr(el: HTMLElement, txt: string) { clearInterval((el as HTMLElement & { _i?: number })._i); if (RMQ.matches) { el.textContent = txt; return; } let n = 0; const ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/<>_";
    (el as HTMLElement & { _i?: number })._i = window.setInterval(() => { el.textContent = [...txt].map((c, i) => i < n || c === " " ? c : ch[Math.random() * ch.length | 0]).join(""); if (n++ >= txt.length) { clearInterval((el as HTMLElement & { _i?: number })._i); el.textContent = txt; } }, 28); }

  /* bend: each card is N strips laid on a cylinder arc. Strips are 2px wider than their slot so no seams show,
     and every strip samples ONE shared background box (--bgw/--bgh/--bx), so the art lines up across strips. */
  function bend() {
    cards.forEach((c, k) => {
      const W = c.offsetWidth || 800, H = c.offsetHeight || W * 9 / 16, th = .8, r = W / th, sw = W / N, v = get(k), ok = imgOK(k);
      const im = WI[k]; const ar = ok && im ? im.naturalWidth / im.naturalHeight : 16 / 9;
      let bgw = W, bgh = H, ox = 0, oy = 0;
      if (ar > W / H) { bgh = H; bgw = H * ar; ox = -(bgw - W) / 2; } else { bgw = W; bgh = W / ar; oy = -(bgh - H) / 2; }
      c.style.setProperty("--img", ok ? `url("${v.banner.replace(/["\\]/g, "")}")` : "none");
      c.style.setProperty("--gr", `linear-gradient(135deg,${v.accent},#050505)`);
      c.style.setProperty("--bgw", bgw.toFixed(1) + "px"); c.style.setProperty("--bgh", bgh.toFixed(1) + "px"); c.style.setProperty("--by", oy.toFixed(1) + "px");
      c.style.setProperty("--rad", cl(W * .026, 10, 28).toFixed(1) + "px");
      const arr: [number, number, number][] = [];
      const children = Array.from((c.firstChild as HTMLElement).children) as HTMLElement[];
      children.forEach((s, i) => {
        const x = (i + .5) / N - .5, a = x * th, ex = Math.abs(x) * 2;
        s.style.left = (i * sw).toFixed(2) + "px"; s.style.width = (sw + 2).toFixed(2) + "px";
        s.style.setProperty("--bx", (ox - i * sw).toFixed(2) + "px");
        if (ok && ex > .65) { s.classList.add("e"); s.style.setProperty("--ef", Math.pow((ex - .5) / .5, 1.5).toFixed(3)); } else s.classList.remove("e");
        arr.push([r * Math.sin(a) - x * W, -r * (1 - Math.cos(a)) - 2, a * 57.2958]);
      });
      BD[k] = arr; SH[k] = 0; applyStrips(k, 0, 0);
    });
  }
  function applyStrips(k: number, amp: number, T: number) {
    const first = cards[k].firstChild as HTMLElement | null; if (!first) return;
    const ss = Array.from(first.children) as HTMLElement[]; const bd = BD[k]; if (!bd) return;
    for (let i = 0; i < ss.length; i++) { const b = bd[i], j = amp ? amp * (2.4 * Math.sin(T * .011 + i * .55 + k * 3.7) + .9 * Math.sin(T * .027 + i * 1.1)) : 0;
      ss[i].style.transform = `translate3d(${(b[0] + j).toFixed(2)}px,0,${b[1].toFixed(2)}px) rotateY(${b[2].toFixed(3)}deg)`; }
  }
  /* keep side cards off the heading, status chip, info block and dots */
  function avoid(X: number, Y: number, Z: number, th: number, a: number): [number, number] {
    if (!UIR.length || a < .001) return [0, 0];
    const c = Math.cos(th), s = Math.sin(th), ox = VW / 2, oy = vh * CY;
    let top = 1e9, bot = -1e9, l = 1e9, rr = -1e9;
    for (const sx of [-CW / 2, CW / 2]) for (const sy of [-CH / 2, CH / 2]) {
      const kk = PERSP / (PERSP - (Z - sx * s - R)), px = ox + (X + sx * c) * kk, py = oy + (Y + sy) * kk;
      if (py < top) top = py; if (py > bot) bot = py; if (px < l) l = px; if (px > rr) rr = px;
    }
    const s0 = PERSP / (PERSP - (Z - R)), M = ORB.margin, left = (l + rr) / 2 < ox; let dy = 0, dx = 0;
    for (const q of UIR) {
      const ll = l + dx, r2 = rr + dx, t = top + dy, b = bot + dy;
      if (r2 < q.x0 - M || ll > q.x1 + M || b < q.y0 - M || t > q.y1 + M) continue;
      const sh = left ? (q.x0 - M) - r2 : (q.x1 + M) - ll, vis = left ? r2 + sh : VW - (ll + sh),
        sv = ((t + b) / 2 >= (q.y0 + q.y1) / 2) ? (q.y1 + M - t) : (q.y0 - M - b);
      if (vis >= ORB.minVis && Math.abs(sh) <= Math.abs(sv) * 1.4) dx += sh; else dy += sv;
    }
    return [dx / s0 * a, dy / s0 * a];
  }
  function measureUI() {
    if (lay.style.transform && lay.style.transform !== "none") return; /* lay is scaled during the exit; rects would be off */
    const L = lay.getBoundingClientRect();
    const q = (el: Element | null) => { const r = el!.getBoundingClientRect(); return { x0: r.left - L.left, x1: r.right - L.left, y0: r.top - L.top, y1: r.bottom - L.top }; };
    UIR = [q(ui.querySelector(".dv-top>div")), q($("dvConn")), q(info), q(ui.querySelector(".dv-controls"))];
  }

  function show(animate: boolean) {
    const v = get(current), status = SC[v.status];
    const av = $("dvAv")!; av.innerHTML = ""; av.append(avatarNode(v.avatar, v.name));
    const dot = document.createElement("b"); dot.style.background = status[0]; av.append(dot);
    $("dvMeta")!.textContent = `${v.role} · ${status[1]}`;
    const nameEl = $("dvName") as HTMLElement; animate ? scr(nameEl, v.name) : (nameEl.textContent = v.name);
    const sub = $("dvSub") as HTMLElement; sub.textContent = v.activity || v.tagline || "";
    v.tags.forEach(t => { const s = document.createElement("span"); s.className = "tg"; s.textContent = t; sub.append(s); });
    $("dvSr")!.textContent = `${v.name}, ${status[1]}`;
    if (animate) { info.classList.remove("in"); void info.offsetWidth; info.classList.add("in"); }
    measureUI();
  }

  function place() {
    const T = RMQ.matches ? 0 : performance.now(), idx = Math.max(0, Math.min(cards.length - 1, Math.round(pos)));
    const vv = cl(vel, -4, 4), O = ORB;
    cards.forEach((card, k) => {
      const r = k - pos, a = Math.min(1, Math.abs(r)), f = 1 - a;
      const th = r * step * Math.PI / 180, sn = Math.sin(th), cs = Math.cos(th), Rr = R + O.pop * f;
      let X = Rr * sn, Y = R * (-O.arc * (1 - cs) + O.diag * sn), Z = Rr * cs;
      const av = avoid(X, Y, Z, th, a); X += av[0]; Y += av[1];
      /* weightless: cards bank into the direction of travel, lag a little in x and are pulled back in z while moving */
      X -= vv * O.lagV * (.4 + a); Z -= Math.abs(vv) * O.zV * (.4 + f);
      const bob = Math.sin(T * .0011 + k * 1.9) * 10;
      card.style.transform = `translate(-50%,-50%) translate3d(${X.toFixed(1)}px,${(Y + bob).toFixed(1)}px,${Z.toFixed(1)}px) rotateY(${(th * 57.2958 + vv * O.tiltV).toFixed(2)}deg) rotateZ(${(-sn * O.lean + vv * O.rollV + Math.sin(T * .0008 + k * 1.3) * .8).toFixed(2)}deg) rotateX(${(Math.sin(T * .0009 + k * 2.1) * 1.2).toFixed(2)}deg) scale(${(1 + .05 * f).toFixed(3)})`;
      card.style.setProperty("--dim", (.6 * a).toFixed(2));
      card.style.opacity = Math.abs(r) > 2.4 ? "0" : "1";
      card.classList.toggle("is-active", k === idx);
      /* shimmer + stronger chromatic split while moving */
      const amp = cl(Math.abs(vv) * .5) * cl(a + .4);
      if (amp > .02 || SH[k] > .02) applyStrips(k, amp, T);
      SH[k] = amp;
      card.style.setProperty("--ca", (1.6 + amp * 5.5).toFixed(2) + "px");
    });
    if (idx !== current) { current = idx; cards.forEach((c, k) => c.setAttribute("aria-hidden", k === idx ? "false" : "true")); show(true); }
    dots.forEach((b, k) => b.setAttribute("aria-current", k === current ? "true" : "false"));
    $("dvCount")!.textContent = `${String(current + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
  }

  /* cards: built once. Later Lanyard polls only refresh the status dot, so GIF banners never restart */
  function build() {
    DECK.innerHTML = ""; $("dvDots")!.innerHTML = ""; cards = []; dots = [];
    DEVS.forEach((_d, k) => {
      const v = get(k); const card = document.createElement("article"); card.className = "dv-card";
      card.setAttribute("role", "button"); card.setAttribute("tabindex", "0"); card.setAttribute("aria-label", "View " + v.name);
      card.style.setProperty("--acc", AC[k].join(","));
      const bw = document.createElement("div"); bw.className = "bw";
      for (let i = 0; i < N; i++) bw.append(document.createElement("i"));
      const dot = document.createElement("b"); dot.className = "sd"; dot.style.setProperty("--status", SC[v.status][0]); (bw.lastChild as HTMLElement).append(dot);
      card.append(bw); card.addEventListener("click", () => go(k));
      card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(k); } });
      DECK.append(card); cards.push(card);
      const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Show " + v.name); b.addEventListener("click", () => go(k)); $("dvDots")!.append(b); dots.push(b);
    });
    bend(); place(); show(false);
  }
  function refresh() {
    cards.forEach((c, k) => { const v = get(k); c.setAttribute("aria-label", "View " + v.name); (c.querySelector(".sd") as HTMLElement).style.setProperty("--status", SC[v.status][0]); });
    show(false);
  }

  function go(k: number) { k = Math.max(0, Math.min(cards.length - 1, k)); if (RMQ.matches) return; const u = k ? TL.a + TL.lead + k * TL.gap - .02 : TL.a + TL.lead * .5; scrollTo({ top: track.offsetTop + u * vh, behavior: "smooth" }); }
  $("dvPrev")!.addEventListener("click", () => go(current - 1));
  $("dvNext")!.addEventListener("click", () => go(current + 1));
  stage.addEventListener("keydown", e => { if (e.key === "ArrowLeft") { e.preventDefault(); go(current - 1); } if (e.key === "ArrowRight") { e.preventDefault(); go(current + 1); } });
  stage.addEventListener("pointerdown", e => { startX = e.clientX; });
  stage.addEventListener("pointerup", e => { if (startX === null) return; const dx = e.clientX - startX; startX = null; if (Math.abs(dx) > 45) go(current + (dx < 0 ? 1 : -1)); });

  async function poll() {
    const ok = await pollLanyard(DEVS, states);
    const conn = $("dvConn")!; conn.dataset.s = ok === DEVS.length ? "live" : ok ? "partial" : "off";
    conn.lastElementChild!.textContent = ok === DEVS.length ? "All developers live" : ok ? `Live · ${ok}/${DEVS.length}` : "Lanyard unavailable";
    refresh();
  }
  build(); poll(); setInterval(poll, 30000);

  // setup links from CFG (idempotent, also done in main but safe)
  document.querySelectorAll<HTMLAnchorElement>("[data-invite]").forEach(a => { a.href = `https://discord.com/oauth2/authorize?client_id=${CFG.id}&permissions=1100451490998&scope=bot%20applications.commands`; a.target = "_blank"; a.rel = "noopener"; });
  document.querySelectorAll<HTMLAnchorElement>("[data-support]").forEach(a => { a.href = CFG.support; a.target = "_blank"; a.rel = "noopener"; });
  document.querySelectorAll<HTMLAnchorElement>("[data-site]").forEach(a => { a.href = CFG.site; a.target = "_blank"; a.rel = "noopener"; });

  if (RMQ.matches) { mk.remove(); $("cy")!.id = "developers"; pos = 0; place(); }
  else {
    /* ---- background: blurred halo of the ACTIVE art + coloured bloom + curved tile wall ---- */
    const hw = createHaloWall(bgL, AC, WI, imgOK, cl);
    /* hero -> team: zoom-out haze on the ASCII canvas (scale + blur + displacement) and a ghost word */
    const hc = $("a") as HTMLElement; const ghost = document.createElement("div"); ghost.className = "ghost"; ghost.setAttribute("aria-hidden", "true"); ghost.textContent = "TEAM"; st.insertBefore(ghost, $("cy")!);
    document.body.insertAdjacentHTML("beforeend", '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="kHz" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence id="kHzT" type="fractalNoise" baseFrequency="0.006 0.014" numOctaves="1" seed="3" result="n"/><feDisplacementMap id="kHzD" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>');
    const kD = $("kHzD") as unknown as SVGElement, kT = $("kHzT") as unknown as SVGElement, flare = document.createElement("div"); flare.className = "flare"; flare.setAttribute("aria-hidden", "true"); st.append(flare);

    let cur = 0, tgt = 0, held: boolean | null = null, lt = 0, lastSc = 0, tp = 0;
    const measure = () => cl(-track.getBoundingClientRect().top / vh, 0, tot);
    function size() {
      vh = st.offsetHeight; VW = st.offsetWidth || innerWidth; const n = Math.max(1, DEVS.length);
      tot = TL.a + TL.lead + (n - 1) * TL.gap + TL.tail + TL.c;
      track.style.height = vh * (1 + tot) + "px"; about.style.marginTop = -vh + "px"; st.style.setProperty("--cy", (CY * 100) + "%");
      const c0 = cards[0]; CW = c0 ? c0.offsetWidth : Math.min(innerWidth * .5, 860); CH = c0 ? c0.offsetHeight : CW * 9 / 16; R = CW * ORB.ringK; step = innerWidth < 760 ? ORB.stepMobile : ORB.step;
      mk.style.top = vh * (TL.a + TL.lead * .5) + "px"; tgt = measure(); bend(); hw.wsize(); hw.hzSize(CW, VW, vh); measureUI();
    }
    /* spring: slightly underdamped (zeta ~0.7) so cards glide, settle and kiss past the stop; a magnet pulls to the nearest card */
    const { K, Cd } = TUNABLES.spring;
    function render(u: number, dt: number, now: number) {
      const n = DEVS.length, a = cl(u / TL.a), e = ease(a), dev = u - (TL.a + TL.lead);
      tp = 0; for (let k = 0; k < n - 1; k++) tp += ease(cl((dev - k * TL.gap - .12) / (TL.gap - .24)));
      const idle = now - lastSc > 140, aim = tp + (Math.round(tp) - tp) * (idle ? 1 : .3);
      vel += ((aim - pos) * K - vel * Cd) * dt; pos += vel * dt;
      if (Math.abs(vel) < 1e-3 && Math.abs(aim - pos) < 1e-3) { pos = aim; vel = 0; }
      const c = cl((u - (tot - TL.c)) / TL.c), ce = ease(c), rest = REST_TILT * Math.PI / 180 * e;
      /* rest pitch pivots about the ring axis, which would push the active card down by R*sin(pitch): cancel it so the card sits at CY */
      const ty = (1 - e) * -.3 * vh - R * Math.sin(rest), tz = -R * Math.cos(rest) - (1 - e) * 4600 - ce * 3800, rx = -(REST_TILT * e + (1 - e) * 66 + ce * 20), rz = (1 - e) * -24 + ce * 9, ry = (1 - e) * 160 - eo(c) * 38;
      world.style.transform = `translate3d(0,${ty.toFixed(1)}px,${tz.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      const lo = cl(u / (TL.a * .35)) * (1 - ease(cl((c - .15) / .65))); lay.style.opacity = lo.toFixed(3);
      if (c > .005) { kD.setAttribute("scale", (ce * 140).toFixed(1)); kT.setAttribute("baseFrequency", `${(.007 + .003 * Math.sin(now * .0007)).toFixed(4)} ${(.016 + .005 * Math.cos(now * .0009)).toFixed(4)}`); lay.style.filter = `url(#kHz) blur(${(ce * 14).toFixed(1)}px) brightness(${(1 + ce * .7).toFixed(2)})`; lay.style.transform = `scale(${(1 - ce * .1).toFixed(3)})`; } else { lay.style.filter = "none"; lay.style.transform = "none"; }
      flare.style.opacity = (Math.sin(Math.PI * cl((c - .05) / .9)) * .5).toFixed(3);
      const uo = cl((a - .7) / .3) * (1 - cl(c / .3)); ui.style.opacity = uo.toFixed(3); lay.style.pointerEvents = uo > .5 ? "auto" : "none";
      const bo = cl((a - .15) / .7) * (1 - cl((c - .2) / .7)); bgL.style.opacity = bo.toFixed(3);
      hero.style.setProperty("--p", cl(a / .8).toFixed(3)); (hero.style as CSSStyleDeclaration & { visibility?: string }).visibility = a >= 1 ? "hidden" : "";
      const z = ease(cl(a / .85));
      hc.style.transformOrigin = "56% 44%"; hc.style.transform = `scale(${(1 - z * .5).toFixed(3)})`; hc.style.opacity = (1 - cl((a - .1) / .75)).toFixed(3);
      if (z > .005 && a < 1) { kD.setAttribute("scale", (z * 170).toFixed(1)); kT.setAttribute("baseFrequency", `${(.006 + .003 * Math.sin(now * .0007)).toFixed(4)} ${(.014 + .006 * Math.cos(now * .0009)).toFixed(4)}`); hc.style.filter = `url(#kHz) blur(${(z * 12).toFixed(1)}px) brightness(${(1 + z * .7).toFixed(2)})`; } else hc.style.filter = "none";
      const gp = cl((a - .08) / .84), gs = Math.sin(Math.PI * gp); ghost.style.opacity = (gs * .9).toFixed(3); ghost.style.transform = `scale(${(1.9 - gp * .95).toFixed(3)})`; ghost.style.filter = `blur(${((1 - gs) * 10).toFixed(1)}px)`;
      about.style.setProperty("--ab", ce.toFixed(3)); about.style.setProperty("--abo", cl((ce - .3) / .7).toFixed(3));
      const hold = a > .93; if (hold !== held) { held = hold; if (window.__heroA) window.__heroA.hold(hold); }
      place();
      if (bo > .01) { hw.halos(now, cl(vel, -4, 4), pos); hw.wall(now, pos, step, CY); }
    }
    function loop(ts: number) {
      requestAnimationFrame(loop);
      const dt = Math.min(.05, (ts - lt) / 1000 || .016); lt = ts;
      cur += (tgt - cur) * (1 - Math.pow(.0002, dt)); if (Math.abs(tgt - cur) < 5e-4) cur = tgt;
      render(cur, dt, ts);
    }
    addEventListener("scroll", () => { tgt = measure(); lastSc = performance.now(); }, { passive: true });
    let lw = innerWidth, lh = innerHeight;
    addEventListener("resize", () => { if (innerWidth === lw && Math.abs(innerHeight - lh) < 150) return; lw = innerWidth; lh = innerHeight; size(); cur = tgt; });
    size(); cur = tgt; document.fonts.ready.then(() => { size(); cur = tgt; }); requestAnimationFrame(loop);
  }
}
