/* =========================================================
   ENV DETECTION
========================================================= */

const API_BASE =
  location.hostname.includes("localhost") ||
  location.hostname.startsWith("192.")
    ? "https://weblabx.com"
    : "";


/* =========================================================
   GLOBAL STATE
========================================================= */

let globalDNSData = null;
let activeMetric = "performance";


/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  loadGlobalDNS();

  document
    .getElementById("startTest")
    .addEventListener("click", runBenchmark);

  setupMetricButtons();

});


/* =========================================================
   HELPERS
========================================================= */

function getMetricValue(p){

  switch(activeMetric){

    case "uptime":
      return p.uptime ?? 0;

    case "quality":
      return (100 - p.uptime) + p.avg;

    default:
      return p.avg ?? Infinity;
  }

}


/* =========================================================
   LATENCY CLASSIFICATION (NO BARS)
========================================================= */

function latencyLabel(ms){

 if(ms < 20) return {label:"Ultra Fast", color:"#22c55e"};
 if(ms < 35) return {label:"Very Fast", color:"#84cc16"};
 if(ms < 55) return {label:"Fast", color:"#eab308"};
 if(ms < 80) return {label:"Moderate", color:"#f97316"};

 return {label:"Slow", color:"#ef4444"};
}


/* =========================================================
   PERCEPTUAL SCALE
========================================================= */

function perceptualScale(value, min, max, {
    floor = 30,
    power = 0.5,
    invert = false
} = {}){

    const range = Math.max(max - min, 0.0001);

    let normalized = invert
        ? (max - value) / range
        : (value - min) / range;

    normalized = Math.min(Math.max(normalized, 0), 1);

    const eased = Math.pow(normalized, power);

    return floor + eased * (100 - floor);
}


/* =========================================================
   METRIC COLORS
========================================================= */

function metricColor(p){

  if(activeMetric==="uptime"){

    if(p.uptime > 99.98) return "#22c55e";
    if(p.uptime > 99.9) return "#84cc16";
    if(p.uptime > 99.5) return "#eab308";

    return "#f97316";
  }

  if(activeMetric==="quality"){
    return "#60a5fa";
  }

  return "#22c55e";
}


/* =========================================================
   METRIC BUTTONS
========================================================= */

function setupMetricButtons(){

  document
    .querySelectorAll(".dns-toggle .btn")
    .forEach(btn => {

      btn.addEventListener("click", () => {

        document
          .querySelectorAll(".dns-toggle .btn")
          .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        const text = btn.textContent.toLowerCase();

        if(text.includes("uptime"))
          activeMetric = "uptime";

        else if(text.includes("quality"))
          activeMetric = "quality";

        else
          activeMetric = "performance";

        if(globalDNSData){
          renderGlobalTable(globalDNSData);
        }

      });

  });

}


/* =========================================================
   LOAD GLOBAL DNS
========================================================= */

async function loadGlobalDNS(){

  const status=document.getElementById("testStatus");

  try{

    status.textContent="Loading recommended DNS for your region...";

    const res = await fetch(`${API_BASE}/api/v1/dns/global`);

    if(!res.ok) throw new Error("API error");

    const data = await res.json();

    globalDNSData = data.providers;

    renderGlobalTable(globalDNSData);

    status.textContent=`Detected region: ${data.region.toUpperCase()}`;

  }catch(err){

    console.error(err);

    status.textContent="Could not load global DNS ranking.";

  }

}


/* =========================================================
   RENDER GLOBAL TABLE
========================================================= */

