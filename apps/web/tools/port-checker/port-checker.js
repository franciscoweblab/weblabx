async function scanPorts(){

const host=document.getElementById("host").value.trim();
const ports=document.getElementById("ports").value
.split(",")
.map(p=>parseInt(p.trim()))
.filter(Boolean);

if(!host || !ports.length){
alert("Enter a host and at least one port.");
return;
}

const resultDiv=document.getElementById("tool-result");

resultDiv.classList.remove("hidden");
resultDiv.innerHTML="Verifying Ports...";

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

resultDiv.innerHTML="Error Verifying Ports.";

}

}



function renderResults(results){

const div = document.getElementById("tool-result");

div.classList.remove("hidden");

div.innerHTML = `
<table class="tool-table">

<thead>
<tr>
<th>Port</th>
<th>Status</th>
<th>Latency</th>
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
