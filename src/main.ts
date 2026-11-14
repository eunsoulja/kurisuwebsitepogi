import "../styles/base.css";
import "../styles/hero.css";
import "../styles/carousel.css";
import "../styles/sections.css";
import { CFG } from "./config";
import { initLoader } from "./loader";
import { initReveal } from "./reveal";
import { initNav } from "./nav";
import { initCarousel } from "./carousel";

function applyLinks(): void {
  document.querySelectorAll<HTMLAnchorElement>("[data-invite]").forEach((a) => {
    a.href = `https://discord.com/oauth2/authorize?client_id=${CFG.id}&permissions=1100451490998&scope=bot%20applications.commands`;
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll<HTMLAnchorElement>("[data-support]").forEach((a) => {
    a.href = CFG.support;
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll<HTMLAnchorElement>("[data-site]").forEach((a) => {
    a.href = CFG.site;
    a.target = "_blank";
    a.rel = "noopener";
  });
}

applyLinks();
initLoader();
initReveal();
initNav();
initCarousel();
