(() => {
  const root = document.documentElement;
  const managerUrl = (root.dataset.managerUrl || "").trim();
  const managerVersion = managerUrl.match(/Lucuma-Manager-(\d+\.\d+\.\d+)\.msi$/)?.[1];

  if (managerUrl) {
    document.querySelectorAll("[data-manager-download]").forEach((link) => { link.href = managerUrl; });
    document.querySelectorAll("[data-manager-sha]").forEach((link) => { link.href = managerUrl + ".sha256"; });
    document.querySelectorAll("[data-manager-label]").forEach((label) => {
      label.textContent = "Download Lucuma Manager" + (managerVersion ? " " + managerVersion : "");
    });
  }

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll("[data-play]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const frame = link.closest("[data-video]");
      if (!frame) return;
      event.preventDefault();
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + frame.dataset.video + "?rel=0&autoplay=1";
      iframe.title = "Lucuma in game";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      frame.replaceChildren(iframe);
      iframe.focus();
    });
  });

  // Hero slideshow: a new picture every 3 s; a click on the left half goes back, on the right half forward; a drag
  // follows the pointer and changes picture when released far enough. Holding a drag stops the timer, and every change
  // restarts it. The strip carries a copy of the last picture before the first and of the first after the last, so it
  // wraps around without running back through every picture.
  const frame = document.querySelector("[data-slides]");
  const track = frame?.querySelector("[data-track]");
  const slides = track ? Array.from(track.children) : [];
  if (frame && track && slides.length > 1) {
    const n = slides.length, DELAY = 3000;
    const head = slides[n - 1].cloneNode(true), tail = slides[0].cloneNode(true);
    [head, tail].forEach((c) => { c.alt = ""; c.setAttribute("aria-hidden", "true"); });
    track.prepend(head);
    track.append(tail);
    let pos = 1 + Math.floor(Math.random() * n), timer = 0, stopped = false;   // a random first picture, then in order
    let drag = null;   // { id, x0, t0, dx, moved } while a pointer is down

    const show = (el) => {
      if (el.dataset.src && !el.getAttribute("src")) el.src = el.dataset.src;
    };
    const load = () => {   // this picture and its neighbours, the copies with their originals
      [pos - 1, pos, pos + 1].forEach((p) => {
        const i = ((p - 1) % n + n) % n;
        show(slides[i]);
        if (i === n - 1) show(head);
        if (i === 0) show(tail);
      });
    };
    const place = (animate, px = 0) => {
      track.classList.toggle("is-animating", animate);
      track.style.transform = px ? `translateX(calc(${-pos * 100}% + ${px}px))` : `translateX(${-pos * 100}%)`;
    };
    const settle = () => {   // off a copy onto the real picture it shows, without animation
      if (pos === 0 || pos === n + 1) {
        pos = pos === 0 ? n : 1;
        place(false);
        void track.offsetWidth;   // apply the jump before any next transition
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      if (!stopped && !drag && !document.hidden) timer = setTimeout(() => go(1), DELAY);
    };
    const go = (step) => {
      settle();
      pos += step;
      load();
      place(true);
      schedule();
    };

    track.addEventListener("transitionend", (e) => { if (e.target === track) settle(); });
    place(false);
    load();
    schedule();

    frame.addEventListener("pointerdown", (e) => {
      if (stopped || drag || e.button !== 0 || e.target.closest("[data-play]")) return;
      clearTimeout(timer);   // no change while the pointer is held
      settle();
      place(false);
      drag = { id: e.pointerId, x0: e.clientX, t0: performance.now(), dx: 0, moved: false };
      frame.setPointerCapture(e.pointerId);
    });
    frame.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.x0;
      if (Math.abs(drag.dx) > 6) { drag.moved = true; frame.classList.add("is-dragging"); }
      if (drag.moved) place(false, drag.dx);
    });
    const release = (e, cancelled) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      frame.classList.remove("is-dragging");
      if (cancelled) { place(true); schedule(); return; }
      const w = frame.clientWidth;
      if (d.moved) {
        const fast = performance.now() - d.t0 < 250 && Math.abs(d.dx) > 30;
        if (d.dx < -w * 0.15 || (fast && d.dx < 0)) go(1);
        else if (d.dx > w * 0.15 || (fast && d.dx > 0)) go(-1);
        else { place(true); schedule(); }
      } else {
        const r = frame.getBoundingClientRect();
        go(e.clientX < r.left + r.width / 2 ? -1 : 1);
      }
    };
    frame.addEventListener("pointerup", (e) => release(e, false));
    frame.addEventListener("pointercancel", (e) => release(e, true));
    document.addEventListener("visibilitychange", schedule);
    frame.querySelector("[data-play]")?.addEventListener("click", () => {   // the video replaces the pictures
      stopped = true;
      clearTimeout(timer);
      frame.removeAttribute("data-slides");
      frame.classList.remove("is-dragging");
    });
  }

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

  const box = document.querySelector("[data-release]");
  if (!box || !window.fetch) return;
  const decode = (b64) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))));
  fetch("updates/latest.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      const manifest = decode(data.signed_manifest);
      const notes = String(manifest.release_notes || "").trim();
      if (!notes) return;
      const lines = notes.split("\n");
      const title = lines[0].trim();
      const body = lines.slice(1).join("\n").trim();
      box.querySelector("[data-release-title]").textContent = title;
      box.querySelector("[data-release-notes]").textContent = body;
      const date = String(manifest.published_at || "").slice(0, 10);
      if (date) box.querySelector("[data-release-date]").textContent = date;
    })
    .catch(() => {});
})();
