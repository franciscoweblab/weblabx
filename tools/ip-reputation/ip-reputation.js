document.addEventListener("DOMContentLoaded", () => {

  /* ================= SUPABASE ================= */

  const SUPABASE_URL = "https://ikskeifjjhprhjnddfmp.supabase.co";
  const SUPABASE_KEY = "sb_publishable_n28LPdChBnq3mrbrg1py-Q_K7Zabd0g";

  const SUPABASE_HEADERS = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json"
  };

  /* ================= ELEMENTOS ================= */

  const input = document.getElementById("ipInput");
  const button = document.getElementById("checkIp");
  const result = document.getElementById("result");

  /* ================= INIT ================= */

  renderLatestReportedIps();

  /* ================= EVENTS ================= */

  button.addEventListener("click", () => {
    const ip = input.value.trim();
    if (!ip) {
      showError("Introduz um IP válido.");
      return;
    }
    checkIp(ip);
  });

  /* ================= CHECK IP ================= */

  async function checkIp(ip) {
    result.innerHTML = "<span>A analisar IP…</span>";

    try {
      const res = await fetch(`https://ipwho.is/${ip}`);
      const data = await res.json();

      if (!data.success) {
        showError(data.message || "IP inválido.");
        return;
      }

      const localReports = getLocalReportCount(ip);
      const globalReports = await getGlobalReportCount(ip);
      const totalReports = localReports + globalReports;

      const risk = calculateRisk(data, totalReports);

      result.innerHTML = `
        <div class="risk-wrapper">
          <div class="risk-label">RISCO ESTIMADO</div>
          <div class="risk-bar">
            <div class="risk-fill" style="width:${risk.score}%"></div>
          </div>
          <div class="risk-text ${risk.level}">${risk.label}</div>
        </div>

        <ul>
          <li><strong>IP:</strong> ${ip}</li>
          <li><strong>País:</strong> ${data.country}</li>
          <li><strong>Cidade:</strong> ${data.city || "—"}</li>
          <li><strong>ISP:</strong> ${data.connection?.isp || "—"}</li>
          <li><strong>Tipo:</strong> ${data.type}</li>
          <li><strong>Proxy/VPN:</strong> ${data.proxy ? "Sim" : "Não"}</li>
        </ul>

        <div class="report-box">
          <div class="report-title">Reportar este IP</div>

          <select id="reportReason">
            <option value="">Seleciona um motivo</option>
            <option value="Spam">Spam</option>
            <option value="Bruteforce">Bruteforce</option>
            <option value="Scanner">Scanner</option>
            <option value="Abuse">Abuse</option>
            <option value="Outro">Outro</option>
          </select>

          <button id="reportIp">Reportar IP</button>
          <div class="report-msg" id="reportMsg"></div>
        </div>
      `;

      attachReportHandler(ip);

    } catch {
      showError("Erro ao consultar o serviço.");
    }
  }

  /* ================= REPORT ================= */

  function attachReportHandler(ip) {
    const btn = document.getElementById("reportIp");
    const reason = document.getElementById("reportReason");
    const msg = document.getElementById("reportMsg");

    btn.addEventListener("click", async () => {
      if (!reason.value) {
        msg.textContent = "Seleciona um motivo.";
        msg.style.color = "#facc15";
        return;
      }

      saveLocalReport(ip, reason.value);
      await saveGlobalReport(ip, reason.value);

      msg.textContent = "Obrigado! IP reportado.";
      msg.style.color = "#22c55e";

      setTimeout(() => {
        checkIp(ip);
        renderLatestReportedIps();
      }, 150);
    });
  }

  /* ================= LOCAL ================= */

  function saveLocalReport(ip, reason) {
    const reports = JSON.parse(localStorage.getItem("ipReports") || "[]");
    reports.unshift({ ip, reason, time: new Date().toISOString() });
    localStorage.setItem("ipReports", JSON.stringify(reports.slice(0, 20)));
  }

  function getReports() {
    return JSON.parse(localStorage.getItem("ipReports") || "[]");
  }

  function getLocalReportCount(ip) {
    return getReports().filter(r => r.ip === ip).length;
  }

  /* ================= SUPABASE ================= */

  async function getGlobalReportCount(ip) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/ip_reports?ip=eq.${ip}&select=id`,
        { headers: SUPABASE_HEADERS }
      );
      const data = await res.json();
      return data.length || 0;
    } catch {
      return 0;
    }
  }

  async function saveGlobalReport(ip, reason) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/ip_reports`, {
        method: "POST",
        headers: SUPABASE_HEADERS,
        body: JSON.stringify({ ip, reason })
      });
    } catch {}
  }

  /* ================= HISTÓRICO + BANDEIRAS ================= */

  async function renderLatestReportedIps() {
    const grid = document.getElementById("latestIpsGrid");
    if (!grid) return;

    grid.innerHTML = `
      <div class="ips-column"></div>
      <div class="ips-column"></div>
      <div class="ips-column"></div>
    `;

    const columns = grid.querySelectorAll(".ips-column");

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/ip_reports?select=ip,created_at&order=created_at.desc&limit=15`,
        { headers: SUPABASE_HEADERS }
      );

      const data = await res.json();
      if (!Array.isArray(data) || !data.length) {
        columns[0].innerHTML = "<span style='opacity:.6'>Sem reports.</span>";
        return;
      }

      data.forEach((row, i) => {
        const div = document.createElement("div");
        div.className = "ip-item";
        div.innerHTML = `
          <img src="https://flagcdn.com/w20/un.png" alt="">
          <div>
            <strong>${row.ip}</strong><br>
            <span style="opacity:.6;font-size:.7rem">
              ${new Date(row.created_at).toLocaleDateString("pt-PT")}
            </span>
          </div>
        `;

        columns[i % 3].appendChild(div);

        // carregar bandeira real sem bloquear
        fetch(`https://ipwho.is/${row.ip}`)
          .then(r => r.json())
          .then(geo => {
            if (
              geo &&
              geo.success === true &&
              typeof geo.country_code === "string" &&
              geo.country_code.length === 2
            ) {
              div.querySelector("img").src =
                `https://flagcdn.com/w20/${geo.country_code.toLowerCase()}.png`;
            }
          })
          .catch(() => {});
      });

    } catch {
      columns[0].innerHTML =
        "<span style='opacity:.6'>Erro ao carregar histórico.</span>";
    }
  }

  /* ================= RISK ================= */

  function calculateRisk(data, reportsCount) {
    let score = 0;
    if (data.proxy) score += 40;
    if (data.type === "hosting") score += 30;
    score += Math.min(reportsCount * 15, 45);
    score = Math.min(100, Math.max(0, score));

    if (score >= 70) return { score, level: "high", label: "🔴 Alto risco" };
    if (score >= 40) return { score, level: "medium", label: "🟡 Atenção" };
    return { score, level: "low", label: "🟢 Baixo risco" };
  }

  function showError(msg) {
    result.innerHTML = `<span style="color:#f87171">${msg}</span>`;
  }

});
