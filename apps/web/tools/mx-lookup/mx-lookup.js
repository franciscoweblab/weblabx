/* DOMAIN VALIDATION */

const domainRegex =
  /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/;

/* SUMMARY BUILDER */

function buildMXSummary(records) {
  if (!records || records.length === 0) {
    return {
      class: "error",
      text: "❌ Nenhum registo MX encontrado"
    };
  }

  if (records.length === 1) {
    return {
      class: "warn",
      text: "⚠ Apenas um registo MX encontrado (sem redundância)"
    };
  }

  const priorities = records.map(r => r.prio);
  const unique = new Set(priorities);

  if (unique.size !== priorities.length) {
    return {
      class: "warn",
      text: "⚠ Existem prioridades MX duplicadas"
    };
  }

  return {
    class: "ok",
    text: `✔ MX configurado corretamente (${records.length} servidores)`
  };
}

/* LOOKUP */

async function lookupMX() {
  const domain = document.getElementById("mx-domain").value.trim();
  const dns = document.getElementById("dns-server").value;
  const out = document.getElementById("mx-result");

  if (!domainRegex.test(domain)) {
    out.classList.remove("hidden");
    out.innerHTML = `<p class="mx-summary error">❌ Domínio inválido</p>`;
    return;
  }

  out.classList.remove("hidden");
  out.innerHTML = `<p class="mx-summary">A consultar registos MX…</p>`;

  const url =
    dns === "cloudflare"
      ? `https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`
      : `https://dns.google/resolve?name=${domain}&type=MX`;

  try {
    const res = await fetch(url, {
      headers: dns === "cloudflare"
        ? { Accept: "application/dns-json" }
        : {}
    });

    const data = await res.json();

    if (!data.Answer) {
      out.innerHTML = `<p class="mx-summary error">❌ Nenhum registo MX encontrado</p>`;
      return;
    }

    const records = data.Answer
      .map(r => {
        const [prio, host] = r.data.split(" ");
        return { prio: Number(prio), host, ttl: r.ttl };
      })
      .sort((a, b) => a.prio - b.prio);

    const summary = buildMXSummary(records);

    const rows = records
  .map((r, index) => `
    <tr>
      <td>${r.prio}</td>
      <td>
        ${r.host}
        ${index === 0 ? `<span class="mx-badge">Primary</span>` : ``}
      </td>
      <td>${r.ttl}s</td>
    </tr>
  `)
  .join("");


    out.innerHTML = `
      <div class="mx-summary ${summary.class}">
        ${summary.text}
      </div>

      <table class="mx-table">
        <thead>
          <tr>
            <th>Priority</th>
            <th>Mail Server</th>
            <th>TTL</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <button class="copy-btn" id="copy-mx">
        Copiar resultados
      </button>
    `;
  } catch {
    out.innerHTML = `<p class="mx-summary error">Erro ao consultar registos MX.</p>`;
  }
}

/* COPY */

document.addEventListener("click", e => {
  if (e.target.id !== "copy-mx") return;

  const rows = [...document.querySelectorAll(".mx-table tbody tr")]
    .map(r => `${r.children[0].innerText} ${r.children[1].innerText}`)
    .join("\n");

  navigator.clipboard.writeText(rows);

  e.target.textContent = "Copiado ✔";
  setTimeout(() => {
    e.target.textContent = "Copiar resultados";
  }, 1500);
});

/* ENTER KEY */

document.getElementById("mx-domain")
  .addEventListener("keydown", e => {
    if (e.key === "Enter") lookupMX();
  });
