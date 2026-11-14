import { asciiLogo, type AsciiLogoHandle } from "./ascii-logo";

declare global {
  interface Window {
    __heroA?: AsciiLogoHandle;
  }
}

/* ---------- loading screen -> hero ASCII ---------- */
export function initLoader(): void {
  const hero = document.getElementById("top") as HTMLElement | null;
  const ld = document.getElementById("ld") as HTMLElement | null;
  if (!hero || !ld) return;
  const root = document.documentElement;
  const RM = matchMedia("(prefers-reduced-motion:reduce)").matches;
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);
  const L = asciiLogo(ld.querySelector("canvas") as HTMLCanvasElement, { center: true });
  let started = false;
  function enter() {
    if (started) return; started = true;
    root.classList.remove("lock"); root.classList.add("busy");
    ld!.classList.add("go");
    const finish = () => {
      window.__heroA = asciiLogo(document.getElementById("a") as HTMLCanvasElement, { t0: L.getT() });
      requestAnimationFrame(() => requestAnimationFrame(() => { L.destroy(); ld!.remove(); root.classList.remove("busy"); }));
    };
    if (RM) finish(); else L.morph(1700, finish);
  }
  ld.addEventListener("click", enter);
  ld.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); enter(); } });
}
