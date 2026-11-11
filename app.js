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
