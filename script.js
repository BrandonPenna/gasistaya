/* =========================================================
   GasistaYa · Interacciones
   ========================================================= */

(() => {
  "use strict";

  document.documentElement.classList.remove("no-js");

  // Número en formato internacional para WhatsApp (54 + 9 + área sin 0 + número sin 15)
  const WA_NUMBER = "5492235054579";
  const WA_DEFAULT_MSG = "Hola GasistaYa, quería hacer una consulta.";

  const waLink = (msg) =>
    `https://wa.me/${WA_NUMBER}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;

  /* ---------- Links de WhatsApp con mensaje precargado ---------- */
  document.querySelectorAll(".js-wa").forEach((el) => {
    el.href = waLink(el.dataset.msg || WA_DEFAULT_MSG);
  });

  /* ---------- Header al hacer scroll ---------- */
  const header = document.getElementById("header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menú mobile ---------- */
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("nav");

  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    nav.classList.toggle("is-open", open);
    header.classList.toggle("menu-open", open);
  };

  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  /* ---------- Link activo según la sección visible ---------- */
  const navLinks = [...nav.querySelectorAll('a[href^="#"]:not(.nav__cta)')];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) =>
            a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`)
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));

    /* ---------- Animación de aparición ---------- */
    const reveal = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 70}ms`;
      reveal.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Estado según horario (guardia nocturna) ---------- */
  const statusText = document.getElementById("statusText");
  const hour = new Date().getHours();
  if (statusText && (hour >= 22 || hour < 7)) {
    statusText.textContent = "Guardia nocturna activa";
    const statusSub = document.getElementById("statusSub");
    if (statusSub) statusSub.textContent = "Te atendemos ahora";
  }

  /* ---------- Zona: cada barrio muestra su ubicación en el mapa ---------- */
  const zonaMap = document.getElementById("zonaMap");
  const zonaTags = document.getElementById("zonaTags");
  if (zonaMap && zonaTags) {
    zonaTags.addEventListener("click", (e) => {
      const tag = e.target.closest(".tag");
      if (!tag) return;
      zonaTags.querySelectorAll(".tag").forEach((t) => {
        t.classList.toggle("is-active", t === tag);
        t.setAttribute("aria-pressed", String(t === tag));
      });
      zonaMap.src = `https://www.google.com/maps?q=${encodeURIComponent(tag.dataset.q)}&z=${tag.dataset.z}&output=embed`;
      zonaMap.title = `Mapa de ${tag.textContent}`;
    });
  }

  /* ---------- Cartel de "Gracias por elegirnos" ---------- */
  const thanks = document.getElementById("thanks");
  let thanksTimer;

  const hideThanks = () => {
    clearTimeout(thanksTimer);
    thanks.classList.remove("is-open");
    // Se oculta al terminar el fundido, salvo que se haya vuelto a abrir
    setTimeout(() => { if (!thanks.classList.contains("is-open")) thanks.hidden = true; }, 300);
  };

  const showThanks = () => {
    thanks.hidden = false;
    requestAnimationFrame(() => thanks.classList.add("is-open"));
    document.getElementById("thanksClose").focus();
    clearTimeout(thanksTimer);
    thanksTimer = setTimeout(hideThanks, 7000);
  };

  if (thanks) {
    document.getElementById("thanksClose").addEventListener("click", hideThanks);
    thanks.addEventListener("click", (e) => e.target === thanks && hideThanks());
    document.addEventListener("keydown", (e) => e.key === "Escape" && !thanks.hidden && hideThanks());
  }

  /* ---------- Formulario → WhatsApp ---------- */
  const form = document.getElementById("contactForm");
  if (form) {
    const errorBox = document.getElementById("formError");
    const fields = Object.fromEntries(
      ["name", "service", "zone", "message", "urgent"].map((id) => [id, document.getElementById(id)])
    );
    const REQUIRED = ["name", "service", "zone"];

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = fields.name.value.trim();
      const service = fields.service.value;
      const zone = fields.zone.value.trim();
      const message = fields.message.value.trim();
      const urgent = fields.urgent.checked;

      // Campos obligatorios: se marcan en rojo los que faltan y se enfoca el primero
      const missing = REQUIRED.filter((id) => !fields[id].value.trim());
      REQUIRED.forEach((id) => fields[id].classList.toggle("is-invalid", missing.includes(id)));

      if (missing.length) {
        errorBox.textContent = "Completá tu nombre, elegí el servicio e indicá tu barrio o zona.";
        errorBox.hidden = false;
        fields[missing[0]].focus();
        return;
      }
      errorBox.hidden = true;

      const lines = [
        urgent ? "🚨 *URGENCIA*" : null,
        `Hola GasistaYa, soy *${name}*.`,
        `Servicio: ${service}`,
        `Zona: ${zone}`,
        message ? `Detalle: ${message}` : null,
      ].filter(Boolean);

      window.open(waLink(lines.join("\n")), "_blank", "noopener");
      form.reset();
      if (thanks) showThanks();
    });

    REQUIRED.forEach((id) =>
      fields[id].addEventListener("input", () => fields[id].classList.remove("is-invalid"))
    );
  }

  /* ---------- Año del footer ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
