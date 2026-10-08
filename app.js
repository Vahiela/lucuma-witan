(() => {
  const root = document.documentElement;
  const managerUrl = (root.dataset.managerUrl || "").trim();
  const managerVersion = managerUrl.match(/Lucuma-Manager-(\d+\.\d+\.\d+)\.msi$/)?.[1];
  const managerLinks = document.querySelectorAll("[data-manager-download]");
  const managerLabels = document.querySelectorAll("[data-manager-label]");

  managerLinks.forEach((link) => {
    if (managerUrl) {
      link.href = managerUrl;
      link.classList.remove("is-disabled");
      link.removeAttribute("aria-disabled");
      managerLabels.forEach((label) => {
        const caption = label.dataset.managerLabel === "short" ? "Get Lucuma" : "Download Lucuma Manager";
        label.textContent = caption + (managerVersion ? " " + managerVersion : "");
      });
      return;
    }

    link.href = "#beta";
    link.classList.add("is-disabled");
    link.setAttribute("aria-disabled", "true");
    link.addEventListener("click", (event) => {
      if (link.closest("#beta")) event.preventDefault();
    });
  });

  const header = document.querySelector("[data-header]");
  const setHeaderState = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 18);
  };
  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    nav?.classList.toggle("is-open", !open);
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((node) => observer.observe(node));
  } else {
    reveals.forEach((node) => node.classList.add("is-visible"));
  }
})();
