const input = document.getElementById("whois-input");
const btn = document.getElementById("whois-btn");
const result = document.getElementById("whois-result");

btn.addEventListener("click", lookup);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") lookup();
});

/* ================= STATUS → BADGES ================= */

function mapStatusToBadge(status) {
  const map = {
    "client delete prohibited": {
      label: "Protected against deletion",
      type: "safe"
    },
    "client transfer prohibited": {
      label: "Transfer locked",
      type: "safe"
    },
    "client update prohibited": {
      label: "Updates locked",
      type: "info"
    },
    "server delete prohibited": {
      label: "Server delete prohibited",
      type: "info"
    },
    "server transfer prohibited": {
      label: "Registry lock enabled",
      type: "info"
    },
    "server update prohibited": {
      label: "Server update prohibited",
      type: "info"
    },
    "server hold": {
      label: "Server hold",
      type: "danger"
    },
    "pending delete": {
      label: "Pending delete",
      type: "warn"
    },
    "ok": {
      label: "OK",
      type: "info"
    }
  };

  return map[status] || {
    label: status,
    type: "info"
  };
}

/* ================= LOOKUP ================= */

async function lookup() {
  const query = input.value.trim();
  if (!query) return;

  result.innerHTML = "⏳ Consulting WHOIS...";

  try {
    const res = await fetch(
      `https://who-is.franciscovbj10.workers.dev/?query=${encodeURIComponent(query)}`
    );

    const data = await res.json();
    console.log("WHOIS DATA:", data);

    if (data.error) {
      throw new Error(data.error);
    }

    renderResult(data);

  } catch (err) {
    result.innerHTML = `
      <span style="color:#ef4444">
        ❌ Unable to retrieve public registration data for this domain.
      </span>
    `;
  }
}

/* ================= RENDER ================= */

function renderResult(data) {
  // Registrar
  const registrar =
    data.entities
      ?.find(e => e.roles?.includes("registrar"))
      ?.vcardArray?.[1]
      ?.find(v => v[0] === "fn")?.[3] || "-";

  // Datas
  const created =
    data.events?.find(e => e.eventAction === "registration")?.eventDate || "-";

  const expires =
    data.events?.find(e => e.eventAction === "expiration")?.eventDate || "-";

  // Status → badges
  const statusBadges = (data.status || []).map(s => {
    const badge = mapStatusToBadge(s);
    return `<span class="whois-badge ${badge.type}">${badge.label}</span>`;
  }).join("");

  // Nameservers
  const nameservers = (data.nameservers || []).map(ns => ns.ldhName);

  result.innerHTML = `
    <div class="whois-grid">

      <div class="whois-label">Domain</div>
      <div class="whois-value">${data.ldhName || "-"}</div>

      <div class="whois-label">Registrar</div>
      <div class="whois-value">${registrar}</div>

      <div class="whois-label">Created</div>
      <div class="whois-value">${created}</div>

      <div class="whois-label">Expires</div>
      <div class="whois-value">${expires}</div>

      <div class="whois-label">Status</div>
      <div class="whois-value">
        <div class="whois-badges">
          ${statusBadges || "<span>-</span>"}
        </div>
      </div>

      <div class="whois-full">
        <div class="whois-label">Nameservers</div>
        ${
          nameservers.length
            ? `<ul class="whois-ns">
                ${nameservers.map(ns => `<li>${ns}</li>`).join("")}
              </ul>`
            : `<div class="whois-value">-</div>`
        }
      </div>

    </div>
  `;
}
