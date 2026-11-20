/* Sigurnost val 2 (20.11.2026.): podaci iz koykan-boards (isti izvor kao KCEP board), osobni ključ u zaglavlju Authorization.
   Stari Apps Script izvor više ne postoji; KCEP od 20.11.2026. radi samo s osobnim ključem (A2). */
var ENDPOINT="https://koykan-boards.koykan.workers.dev/kcep";
var KEY=(function(){try{return localStorage.getItem("koykan_key")||"";}catch(e){return "";}})();
var TASKS=[],P=[],LVL={},BY={},MAXL=0;
var S={mode:"koraci",stream:"all",crit:false,start:"2026-08-24",wpl:1};

function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function el(h){var d=document.createElement("div");d.innerHTML=h;return d.firstElementChild;}
function api(p){return fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+KEY},body:JSON.stringify(p)}).then(function(r){return r.json();});}

function codeOf(t){var m=(t.naziv||"").match(/^(HR|DE|KD|K)-\d+(?:[.\-]\d+)?/);return m?m[0]:null;}
function streamOf(c){return c?c.split("-")[0]:null;}
function depsOf(t){var m=(t.opis||"").match(/Ovisi o:\s*([^\n]+)/);if(!m)return[];
 return m[1].split(/[,;]/).map(function(s){var x=s.trim().match(/^(HR|DE|KD|K)-\d+(?:[.\-]\d+)?/);return x?x[0]:null;}).filter(Boolean);}
function isprava(t){var m=(t.opis||"").match(/Isprava:\s*([^\n]+)/);return m?m[1].trim():"";}

function build(){
 P=TASKS.filter(function(t){return !t.parent;});
 BY={};P.forEach(function(t){var c=codeOf(t);if(c)BY[c]=t;});
 LVL={};
 function L(c,seen){
  if(LVL[c]!==undefined)return LVL[c];
  if(seen[c])return 0; seen[c]=1;
  var t=BY[c];if(!t)return 0;
  var d=depsOf(t).map(function(x){return BY[x]?L(x,Object.assign({},seen))+1:0;});
  var v=d.length?Math.max.apply(null,d):0; LVL[c]=v; return v;
 }
 Object.keys(BY).forEach(function(c){L(c,{});});
 MAXL=Math.max.apply(null,Object.values(LVL).concat([0]));
}
function subs(id){return TASKS.filter(function(t){return t.parent===id;});}
function prog(t){var s=subs(t.id);var arr=s.length?s:[t];
 var d=arr.filter(function(x){return x.status==="Gotovo";}).length;return {d:d,n:arr.length};}
function fixedDate(t){return (t.sdue&&t.sdue.length>=10)?t.sdue:((t.due&&t.due.length>=10)?t.due:"");}
function weekOf(c){return LVL[c]*S.wpl;}
function iso(d){var m=d.getMonth()+1,x=d.getDate();return d.getFullYear()+"-"+(m<10?"0":"")+m+"-"+(x<10?"0":"")+x;}
function weekStart(w){var d=new Date(S.start+"T00:00:00");d.setDate(d.getDate()+w*7);return iso(d);}
function dateOf(c){return weekStart(weekOf(c));}
function fmt(d){if(!d)return"";var p=d.split("-");return p[2]+"."+p[1]+"."+p[0].slice(2);}

function visible(){
 return P.filter(function(t){
  var c=codeOf(t); if(!c) return false;
  if(S.crit && !t.critical) return false;
  var s=streamOf(c);
  if(S.stream==="hr" && !(s==="HR"||s==="K")) return false;
  if(S.stream==="de" && !(s==="DE"||s==="KD")) return false;
  return true;
 });
}

function renderKoraci(){
 var vis=visible(), out="";
 out+='<div class="lane-hd"><div>Faza</div><div class="hHR">Hrvatska &nbsp;·&nbsp; HR i K</div><div class="hDE">Njemačka &nbsp;·&nbsp; DE i KD</div></div>';
 for(var l=0;l<=MAXL;l++){
  var here=vis.filter(function(t){return LVL[codeOf(t)]===l;});
  if(!here.length) continue;
  var hr=here.filter(function(t){var s=streamOf(codeOf(t));return s==="HR"||s==="K";});
  var de=here.filter(function(t){var s=streamOf(codeOf(t));return s==="DE"||s==="KD";});
  out+='<div class="stage"><div class="snum"><b>'+l+'</b><span>tj '+(l*S.wpl+1)+'<br>'+fmt(weekStart(l*S.wpl))+'</span></div>';
  out+='<div class="cell">'+(hr.length?hr.map(card).join(""):'<div class="empty">ništa u ovoj fazi</div>')+'</div>';
  out+='<div class="cell">'+(de.length?de.map(card).join(""):'<div class="empty">ništa u ovoj fazi</div>')+'</div>';
  out+='</div>';
 }
 return out||'<div class="empty">Nema koraka za odabrane filtre.</div>';
}
function card(t){
 var c=codeOf(t),s=streamOf(c),pr=prog(t),fx=fixedDate(t);
 var ttl=(t.naziv||"").replace(/^(HR|DE|KD|K)-\d+\s*/,"");
 return '<div class="card '+s+(t.critical?' crit':'')+(pr.d===pr.n?' done':'')+'" data-pop="'+esc(t.id)+'">'+
  '<span class="code">'+c+'</span>'+(t.critical?'<span class="flag">KRIT</span>':'')+
  (fx?'<span class="flag fix">ROK '+fmt(fx)+'</span>':'')+
  '<div class="ttl">'+esc(ttl.slice(0,110))+(ttl.length>110?'…':'')+'</div>'+
  '<div class="meta">'+pr.d+'/'+pr.n+' koraka · '+esc(t.owner||"-")+'</div></div>';
}

