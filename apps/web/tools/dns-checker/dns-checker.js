document.addEventListener("DOMContentLoaded", () => {

  /* ================= ELEMENTOS ================= */

  const btnSingle = document.getElementById("checkDns");
  const btnAll = document.getElementById("checkAll");
  const btnPropagation = document.getElementById("checkPropagation");

  const domainInput = document.getElementById("domain");
  const recordSelect = document.getElementById("record");
  const resultBox = document.getElementById("result");

  const mapBox = document.getElementById("dnsMap");
  const mapGrid = document.getElementById("mapGrid");

  /* ================= CONSTANTES ================= */

  const ALL_RECORDS = [
    "A","AAAA","CNAME","MX","TXT","NS","SOA",
    "SRV","PTR","CAA","DNSKEY","DS","NAPTR",
    "HTTPS","SVCB"
  ];

  // resolvers CORS-safe (frontend)
  const RESOLVERS = [
    { name: "Google (US)", url: "https://dns.google/resolve" },
    { name: "Google (EU)", url: "https://dns.google/resolve" },
    { name: "Google (AS)", url: "https://dns.google/resolve" }
  ];

  /* ================= DNS NORMAL ================= */

  btnSingle.addEventListener("click", () => {
    const domain = domainInput.value.trim();
    const type = recordSelect.value;

    if (!domain) {
      showError("Introduz um domínio válido.");
      return;
    }

    runQueries(domain, [type]);
  });

  btnAll.addEventListener("click", () => {
    const domain = domainInput.value.trim();

    if (!domain) {
      showError("Introduz um domínio válido.");
      return;
    }

    runQueries(domain, ALL_RECORDS);
  });

  async function runQueries(domain, records) {
    resultBox.textContent = "A consultar DNS...";

    const queries = records.map(type =>
      fetch(`https://dns.google/resolve?name=${domain}&type=${type}`)
        .then(r => r.json())
        .then(data => ({ type, data }))
        .catch(() => ({ type, error: true }))
    );

    const results = await Promise.all(queries);
    let html = "";

    results.forEach(({ type, data, error }) => {
      let block = "";

      if (error || !data || data.Status !== 0) {
        block = `<div style="opacity:.5">— sem registos —</div>`;
      } else if (data.Answer?.length) {
        block = data.Answer.map(r =>
          `<div><strong>${type}</strong> → ${r.data}</div>`
        ).join("");
      } else {
        block = `<div style="opacity:.5">— sem registos —</div>`;
      }

      html += `
        <div style="margin-top:18px"><strong>${type}</strong></div>
        ${block}
      `;
    });

    resultBox.innerHTML = html;
  }

  /* ================= PROPAGAÇÃO DNS ================= */

  btnPropagation.addEventListener("click", async () => {
    const domain = domainInput.value.trim();
    const type = recordSelect.value;

    if (!domain) {
      alert("Introduz um domínio primeiro");
      return;
    }

    mapBox.classList.remove("hidden");
    mapBox.scrollIntoView({ behavior: "smooth" });
    mapGrid.innerHTML = "";

    // UI inicial
    RESOLVERS.forEach(r => {
      const el = document.createElement("div");
      el.className = "map-point loading";
      el.dataset.name = r.name;
      el.innerHTML = `<strong>${r.name}</strong><br>A consultar...`;
      mapGrid.appendChild(el);
    });

    // valor de referência (Google)
    let baseValue = null;
    try {
      const base = await fetch(
        `https://dns.google/resolve?name=${domain}&type=${type}`
      ).then(r => r.json());

      baseValue = base.Answer?.[0]?.data || null;
    } catch {
      baseValue = null;
    }

    // queries paralelas
    const checks = RESOLVERS.map(r =>
      fetch(`${r.url}?name=${domain}&type=${type}`)
        .then(res => res.json())
        .then(data => ({ name: r.name, data }))
        .catch(() => ({ name: r.name, error: true }))
    );

    const results = await Promise.allSettled(checks);

    results.forEach(res => {
      if (res.status !== "fulfilled") return;

      const { name, data, error } = res.value;

      const el = [...mapGrid.children].find(
        e => e.dataset.name === name
      );
      if (!el) return;

      el.classList.remove("loading");

      if (error || !data || !data.Answer) {
        el.classList.add("error");
        el.innerHTML = `<strong>${name}</strong><br>Sem resposta`;
        return;
      }

      const val = data.Answer[0]?.data;

      el.classList.add(val === baseValue ? "ok" : "diff");
      let icon = "✔";
	  let label = "Propagado";

	if (val !== baseValue) {
	icon = "⚠";
	label = "Diferente";
}

el.innerHTML = `
  <strong>${icon} ${name}</strong><br>
  ${val}<br>
  <span style="opacity:.7;font-size:.75rem">${label}</span>
`;

    });
  });

  /* ================= HELPERS ================= */

  function showError(msg) {
    resultBox.textContent = "⚠️ " + msg;
  }

});
