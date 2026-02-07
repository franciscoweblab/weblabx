document.addEventListener("DOMContentLoaded", () => {

const btn = document.getElementById("checkDns");
const recheckBtn = document.getElementById("recheck");

const domainInput = document.getElementById("domain");
const recordSelect = document.getElementById("record");

const resultCard = document.getElementById("result-card");
const resolversCard = document.getElementById("resolvers-card");

const consensusEl = document.getElementById("consensus-label");
const dominantEl = document.getElementById("dominant");
const respondersEl = document.getElementById("responders");

const resolverList = document.getElementById("resolver-list");

const params = new URLSearchParams(window.location.search);

const autoDomain = params.get("domain");
const autoType = params.get("type");

if(autoDomain){

  domainInput.value = autoDomain;

  if(autoType){
    recordSelect.value = autoType;
  }

  runLookup();
}


const API_BASE =
  location.hostname === "weblabx.com"
    ? ""
    : "https://weblabx.com";


/* ================= API ================= */

async function checkDNS(domain,type){

  const res = await fetch(
    `${API_BASE}/api/dns?domain=${domain}&type=${type}`
  );

  if(!res.ok) throw new Error("DNS lookup failed");

  return res.json();
}


/* ================= GLOBAL STATUS ================= */

function globalStatus(propagation){

  if(propagation === null || propagation === undefined || isNaN(propagation)){
    return {
      label: "Unknown",
      class: "status-neutral",
      note: "Unable to determine DNS status."
    };
  }

  if(propagation >= 90){
    return {
      label: "Fully propagated",
      class: "status-good",
      note: "All monitored DNS resolvers agree globally."
    };
  }

  if(propagation >= 50){
    return {
      label: "Propagating globally",
      class: "status-progress",
      note: "DNS updates are spreading across networks."
    };
  }

  return {
    label: "Limited propagation",
    class: "status-neutral",
    note: "Record visible only in some regions."
  };
}


/* ================= MAP STATUS ================= */

function stateClass(state){

  if(state === "propagated") return "ok";
  if(state === "different") return "diff";

  return "error";
}


/* ================= LOADING UI ================= */

function showLoading(){

  consensusEl.innerHTML = `
    <div class="dns-status status-progress">
        <div class="dns-label">Running global DNS verification…</div>
        <div class="dns-note">Contacting distributed DNS networks.</div>
    </div>
  `;

  dominantEl.textContent="—";
  respondersEl.textContent="—";
}


/* Fake resolver animation (perceived performance boost) */

function animateResolvers(){

  const steps = [
    "Contacting Cloudflare…",
    "Contacting Google Public DNS…",
    "Contacting AdGuard…",
    "Querying NextDNS edge…",
    "Aggregating resolver responses…"
  ];

  let i = 0;

  return setInterval(()=>{

    if(i < steps.length){

      consensusEl.innerHTML = `
        <div class="dns-status status-progress">
            <div class="dns-label">${steps[i]}</div>
            <div class="dns-note">Running global DNS verification.</div>
        </div>
      `;

      i++;
    }

  }, 420); // sweet spot
}


/* ================= RENDER ================= */

function render(data){

  resultCard.classList.remove("hidden");
  resolversCard.classList.remove("hidden");

  const results = Array.isArray(data.results) ? data.results : [];

  const respondersCount =
    results.filter(r => r.state !== "no-response").length;

  const realPropagation = results.length
    ? Math.round((respondersCount / results.length) * 100)
    : 0;

  const status = globalStatus(realPropagation);

  consensusEl.innerHTML = `
    <div class="dns-status ${status.class}">
        <div class="dns-label">${status.label}</div>
        <div class="dns-note">${status.note}</div>
    </div>
  `;

  dominantEl.textContent = data.dominant ?? "—";
  respondersEl.textContent = `${respondersCount}/${results.length}`;

  resolverList.innerHTML = "";


  const mapIds = {
    "Cloudflare":"map-cloudflare",
    "Google":"map-google",
    "AdGuard":"map-adguard",
    "CleanBrowsing":"map-clean",
    "NextDNS":"map-nextdns"
  };


  results
    .sort((a,b)=>{
      const order = {propagated:0, different:1, "no-response":2};
      return order[a.state] - order[b.state];
    })
    .forEach(r=>{

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${r.resolver}</td>
        <td>${r.region}</td>
        <td>${r.value ?? "No response"}</td>
        <td>${r.ttl ?? "—"}</td>
        <td>
          <span class="status-badge status-${stateClass(r.state)}">
            ${r.state}
          </span>
        </td>
      `;

      resolverList.appendChild(tr);

      const id = mapIds[r.resolver];

      if(id){
        const el = document.getElementById(id);
        if(!el) return;

        el.classList.remove("ok","diff","error");
        el.classList.add(stateClass(r.state));
      }

    });

}


/* ================= RUN LOOKUP ================= */

async function runLookup(){

  const domain = domainInput.value.trim();
  const type = recordSelect.value;

  if(!domain) return;

  const newUrl = `${window.location.pathname}?domain=${encodeURIComponent(domain)}&type=${type}`;
  window.history.replaceState(null, "", newUrl);

  showLoading();
  resolverList.innerHTML="";


  showLoading();
  resolverList.innerHTML="";

  const loader = animateResolvers();

  const MIN_LOADING_TIME = 750;
  const start = performance.now();

  try{

    const data = await checkDNS(domain,type);

    const elapsed = performance.now() - start;
    const remaining = MIN_LOADING_TIME - elapsed;

    setTimeout(()=>{

      clearInterval(loader);
      render(data);

    }, remaining > 0 ? remaining : 0);

  }
  catch(err){

    clearInterval(loader);

    consensusEl.innerHTML = `
      <div class="dns-status status-neutral">
          <div class="dns-label">Lookup failed</div>
          <div class="dns-note">Unable to reach DNS resolvers.</div>
      </div>
    `;
  }

}



/* ================= EVENTS ================= */

btn.addEventListener("click",runLookup);

if(recheckBtn){
  recheckBtn.addEventListener("click",runLookup);
}

domainInput.addEventListener("keydown",e=>{
  if(e.key==="Enter") runLookup();
});

});

document.querySelectorAll(".faq-question")
.forEach(btn=>{

  btn.addEventListener("click",()=>{

    const current = btn.parentElement;

    document.querySelectorAll(".faq-item")
      .forEach(item=>{
        if(item !== current){
          item.classList.remove("open");
        }
      });

    current.classList.toggle("open");

  });

});

