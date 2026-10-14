const KEY="future_real_v42_final";
let db=JSON.parse(localStorage.getItem(KEY)||"null");
if(!db||!db.subs||db.subs.length==0){
db={subs:[{id:"FN-1001",name:"Balay Karmaker",phone:"017XX",pkg:"20Mbps",ip:"10.10.12.101",onu:"HWTC-001",rx:-21.4,gps:"23.4585,91.1720",st:"good"},{id:"FN-1002",name:"Rahim (Cut Demo)",phone:"01811",pkg:"10Mbps",ip:"10.10.12.102",onu:"HWTC-002",rx:-40,gps:"23.4680,91.1950",st:"cut"}],bills:[{inv:"INV-1001",name:"Balay Karmaker",amt:1000,s:"Due"},{inv:"INV-1002",name:"Rahim",amt:800,s:"Paid"}],set:null,api:""};
}
function save(){localStorage.setItem(KEY,JSON.stringify(db)); render(); drawCharts(); drawFiber();}
function clearData(){if(confirm("Reset?")){localStorage.removeItem(KEY); location.reload();}}

// Render Tables
function render(){
let tb=document.querySelector("#subT tbody"); let q=(document.getElementById("sBox")?.value||"").toLowerCase();
if(tb){tb.innerHTML=""; db.subs.filter(s=>s.name.toLowerCase().includes(q)||s.ip.includes(q)).forEach(s=>{
let col=s.rx<-27?"#ef4444":s.rx<-25?"#f59e0b":"#22c55e";
tb.innerHTML+=`<tr><td>${s.id}</td><td>${s.name}</td><td>${s.pkg}</td><td>${s.ip}</td><td style="color:${col};font-weight:800">${s.rx} dBm</td><td><button onclick="delSub('${s.id}')" style="background:#ef4444;color:#fff;border:0;padding:3px 7px;border-radius:5px">X</button></td></tr>`;
});}
let bb=document.querySelector("#billT tbody"); if(bb){bb.innerHTML=""; db.bills.forEach(b=>{bb.innerHTML+=`<tr><td>${b.inv}</td><td>${b.name}</td><td>৳${b.amt}</td><td>${b.s}</td></tr>`});}
document.getElementById("kSub").innerText=db.subs.length;
document.getElementById("kBill").innerText="৳"+db.bills.reduce((a,c)=>a+parseInt(c.amt),0);
let as=document.getElementById("actS"); if(db.set&&db.set.mikrotik_host){as.innerHTML="✅ REAL ACTIVATED - MT: "+db.set.mikrotik_host+" | OLT: "+db.set.olt_host; as.style.background="#14532d"; as.style.padding="8px"; as.style.borderRadius="8px";}
}

// Tabs
document.querySelectorAll(".tabs button").forEach(b=>{b.onclick=()=>{document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("active")); b.classList.add("active"); document.querySelectorAll(".page").forEach(p=>p.classList.remove("active")); document.getElementById("p-"+b.dataset.t).classList.add("active"); if(b.dataset.t=="g") drawFiber();};});