function renderGantt(){
 var vis=visible().slice().sort(function(a,b){
  var la=LVL[codeOf(a)],lb=LVL[codeOf(b)];
  if(la!==lb)return la-lb;
  return codeOf(a).localeCompare(codeOf(b),"hr",{numeric:true});
 });
 var cols=(MAXL+1)*S.wpl+1;
 var h='<table class="g"><thead><tr><th class="lab">Zahvat</th>';
 for(var w=0;w<cols;w++){
  h+='<th>tj '+(w+1)+'<br>'+fmt(weekStart(w))+'</th>';
 }
 h+='</tr></thead><tbody>';
 var lastL=-1;
 vis.forEach(function(t){
  var c=codeOf(t),s=streamOf(c),L=LVL[c],pr=prog(t);
  if(L!==lastL){h+='<tr><td class="lab gsec">FAZA '+L+'</td><td class="gsec" colspan="'+cols+'"></td></tr>';lastL=L;}
  var ttl=(t.naziv||"").replace(/^(HR|DE|KD|K)-\d+\s*/,"");
  h+='<tr><td class="lab" data-pop="'+esc(t.id)+'" style="cursor:pointer"><span class="code">'+c+'</span> '+esc(ttl.slice(0,72))+'</td>';
  var st=L*S.wpl;
  for(var w=0;w<cols;w++){
   h+='<td class="slot">'+((w>=st&&w<st+S.wpl)?'<span class="gb '+s+(t.critical?' crit':'')+'" title="'+c+'"></span>':'')+'</td>';
  }
  h+='</tr>';
 });
 return h+'</tbody></table>';
}

function openPop(id){
 var t=TASKS.find(function(x){return x.id===id;});if(!t)return;
 var c=codeOf(t),d=depsOf(t),pr=prog(t);
 var blocks=P.filter(function(x){return depsOf(x).indexOf(c)>=0;}).map(codeOf).filter(Boolean);
 var sb=subs(t.id);
 var h='<h3>'+esc(t.naziv)+'</h3><div class="meta">'+esc(t.section)+'</div><dl>';
 h+='<dt>Faza</dt><dd>'+LVL[c]+' &nbsp;·&nbsp; tjedan '+(weekOf(c)+1)+' &nbsp;·&nbsp; izvedeni datum '+fmt(dateOf(c))+'</dd>';
 if(fixedDate(t))h+='<dt>Upisani rok</dt><dd>'+fmt(fixedDate(t))+'</dd>';
 h+='<dt>Nositelj</dt><dd>'+esc(t.owner||"-")+'</dd>';
 h+='<dt>Status</dt><dd>'+esc(t.status||"-")+' &nbsp;·&nbsp; '+pr.d+' od '+pr.n+' koraka</dd>';
 if(t.critical)h+='<dt>Oznaka</dt><dd style="color:var(--bad)">kritični put</dd>';
 if(isprava(t))h+='<dt>Isprava</dt><dd>'+esc(isprava(t))+'</dd>';
 h+='<dt>Ovisi o</dt><dd>'+(d.length?d.map(function(x){return '<a href="#" data-jump="'+esc(x)+'">'+x+'</a>';}).join(", "):"ničemu, može odmah")+'</dd>';
 h+='<dt>Blokira</dt><dd>'+(blocks.length?blocks.map(function(x){return '<a href="#" data-jump="'+esc(x)+'">'+x+'</a>';}).join(", "):"ništa")+'</dd>';
 if(sb.length)h+='<dt>Koraci</dt><dd><ul>'+sb.map(function(x){return '<li>'+(x.status==="Gotovo"?"✓ ":"")+esc(x.naziv)+'</li>';}).join("")+'</ul></dd>';
 h+='</dl>';
 document.getElementById("popc").innerHTML=h;
 document.getElementById("pop").classList.add("on");
}
function jump(c){var t=BY[c];if(t)openPop(t.id);return false;}
function closePop(){document.getElementById("pop").classList.remove("on");}
document.addEventListener("keydown",function(e){if(e.key==="Escape")closePop();});
document.getElementById("pop").addEventListener("click",function(e){if(e.target===this||e.target.closest(".x"))closePop();var j=e.target.closest("[data-jump]");if(j){e.preventDefault();jump(j.getAttribute("data-jump"));}});
/* CSP (B3): bez inline handlera; jedan slušač za cijelu stranicu */
document.getElementById("wrap").addEventListener("click",function(e){
 var p=e.target.closest("[data-pop]");if(p){openPop(p.getAttribute("data-pop"));return;}
 var c=e.target.closest("[data-k]");if(c){var v=c.getAttribute("data-v");setS(c.getAttribute("data-k"),v==="true"?true:v==="false"?false:v);return;}
 if(e.target.closest("[data-act=reload]"))load();
});
document.getElementById("wrap").addEventListener("change",function(e){var k=e.target.getAttribute("data-in");if(!k)return;
 setS(k,k==="wpl"?Math.max(1,+e.target.value||1):e.target.value);});

