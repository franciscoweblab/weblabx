function ipToInt(ip) {
  return ip.split(".").reduce((acc, o) => (acc << 8) + +o, 0) >>> 0;
}

function intToIp(int) {
  return [(int>>>24)&255, (int>>>16)&255, (int>>>8)&255, int&255].join(".");
}

function toBinary(ip) {
  return ip.split(".")
    .map(o => (+o).toString(2).padStart(8, "0"))
    .join(".");
}

function toHex(ip) {
  return ip.split(".")
    .map(o => (+o).toString(16).padStart(2, "0"))
    .join(".")
    .toUpperCase();
}

function getClass(firstOctet) {
  if (firstOctet <= 127) return "A";
  if (firstOctet <= 191) return "B";
  if (firstOctet <= 223) return "C";
  if (firstOctet <= 239) return "D";
  return "E";
}

function calculateSubnet() {
  const ip = document.getElementById("ip").value.trim();
  const cidr = +document.getElementById("cidr").value;

  if (!ip || cidr < 0 || cidr > 32) return;

  const ipInt = ipToInt(ip);
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const wildcard = (~mask) >>> 0;

  const network = ipInt & mask;
  const broadcast = network | wildcard;

  const hosts = cidr >= 31 ? 0 : (2 ** (32 - cidr)) - 2;
  const firstHost = hosts ? network + 1 : network;
  const lastHost = hosts ? broadcast - 1 : broadcast;

  const subnetMask = intToIp(mask);
  const wildcardMask = intToIp(wildcard);

  // OUTPUTS
  document.getElementById("net-class").textContent = getClass(+ip.split(".")[0]);
  document.getElementById("network").textContent = intToIp(network);
  document.getElementById("broadcast").textContent = intToIp(broadcast);
  document.getElementById("first-host").textContent = intToIp(firstHost);
  document.getElementById("last-host").textContent = intToIp(lastHost);
  document.getElementById("hosts").textContent = hosts;

  document.getElementById("subnet-mask").textContent = subnetMask;
  document.getElementById("wildcard-mask").textContent = wildcardMask;
  document.getElementById("cidr-out").textContent = `/${cidr}`;
  document.getElementById("net-bits").textContent = cidr;
  document.getElementById("host-bits").textContent = 32 - cidr;

  document.getElementById("hex-ip").textContent = toHex(ip);
  document.getElementById("binary-mask").textContent = toBinary(subnetMask);
  document.getElementById("subnet-result").classList.remove("hidden");
}

/* ================= ADVANCED TOGGLE (mantido) ================= */

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggle-advanced");
  const advanced = document.getElementById("advanced-results");

  if (!toggleBtn || !advanced) return;

  advanced.classList.add("hidden");
  toggleBtn.textContent = "Show advanced options";

  toggleBtn.addEventListener("click", () => {
    const isOpen = !advanced.classList.contains("hidden");

    advanced.classList.toggle("hidden");
    toggleBtn.textContent = isOpen
      ? "Show advanced options"
      : "Hide advanced options";
  });
});

/* ================= COPY RESULTS (ADICIONADO, NÃO REMOVE NADA) ================= */

document.addEventListener("click", (e) => {
  if (e.target.id !== "copy-results") return;

  const resultBox = document.getElementById("subnet-result");
  if (!resultBox) return;

  const text = resultBox.innerText
    .replace(/\n{2,}/g, "\n")
    .trim();

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      copyFeedback(e.target);
    }).catch(() => {
      legacyCopy(text, e.target);
    });
  } else {
    legacyCopy(text, e.target);
  }
});

function legacyCopy(text, btn) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);

  copyFeedback(btn);
}

function copyFeedback(btn) {
  const original = btn.textContent;
  btn.textContent = "Copiado ✔";
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 1500);
}