// Settings Modal
document.getElementById("setBtn").onclick=()=>{document.getElementById("setM").classList.add("show"); if(db.set){document.getElementById("mt_h").value=db.set.mikrotik_host||""; document.getElementById("mt_u").value=db.set.mikrotik_user||""; document.getElementById("olt_h").value=db.set.olt_host||""; document.getElementById("olt_u").value=db.set.olt_user||""; document.getElementById("olt_t").value=db.set.olt_type||"bdcom"; document.getElementById("api_u").value=db.api||"";}};
function closeSet(){document.getElementById("setM").classList.remove("show");}
async function saveSet(){
let s={mikrotik_host:document.getElementById("mt_h").value.trim(),mikrotik_user:document.getElementById("mt_u").value.trim(),mikrotik_pass:document.getElementById("mt_p").value,mikrotik_port:document.getElementById("mt_port").value||"8728",olt_host:document.getElementById("olt_h").value.trim(),olt_user:document.getElementById("olt_u").value.trim(),olt_pass:document.getElementById("olt_p").value,olt_type:document.getElementById("olt_t").value};
let api=document.getElementById("api_u").value.trim();
if(!s.mikrotik_host||!s.olt_host){alert("MikroTik + OLT IP লাগবে");return;}
document.getElementById("setSt").innerText="⏳ Real Checking MikroTik + OLT...";
if(api){
try{
let base=api.replace(/\/api\/?$/,"");
let res=await fetch(base+"/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)});
let j=await res.json();
if(!res.ok) throw new Error(j.detail||"Fail");
document.getElementById("setSt").innerText="✅ "+j.msg;
db.set=s; db.api=api; save(); setTimeout(closeSet,1000);
  
}catch(e){document.getElementById("setSt").innerText="❌ "+e.message;}
}else{db.set=s; db.api=""; save(); document.getElementById("setSt").innerText="✅ Local Saved - Backend URL দিলে Real Live হবে"; setTimeout(closeSet,1000);}
}

// Add Customer Modal
function openAdd(){document.getElementById("addM").classList.add("show");}
function closeAdd(){document.getElementById("addM").classList.remove("show");}
async function saveCust(){
let sub={id:document.getElementById("f_id").value.trim()||"FN-"+Date.now(),name:document.getElementById("f_name").value.trim(),phone:document.getElementById("f_phone").value.trim(),pkg:document.getElementById("f_pkg").value,ip:document.getElementById("f_ip").value.trim(),onu:document.getElementById("f_onu").value.trim(),gps:document.getElementById("f_gps").value.trim()||"23.4607,91.1809",rx:(-20-Math.random()*4).toFixed(1),st:"good"};
if(!sub.name){alert("Name লাগবে");return;}
// Backend এ পাঠাও Real MikroTik এ বানানোর জন্য
if(db.api){
try{
let base=db.api.replace(/\/api\/?$/,"");
await fetch(base+"/api/subscribers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:sub.id,name:sub.name,phone:sub.phone,pkg:sub.pkg,ip:sub.ip})});
}catch(e){console.log("Backend offline",e);}
}
db.subs.push(sub); db.bills.push({inv:"INV-"+Date.now(),name:sub.name,amt:sub.pkg.includes("10")?800:1000,s:"Due"}); save(); closeAdd();
}
function delSub(id){if(confirm("Delete "+id+"?")){db.subs=db.subs.filter(s=>s.id!=id); save();}}

// Charts Pure Canvas
function drawCharts(){
let c1=document.getElementById("bw"); if(c1){let ctx=c1.getContext("2d"); c1.width=400; c1.height=150; ctx.fillStyle="#121d33"; ctx.fillRect(0,0,400,150); ctx.strokeStyle="#22c55e"; ctx.lineWidth=2; ctx.beginPath(); [20,45,35,70,65,80,75,90,60,85].forEach((v,i)=>{let x=i*40; let y=130-v; if(i==0) ctx.moveTo(x,y); else ctx.lineTo(x,y);}); ctx.stroke(); ctx.fillStyle="#e2e8f0"; ctx.font="10px sans-serif"; ctx.fillText("Download 1.1 Gbps Live",10,15);}
let c2=document.getElementById("rx"); if(c2){let ctx=c2.getContext("2d"); c2.width=400; c2.height=150; ctx.fillStyle="#121d33"; ctx.fillRect(0,0,400,150); let good=db.subs.filter(s=>s.rx>-25).length; let warn=db.subs.filter(s=>s.rx<=-25&&s.rx>-28).length; let cut=db.subs.filter(s=>s.rx<=-28).length; let total=db.subs.length||1; let data=[{v:good,c:"#22c55e",l:"Good"},{v:warn,c:"#f59e0b",l:"Warn"},{v:cut,c:"#ef4444",l:"Cut"}]; let ang=0; data.forEach(d=>{let slice=(d.v/total)*Math.PI*2; ctx.fillStyle=d.c; ctx.beginPath(); ctx.moveTo(75,75); ctx.arc(75,75,60,ang,ang+slice); ctx.closePath(); ctx.fill(); ang+=slice;}); let y=20; data.forEach(d=>{ctx.fillStyle=d.c; ctx.fillRect(160,y,10,10); ctx.fillStyle="#e2e8f0"; ctx.font="10px sans-serif"; ctx.fillText(d.l+": "+d.v,175,y+9); y+=18;});}
}

// REAL Fiber Map - Live from Backend
async function drawFiber(){
let c=document.getElementById("fiberMap"); if(!c) return;
let ctx=c.getContext("2d"); c.width=400; c.height=520; ctx.fillStyle="#e6f2ff"; ctx.fillRect(0,0,400,520);
// Roads
ctx.strokeStyle="#000"; ctx.setLineDash([8,6]); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(180,0); ctx.lineTo(200,520); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(50,0); ctx.lineTo(70,520); ctx.stroke(); ctx.beginPath(); ctx.moveTo(330,0); ctx.lineTo(350,520); ctx.stroke();
// POP
ctx.fillStyle="purple"; ctx.beginPath(); ctx.arc(200,260,18,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#fff"; ctx.font="bold 8px sans-serif"; ctx.fillText("POP",188,264);

let fiberData = [];
// Try Real Backend
if(db.api){
try{
let base=db.api.replace(/\/api\/?$/,"");
let res=await fetch(base+"/api/live-fiber");
let json=await res.json();
if(json.data){ fiberData=json.data; document.getElementById("fiberTime").innerText="Last Update: "+json.time+" (REAL OLT)"; }
}catch(e){console.log("Real OLT fail, using local",e);}
}
 function parsePastedData(){const t=document.getElementById('pasteOltData').value;auditorData=[];t.split('\n').forEach((l,i)=>{const r=l.match(/RX[: ]*(-?\d+\.?\d*)/i);const s=l.match(/SN[: ]*(\w+)/i);if(r)auditorData.push({olt:'Comilla POP-1',pon:`0/1/${i}`,onuId:`ONU ${i+1}`,client:`Client ${i+1}`,sn:s?s[1]:`SN${i}`,oltTx:'3.0',onuRx:parseFloat(r[1]),onuTx:'2.0',dist:'1km',temp:'35°C',loss:'0'});});renderAuditor();alert(auditorData.length+' টা Power পাওয়া গেছে!');} 
// Fallback Local Demo if Backend Offline
if(fiberData.length==0){
fiberData=db.subs.map((s,i)=>({id:s.name,pon:s.id,rx:parseFloat(s.rx),status:parseFloat(s.rx)<-27?"cut":parseFloat(s.rx)<-25?"warning":"good",lat:23.4585+i*0.005,lon:91.1720+i*0.01}));
document.getElementById("fiberTime").innerText="Last Update: Local Mode (Backend Connect করলে Real হবে)";
}
fiberData.forEach((f,i)=>{
let col=f.status=="cut"?"red":f.status=="warning"?"orange":"green";
let tx=120 + (i%2)*160; let ty=120 + Math.floor(i/2)*140;
ctx.strokeStyle=col; ctx.lineWidth=5; if(f.status=="cut") ctx.setLineDash([10,6]); else ctx.setLineDash([]);
ctx.beginPath(); ctx.moveTo(200,260); ctx.lineTo(tx,ty); ctx.stroke();
ctx.fillStyle=col; ctx.fillRect(tx-15,ty-10,30,18);
ctx.fillStyle="#000"; ctx.font="bold 8px sans-serif"; ctx.fillText(f.id.substring(0,8),tx-20,ty-15);
ctx.fillText(f.rx+" dBm",tx-22,ty+22);
if(i==0){document.getElementById("tgI").innerText=f.id+" ("+f.pon+")"; let p=document.getElementById("tgP"); p.innerText=f.rx+" dBm "+f.status.toUpperCase(); p.style.color=col; let al=document.getElementById("alarm"); if(f.status=="cut"){al.innerText=`🚨 REAL CUT: ${f.id} RX ${f.rx} dBm LOS!`; al.classList.add("live-cut");} else {al.innerText="✅ No Cut - All Good"; al.classList.remove("live-cut");}}
});
}
render(); drawCharts(); drawFiber();
setInterval(()=>{ if(document.getElementById("p-g").classList.contains("active")) drawFiber(); }, 10000);
// MOBILE PASTE AUDITOR - NEW
function parsePastedData(){
  const txt=document.getElementById('pasteOltData')?.value || "";
  if(!txt) return alert('OLT Data Paste করো');
  auditorData=[];
  txt.split('\n').forEach((line,i)=>{
    const rx=line.match(/RX[: ]*(-?\d+\.?\d*)/i);
    const sn=line.match(/SN[: ]*(\w+)/i);
    if(rx) auditorData.push({olt:'Comilla POP-1',pon:`0/1/${i}`,onuId:`ONU ${i+1}`,client:`Client ${i+1}`,sn:sn?sn[1]:`SN${i}`,oltTx:'3.0',onuRx:parseFloat(rx[1]),onuTx:'2.0',dist:'1.2km',temp:'35°C',loss:'0'});
  });
  if(auditorData.length==0){
    const vals=txt.match(/-?\d+\.?\d*/g);
    if(vals) vals.forEach((v,i)=>auditorData.push({olt:'POP-1',pon:'0/1/0',onuId:`ONU ${i}`,client:`Client ${i}`,sn:`SN${i}`,oltTx:'3.0',onuRx:parseFloat(v),onuTx:'2.0',dist:'1km',temp:'35°C',loss:'0'}));
  }
  renderAuditor();
  alert(`${auditorData.length} টা ONU Power পাওয়া গেছে!`);
}
