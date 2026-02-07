const FIELD_ORDER = [
    "ip",
    "hostname",
    "org",
    "asn",
    "asn_name",
    "city",
    "region",
    "country",
    "location",
    "timezone"
];


// ================= LOOKUP =================

async function lookupIP() {

    const input = document.getElementById("ipInput");
    const ip = input.value.trim();

    if (!ip) return;

    const resultCard = document.getElementById("resultCard");
    const resultBody = document.getElementById("resultBody");

    resultBody.innerHTML = `
        <tr>
            <td style="padding:12px 0; color:var(--text-secondary);">
                Running lookup...
            </td>
        </tr>
    `;

    resultCard.style.display = "block";

    try {

        // ⚠️ LOCALHOST NÃO TEM WORKER
        // Usa domínio real para testes locais
        const res = await fetch(
            `https://weblabx.com/api/ip-lookup?ip=${encodeURIComponent(ip)}`
        );

        if (!res.ok) {
            throw new Error("Lookup failed");
        }

        const data = await res.json();

        if (data.error) {
            renderError(data.error);
            return;
        }

        renderTable(data);

        // URL shareable
        history.replaceState(null, "", `?ip=${ip}`);

    } catch {

        renderError("Unable to complete lookup");

    }
}


// ================= TABLE =================

function renderTable(data){

    const body = document.getElementById("resultBody");

    const rows = FIELD_ORDER
        .filter(key => data[key])
        .map(key => `
            <tr>
                <td style="
                    padding:10px 0;
                    color:var(--text-secondary);
                    width:40%;
                ">
                    ${formatKey(key)}
                </td>

                <td style="
                    padding:10px 0;
                    font-weight:600;
                    word-break:break-word;
                ">
                    ${escapeHTML(data[key])}
                </td>
            </tr>
        `)
        .join("");

    body.innerHTML = rows;
}


// ================= ERROR =================

function renderError(message){

    const body = document.getElementById("resultBody");

    body.innerHTML = `
        <tr>
            <td style="
                padding:12px 0;
                color:#ef4444;
                font-weight:600;
            ">
                ${message}
            </td>
        </tr>
    `;
}


// ================= HELPERS =================

function formatKey(key){
    return key
        .replace("_"," ")
        .replace(/\b\w/g, c => c.toUpperCase());
}


function escapeHTML(str){
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}


// ================= AUTOLOAD =================

function loadFromQuery(){

    const params = new URLSearchParams(window.location.search);
    const ip = params.get("ip");

    if(!ip) return;

    document.getElementById("ipInput").value = ip;
    lookupIP();
}


// ================= AUTO-FILL =================

async function autofillIP(){

    const input = document.getElementById("ipInput");

    if(input.value) return;

    try{

        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();

        input.value = data.ip;

    }catch{
        // silêncio
    }
}


// ================= WIRING (PROFISSIONAL) =================

document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("lookupBtn");
    const input = document.getElementById("ipInput");

    btn.addEventListener("click", lookupIP);

    input.addEventListener("keydown", (e)=>{
        if(e.key === "Enter"){
            lookupIP();
        }
    });

    autofillIP();
    loadFromQuery();

});
