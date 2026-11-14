/* ---------- mobile navigation ---------- */
export function initNav(): void {
  const mb = document.getElementById("mb");
  const mn = document.getElementById("mn");
  if (!mb || !mn) return;
  const shut = () => { mn.classList.remove("on"); mb.setAttribute("aria-expanded", "false"); mb.textContent = "Menu"; document.body.style.overflow = ""; };
  mb.addEventListener("click", () => { const on = mn.classList.toggle("on"); mb.setAttribute("aria-expanded", String(on)); mb.textContent = on ? "Close" : "Menu"; document.body.style.overflow = on ? "hidden" : ""; });
  mn.querySelectorAll("a").forEach(a => a.addEventListener("click", shut));
  addEventListener("keydown", e => { if (e.key === "Escape") shut(); });
  addEventListener("resize", () => { if (innerWidth > 820) shut(); });
}
