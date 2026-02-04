let mapInitialized = false;
let map;     // referência global
let marker;  // marcador global

document.addEventListener("DOMContentLoaded", () => {
  loadIP();
});

async function loadIP() {
  const ipEl = document.getElementById("ip");
  const ipVersionEl = document.getElementById("ip-version");
  const locationEl = document.getElementById("location");
  const coordsEl = document.getElementById("coords");
  const ispEl = document.getElementById("isp");
  const timezoneEl = document.getElementById("timezone");
  const copyBtn = document.getElementById("copy-ip");
  const reputationBtn = document.getElementById("ip-reputation");

  try {
    const res = await fetch("https://ipinfo.io/json");
    const data = await res.json();

    console.log("📦 IPINFO:", data);

    /* IP */
    ipEl.textContent = data.ip;
    ipVersionEl.textContent =
      data.ip.includes(":") ? "IPv6" : "IPv4";

    /* Localização */
    const locationText = `${data.city}, ${data.region}, ${data.country}`;
    locationEl.textContent = locationText;

    /* Coordenadas + MAPA */
    if (data.loc) {
      const [lat, lon] = data.loc.split(",").map(Number);
      coordsEl.textContent = `Lat: ${lat} | Lon: ${lon}`;

      initMap(lat, lon, locationText, data.ip);
    }

    /* ISP / ASN */
    ispEl.textContent = data.org;

    /* Timezone */
    timezoneEl.textContent = `Timezone: ${data.timezone}`;

    /* Copiar IP */
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(data.ip);
      copyBtn.textContent = "Copiado ✓";
      setTimeout(() => {
        copyBtn.textContent = "Copiar IP";
      }, 1500);
    });

    /* Reputação */
    reputationBtn.addEventListener("click", () => {
      window.location.href =
        `/tools/ip-reputation/?ip=${data.ip}`;
    });

  } catch (err) {
    console.error("Erro IP:", err);
    ipEl.textContent = "Erro";
    locationEl.textContent = "-";
    ispEl.textContent = "-";
  }
}

/* ======================
   MAPA (Leaflet)
====================== */

function initMap(lat, lon, locationText, ip) {
  console.log("🗺 initMap chamado:", lat, lon);

  if (mapInitialized) {
    map.flyTo([lat, lon], 11, { duration: 1.2 });
    marker.setLatLng([lat, lon]);
    return;
  }

  mapInitialized = true;

  map = L.map("ip-map", {
    zoomControl: false,
    attributionControl: false
  }).setView([lat, lon], 5); // começa afastado

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
  }).addTo(map);

  marker = L.marker([lat, lon]).addTo(map);

  marker.bindPopup(`
    <strong>${locationText}</strong><br>
    IP: ${ip}
  `);

  // animação suave até ao local
  setTimeout(() => {
    map.flyTo([lat, lon], 11, {
      animate: true,
      duration: 1.2
    });
    marker.openPopup();
    map.invalidateSize();
  }, 300);
}
