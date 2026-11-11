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
