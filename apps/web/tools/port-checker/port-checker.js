async function scanPorts(){

const host=document.getElementById("host").value.trim();
const ports=document.getElementById("ports").value
.split(",")
.map(p=>parseInt(p.trim()))
.filter(Boolean);

if(!host || !ports.length){
alert("Introduza um host e pelo menos uma porta.");
return;
}

const resultDiv=document.getElementById("tool-result");

resultDiv.classList.remove("hidden");
resultDiv.innerHTML="A verificar portas...";

try{

const res=await fetch("https://api.weblabx.com/port-check",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({host,ports})
});

const data=await res.json();

renderResults(data.results);

}catch{

resultDiv.innerHTML="Erro ao verificar portas.";

}

}



function renderResults(results){

const div = document.getElementById("tool-result");

div.classList.remove("hidden");

div.innerHTML = `
<table class="tool-table">

<thead>
<tr>
<th>Porta</th>
<th>Estado</th>
<th>Latência</th>
</tr>
</thead>

<tbody>
${results.map(r => `
<tr>

<td class="port">
${r.port}
</td>

<td>
<span class="status-badge status-${r.status}">
${r.status.toUpperCase()}
</span>
</td>

<td class="latency">
${r.latency}ms
</td>

</tr>
`).join("")}
</tbody>

</table>
`;

}
