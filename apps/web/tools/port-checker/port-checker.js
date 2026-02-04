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

const resultDiv=document.getElementById("port-result");

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

const div=document.getElementById("port-result");

let html=`
<table class="port-table">
<tr>
<th>Porta</th>
<th>Estado</th>
<th>Latência</th>
</tr>
`;

results.forEach(r=>{

html+=`
<tr>
<td>${r.port}</td>
<td class="status-${r.status}">
${r.status.toUpperCase()}
</td>
<td>${r.latency}ms</td>
</tr>
`;

});

html+=`</table>`;

div.innerHTML=html;

}