function render(){
 var vis=visible();
 var crit=vis.filter(function(t){return t.critical;}).length;
 var steps=TASKS.filter(function(t){return t.parent;}).length+P.length;
 var done=TASKS.filter(function(t){return t.status==="Gotovo";}).length;
 var h='<div class="brand">Koykan · Company restructure</div>';
 h+='<h1>KCEP vremenski pogled</h1>';
 h+='<div class="sub">Kombinirani hod kroz Hrvatsku i Njemačku, poredan po ovisnostima. <b>'+vis.length+'</b> zahvata u <b>'+(MAXL+1)+'</b> faza, od toga <b>'+crit+'</b> na kritičnom putu. Ukupno '+steps+' koraka, '+done+' gotovo.</div>';
 h+='<div class="bar">';
 h+='<span class="lbl">Pogled</span>';
 h+=chip("mode","koraci","Koraci")+chip("mode","gantt","Gantt");
 h+='<span class="sep"></span><span class="lbl">Tok</span>';
 h+=chip("stream","all","Oboje")+chip("stream","hr","Samo HR")+chip("stream","de","Samo DE");
 h+='<span class="sep"></span>';
 h+='<span class="chip'+(S.crit?" on":"")+'" data-k="crit" data-v="'+(!S.crit)+'">Samo kritični put</span>';
 h+='<span class="sep"></span><span class="lbl">Start</span>';
 h+='<input type="date" data-in="start" value="'+S.start+'">';
 h+='<span class="lbl" style="margin-left:6px">Tjedana po fazi</span>';
 h+='<input type="number" data-in="wpl" min="1" max="8" style="width:56px" value="'+S.wpl+'">';
 h+='<span class="sep"></span><span class="chip" data-act="reload">Osvježi</span>';
 h+='</div>';
 h+=(S.mode==="koraci"?renderKoraci():'<div id="gantt">'+renderGantt()+'</div>');
 h+='<div class="note">Faza je izvedena iz polja <b>Ovisi o</b>, ne iz kalendara. Faza 0 su zahvati koji ne čekaju nikoga i mogu odmah. Zahvat je u fazi N ako mu je najdublji prethodnik u fazi N-1, pa je broj faza stvarna dužina kritičnog puta. Datumi su izvedeni iz starta i broja tjedana po fazi i služe za planiranje, a zelena oznaka ROK je datum stvarno upisan na dashboardu. Podaci se čitaju živo s istog izvora kao glavni dashboard.</div>';
 document.getElementById("wrap").innerHTML=h;
}
function chip(k,v,lab){return '<span class="chip'+(S[k]===v?" on":"")+'" data-k="'+k+'" data-v="'+v+'">'+lab+'</span>';}
function setS(k,v){S[k]=v;render();}
function reload(){load();}

function showSetup(msg){
 document.getElementById("wrap").innerHTML='<div class="setup"><div class="brand">Koykan</div>'+
 '<h1>KCEP vremenski pogled</h1><div class="sub">KCEP radi samo s osobnim ključem. Otvori svoj osobni KCEP link (od Domagoja), pa se vrati ovdje.</div>'+
 '<a class="chip" href="./">Otvori KCEP board</a>'+(msg?'<div class="err">'+esc(msg)+'</div>':'')+'</div>';
}

function load(){
 if(!KEY){showSetup("");return;}
 api({action:"list"}).then(function(r){
  if(!r||!r.ok||!r.tasks){showSetup(r&&r.error==="auth"?"Osobni ključ nije prihvaćen.":"Izvor ne odgovara.");return;}
  TASKS=r.tasks;build();render();
 }).catch(function(e){
  document.getElementById("wrap").innerHTML='<div class="setup"><h1>Ne mogu dohvatiti podatke</h1><div class="err">'+esc(e.message)+'</div><button data-act="reload">Pokušaj ponovno</button></div>';
 });
}
load();