function renderGlobalTable(providers){

  const tbody = document.querySelector("#resultsTable tbody");
  tbody.innerHTML="";

  if(!providers?.length){
    tbody.innerHTML="<tr><td colspan='7'>No data available</td></tr>";
    return;
  }

  let sorted=[...providers];

  if(activeMetric==="uptime"){
    sorted.sort((a,b)=>b.uptime-a.uptime);
  }else{
    sorted.sort((a,b)=>getMetricValue(a)-getMetricValue(b));
  }

  const values = sorted.map(getMetricValue);
  const min = Math.min(...values);
  const max = Math.max(...values);

  sorted.forEach((p,i)=>{

    const value = getMetricValue(p);

    let performanceCell = "";
    let width;
    const color = metricColor(p);

    /* =============================
       RAW PERFORMANCE → BADGE
    ============================= */

    if(activeMetric === "performance"){

        const latency = latencyLabel(p.avg);

        performanceCell = `
          <span style="
            background:${latency.color}22;
            color:${latency.color};
            padding:4px 10px;
            border-radius:999px;
            font-weight:600;
            font-size:.8rem;
          ">
            ${latency.label}
          </span>
        `;
    }

    /* =============================
       UPTIME → COMPRESSED BAR
    ============================= */

    else if(activeMetric === "uptime"){

        width = perceptualScale(value, min, max, {
            floor: 88,
            power: 0.35
        });

        performanceCell = `
          <div class="perf-bar-wrap">
            <div class="perf-bar"></div>
          </div>
        `;
    }

    /* =============================
       QUALITY → BAR
    ============================= */

    else{

        width = perceptualScale(value, min, max, {
            floor: 40,
            power: 0.5,
            invert:true
        });

        performanceCell = `
          <div class="perf-bar-wrap">
            <div class="perf-bar"></div>
          </div>
        `;
    }

    const row=document.createElement("tr");

    row.innerHTML=`

      <td>${i+1}</td>

      <td><strong>${p.provider}</strong></td>

      <td>${p.avg} ms</td>

      <td>-</td>

      <td>-</td>

      <td>${performanceCell}</td>

      <td>${p.uptime}%</td>

    `;

    tbody.appendChild(row);

    // anima apenas se existir barra
    const bar = row.querySelector(".perf-bar");

    if(bar){

        bar.style.width="0%";
        bar.style.background=color;

        requestAnimationFrame(()=>{
          bar.style.width=width+"%";
        });
    }

  });

}


/* =========================================================
   LIVE BENCHMARK
========================================================= */

const providers = [

 {name:"Cloudflare", url:"https://cloudflare-dns.com/dns-query", ip:"1.1.1.1"},
 {name:"Google", url:"https://dns.google/dns-query", ip:"8.8.8.8"},
 {name:"Quad9", url:"https://dns.quad9.net/dns-query", ip:"9.9.9.9"},
 {name:"OpenDNS", url:"https://doh.opendns.com/dns-query", ip:"208.67.222.222"},
 {name:"AdGuard", url:"https://dns.adguard-dns.com/dns-query", ip:"94.140.14.14"}

];

const TIMEOUT = 2500;


/* =========================================================
   FETCH TIMEOUT
========================================================= */

function fetchWithTimeout(url, options={}, timeout=TIMEOUT){

 return Promise.race([
  fetch(url, options),
  new Promise((_,reject)=>
    setTimeout(()=>reject(new Error("timeout")), timeout)
  )
 ]);

}

function fetchWithTimeout(url, options={}, timeout=2500){

 return Promise.race([
  fetch(url, options),
  new Promise((_,reject)=>
    setTimeout(()=>reject(new Error("timeout")), timeout)
  )
 ]);
}


async function testProvider(provider){

 const trials = Number(document.getElementById("trialsInput").value) || 3;
 const domain = document.getElementById("domainInput").value || "example.com";

 const times=[];
 let success=0;

 for(let i=0;i<trials;i++){

  const start=performance.now();

  try{

   const res = await fetchWithTimeout(
     `${provider.url}?name=${domain}&type=A`,
     {
       headers:{accept:"application/dns-json"},
       cache:"no-store"
     }
   );

   if(!res.ok){
      throw new Error("DNS query failed");
   }

   const end=performance.now();

   times.push(end-start);
   success++;

  }catch{
   times.push(null);
  }

 }

 const valid = times.filter(Boolean);

 return {

   provider: provider.name,
   avg: valid.length
      ? Math.round(valid.reduce((a,b)=>a+b,0)/valid.length)
      : 999,

   best: valid.length ? Math.min(...valid) : null,
   worst: valid.length ? Math.max(...valid) : null,

   uptime: Math.round((success/trials)*100)

 };
}



/* =========================================================
   RUN BENCHMARK
========================================================= */

async function runBenchmark(){

 const btn=document.getElementById("startTest");
 const status=document.getElementById("testStatus");

 btn.disabled=true;
 btn.textContent="Running...";
 status.textContent="Testing providers...";

 const start=performance.now();

 try{

   const results = await Promise.all(
     providers.map(testProvider)
   );

   results.sort(
     (a,b)=>(a.avg ?? Infinity)-(b.avg ?? Infinity)
   );

   renderGlobalTable(results);

   const total=((performance.now()-start)/1000).toFixed(1);

   status.textContent=`Completed in ${total}s`;

 }catch(e){

 console.error("BENCHMARK ERROR:", e);

 status.textContent="Benchmark error — open console.";
}

 btn.disabled=false;
 btn.textContent="Run Benchmark";

}
