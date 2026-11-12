/* =========================================================
   GasistaYa · Interacciones
   ---------------------------------------------------------
   Cada bloque es independiente: si en una página falta el
   elemento que necesita, ese bloque no hace nada y el resto
   sigue funcionando.
   ========================================================= */

(() => {
  "use strict";

  // Avisa al CSS que hay JavaScript (habilita la animación de aparición)
  document.documentElement.classList.remove("no-js");

  const byId = (id) => document.getElementById(id);
  const hasObserver = "IntersectionObserver" in window;

  /* ---------- WhatsApp: enlaces con mensaje precargado ---------- */
  // Número en formato internacional (54 + 9 + área sin 0 + número sin 15)
  const WA_NUMBER = "5492235054579";
  const WA_DEFAULT_MSG = "Hola GasistaYa, quería hacer una consulta.";

  const waLink = (msg) =>
    `https://wa.me/${WA_NUMBER}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;

  // Cada enlace .js-wa abre el chat con el mensaje de su data-msg (o el genérico)
  document.querySelectorAll(".js-wa").forEach((el) => {
    el.href = waLink(el.dataset.msg || WA_DEFAULT_MSG);
  });

  /* ---------- Header: cambia de aspecto al hacer scroll ---------- */
  const header = byId("header");

  if (header) {
    const SCROLL_OFFSET = 20; // px
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > SCROLL_OFFSET);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Menú mobile ---------- */
  const toggle = byId("menuToggle");
  const nav = byId("nav");

  if (header && toggle && nav) {
    const setMenu = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      nav.classList.toggle("is-open", open);
      header.classList.toggle("menu-open", open);
    };

    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---------- Menú: resalta la sección que se está viendo ---------- */
  if (nav && hasObserver) {
    const links = [...nav.querySelectorAll('a[href^="#"]:not(.nav__cta)')];
    const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);

    if (sections.length) {
      const spy = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((a) =>
              a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`)
            );
          });
        },
        { rootMargin: "-45% 0px -50% 0px" } // franja angosta en el medio de la pantalla
      );
      sections.forEach((section) => spy.observe(section));
    }
  }

  /* ---------- Animación de aparición ---------- */
  const reveals = document.querySelectorAll(".reveal");

  if (hasObserver) {
    const STAGGER_MS = 70; // los elementos vecinos aparecen escalonados, de a cuatro
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * STAGGER_MS}ms`;
      revealObserver.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Cartel de estado: de noche avisa que hay guardia ---------- */
  const statusText = byId("statusText");
  const statusSub = byId("statusSub");

  if (statusText) {
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 7;
    if (isNight) {
      // Textos del mismo largo que los de día, para que el cartel entre en un renglón en celular
      statusText.textContent = "Guardia nocturna";
      if (statusSub) statusSub.textContent = "Atendemos ahora";
    }
  }

  /* ---------- Zona: mapa diferido y barrios ---------- */
  const zonaMap = byId("zonaMap");
  const zonaTags = byId("zonaTags");

  // El mapa es pesado: se carga recién cuando el usuario se acerca a la sección
  if (zonaMap && zonaMap.dataset.src) {
    const loadMap = () => {
      if (!zonaMap.getAttribute("src")) zonaMap.src = zonaMap.dataset.src;
    };

    if (hasObserver) {
      const mapObserver = new IntersectionObserver(
        (entries, observer) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            loadMap();
            observer.disconnect();
          }
        },
        { rootMargin: "300px" }
      );
      mapObserver.observe(zonaMap);
    } else {
      loadMap();
    }
  }

  // Cada barrio muestra su ubicación en el mapa
  if (zonaMap && zonaTags) {
    const tags = [...zonaTags.querySelectorAll(".tag")];
    const mapUrl = (query, zoom) =>
      `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;

    tags.forEach((tag) => tag.setAttribute("aria-pressed", "false"));

    zonaTags.addEventListener("click", (e) => {
      const chosen = e.target.closest(".tag");
      if (!chosen) return;
      tags.forEach((tag) => {
        const isChosen = tag === chosen;
        tag.classList.toggle("is-active", isChosen);
        tag.setAttribute("aria-pressed", String(isChosen));
      });
      zonaMap.src = mapUrl(chosen.dataset.q, chosen.dataset.z);
      zonaMap.title = `Mapa de ${chosen.textContent}`;
    });
  }

  /* ---------- Cartel de "Gracias por elegirnos" ---------- */
  const thanks = byId("thanks");
  const thanksClose = byId("thanksClose");
  const hasThanks = Boolean(thanks && thanksClose);
  const THANKS_FADE_MS = 300;      // igual a la transición de .thanks en el CSS
  const THANKS_VISIBLE_MS = 7000;  // se cierra solo
  let thanksTimer;

  const hideThanks = () => {
    clearTimeout(thanksTimer);
    thanks.classList.remove("is-open");
    // Se oculta al terminar el fundido, salvo que se haya vuelto a abrir
    setTimeout(() => {
      if (!thanks.classList.contains("is-open")) thanks.hidden = true;
    }, THANKS_FADE_MS);
  };

  const showThanks = () => {
    thanks.hidden = false;
    requestAnimationFrame(() => thanks.classList.add("is-open"));
    thanksClose.focus();
    clearTimeout(thanksTimer);
    thanksTimer = setTimeout(hideThanks, THANKS_VISIBLE_MS);
  };

  if (hasThanks) {
    thanksClose.addEventListener("click", hideThanks);
    // Clic en el fondo oscuro (fuera de la tarjeta)
    thanks.addEventListener("click", (e) => {
      if (e.target === thanks) hideThanks();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !thanks.hidden) hideThanks();
    });
  }

  /* ---------- Formulario de presupuesto → WhatsApp ---------- */
  const form = byId("contactForm");
  const errorBox = byId("formError");
  const fields = Object.fromEntries(
    ["name", "service", "zone", "message", "urgent"].map((id) => [id, byId(id)])
  );

  if (form && errorBox && Object.values(fields).every(Boolean)) {
    const REQUIRED = ["name", "service", "zone"];

    // Si se llega desde una página de servicio (presupuesto.html?servicio=...), ese servicio queda elegido
    const wanted = new URLSearchParams(window.location.search).get("servicio");
    const preset = wanted && [...fields.service.options].find((option) => option.dataset.key === wanted);
    if (preset) fields.service.value = preset.value;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

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

      const message = fields.message.value.trim();
      const lines = [
        fields.urgent.checked ? "🚨 *URGENCIA*" : null,
        `Hola GasistaYa, soy *${fields.name.value.trim()}*.`,
        `Servicio: ${fields.service.value}`,
        `Zona: ${fields.zone.value.trim()}`,
        message ? `Detalle: ${message}` : null,
      ].filter(Boolean);

      window.open(waLink(lines.join("\n")), "_blank", "noopener");
      form.reset();
      if (hasThanks) showThanks();
    });

    // Al corregir un campo deja de marcarse en rojo
    REQUIRED.forEach((id) =>
      fields[id].addEventListener("input", () => fields[id].classList.remove("is-invalid"))
    );
  }

  /* ---------- Año del footer ---------- */
  const year = byId("year");
  if (year) year.textContent = new Date().getFullYear();
})();
