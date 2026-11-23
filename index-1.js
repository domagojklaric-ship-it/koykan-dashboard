(function(){
  var ENDPOINT='https://koykan-tasks.koykan.workers.dev/';
  var LIST_ID='MTU0MjYyMDg5MDk1MzIxNjI3Njg6MDow';

  // poznati projekti (distinktivni dijelovi naziva) za batch "Označi projekte"
  var PROJECT_HINTS=['emergency repairs','cc stock management','equipment maintenance','model reccuring administracije','ambalaza kina','ambalaža kina','gastro-tim','tkalca - action','tkalča - action','kineska piletina','kcc sourcing','mkga','loyalty program','bubble tea - sales','bubble tea – sales','zabica - sales','žabica – sales','sops','controlling model','shift manager model','exp - pep','exp - zabica','exp - žabica','tkalca - franchise','tkalča - franchise','stock management (hr)','stranci a1','hr arhiva'];

  var memSecret='';
  function getSecret(){ try{return localStorage.getItem('koykan_secret')||'';}catch(e){return memSecret;} }
  function setSecret(v){ memSecret=v; try{localStorage.setItem('koykan_secret',v);}catch(e){} }
  function clearSecret(){ memSecret=''; try{localStorage.removeItem('koykan_secret');}catch(e){} }
  /* osobni Koykan ključ (16.11.2026., standard §2): link ...#k=<ključ>[&to=<ruta>] se sprema u localStorage i briše iz adrese; novi ključ iz linka briše stari kod (SECRET); dok stari kod postoji, koristi se on */
  var memKey='';
  function getKey(){ try{return localStorage.getItem('koykan_key')||'';}catch(e){return memKey;} }
  function setKey(v){ memKey=v; try{localStorage.setItem('koykan_key',v);}catch(e){} }
  function clearKey(){ memKey=''; try{localStorage.removeItem('koykan_key');}catch(e){} }
  /* poveznica na task (17.11.2026.): #/task/<id> ili #k=<ključ>&to=/task/<id> otvara ladicu tog taska nakon učitavanja */
  var kyRoute='';
  (function(){ try{ var h=String(location.hash||''); var r=h.match(/(?:^#|&)to=([^&]+)/); var d=h.match(/^#(\/task\/[A-Za-z0-9_-]+)/); kyRoute=r?decodeURIComponent(r[1]):(d?d[1]:''); var m=h.match(/^#k=([^&]+)/); if(!m) return; var k=decodeURIComponent(m[1]); if(/^\S{16,200}$/.test(k)){ setKey(k); clearSecret(); } history.replaceState(null,'',location.pathname+location.search); }catch(e){} })();
  function kyOpenRoute(){ var m=String(kyRoute||'').match(/^\/task\/([A-Za-z0-9_-]+)$/); kyRoute=''; if(!m) return; var t=TASKS.filter(function(x){return x.id===m[1];})[0]; if(t) openDrawer(t,document.createElement('div')); }

  var MAP={'Dom':'Dom','AnaT':'Ana Trusk','Silva':'Silva','Ankica':'Ankica','Nataša':'Nataša','Natasa':'Nataša','Nino':'Nino','WEINNOV8':'we:innov8 (IT)','Private':'Private'};
  var OWNER_ORDER=['CRITICAL','Dom','Private','Ana Trusk','Ankica','Davor','Lucija','Nataša','Nino','Silva','Stefan','Tamara','we:innov8 (IT)','RECC','Bez oznake'];
  var ADD_PREFIXES=['Dom','Private','AnaT','Ankica','Davor','Lucija','Nataša','Nino','Silva','Stefan','Tamara','WEINNOV8'];
  var OWNER_PREFIXES=['Dom','Private','AnaT','Ankica','Davor','Lucija','Nataša','Nino','Silva','Stefan','Tamara','WEINNOV8'];
  function ownerOpts(cur){ var arr=OWNER_PREFIXES.slice(); if(cur && arr.indexOf(cur)<0) arr.push(cur); var html=arr.map(function(px){ return '<option value="'+px+'"'+(px===cur?' selected':'')+'>'+escapeHtml(MAP[px]||px)+'</option>'; }).join(''); if(!cur) html='<option value="" selected>\u2014 bez oznake \u2014</option>'+html; return html; }
  var PREFIX={'Private':'Private','Dom':'Dom'};
  function ownerOf(title){ var m=title.match(/^\(([^)]+)\)\s*/);
    if(m){ var raw=m[1].trim(); return {prefix:raw, owner:MAP[raw]||raw, clean:title.slice(m[0].length).trim()}; }
    return {prefix:'', owner:'Bez oznake', clean:title}; }
  function stripProj(clean){ var m=clean.match(/^A_\s?/); return {isProject:!!m, title: m? clean.slice(m[0].length):clean}; }
  function makeTitle(prefix,clean,isProject){ var body=(isProject?'A_ ':'')+clean; return prefix? '('+prefix+') '+body : body; }
  function norm(s){ return s.toLowerCase().replace(/[–—]/g,'-').replace(/\s+/g,' ').trim(); }

  function today0(){ var t=new Date(); t.setHours(0,0,0,0); return t; }
  function fmtShort(d){ return d.getDate()+'.'+(d.getMonth()+1)+'.'; }
  function fmtFull(d){ return d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear()+'.'; }
  function fmtRok(d){ return ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'; }
  function dateInputVal(d){ return d? d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2):''; }
  function fromInput(v){ return v? new Date(v+'T00:00:00'):null; }
  function toISODate(d){ return d? new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),0,0,0)).toISOString():''; }
  function whenClass(d,done){ if(!d||done) return ''; var t=today0(); var x=new Date(d); x.setHours(0,0,0,0); if(x<t) return 'over'; if(x.getTime()===t.getTime()) return 'soon'; return ''; }
  function bucket(d){ if(!d) return 'Bez datuma'; var t=today0(); var x=new Date(d); x.setHours(0,0,0,0);
    if(x<t) return 'Prekoračeno'; if(x.getTime()===t.getTime()) return 'Danas';
    var day=(t.getDay()+6)%7; var sun=new Date(t); sun.setDate(t.getDate()+(6-day)); sun.setHours(0,0,0,0);
    if(x<=sun) return 'Ovaj tjedan';
    var nsun=new Date(sun); nsun.setDate(sun.getDate()+7);
    if(x<=nsun) return 'Sljedeći tjedan';
    return 'Kasnije'; }
  var BUCKET_ORDER=['Prekoračeno','Danas','Ovaj tjedan','Sljedeći tjedan','Kasnije','Bez datuma','Bez next stepa'];

  function parseNext(notes){
    if(!notes) return {date:null,text:'',rest:'',critical:false,link:''};
    var lines=notes.split('\n'); var critical=false; var link='';
    lines=lines.filter(function(l){ if(/^\s*CRITICAL\s*$/i.test(l)){ critical=true; return false; } if(/^\s*LINK\s*:/i.test(l)){ link=l.replace(/^\s*LINK\s*:\s*/i,'').trim(); return false; } return true; });
    var idx=-1;
    for(var i=0;i<lines.length;i++){ if(/next\s*step/i.test(lines[i])){ idx=i; break; } }
    if(idx<0) return {date:null,text:'',rest:lines.join('\n').replace(/^\n+/,''),critical:critical,link:link};
    var line=lines[idx]; var dm=line.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    var date=dm? new Date(parseInt(dm[3],10),parseInt(dm[2],10)-1,parseInt(dm[1],10)):null;
    var text=line.replace(/next\s*step\s*:?/i,'').replace(/(\d{1,2})\.(\d{1,2})\.(\d{4})\.?/,'').replace(/^\s*[-–—|:]+\s*/,'').replace(/\s*[-–—|:]+\s*$/,'').trim();
    var rest=lines.filter(function(_,i){return i!==idx;}).join('\n').replace(/^\n+/,'');
    return {date:date,text:text,rest:rest,critical:critical,link:link};
  }
  /* FOKUS (D.K. 14.11.2026): red "FOKUS" ili "FOKUS: <ime>" u notes projekta (A_) = fokus projekt te osobe, jedan po osobi; ostaje u rest, pa ga buildNotes ne gubi */
  function fokusOf(rest,owner){ var m=String(rest||'').match(/^[ \t]*FOKUS[ \t]*(?::[ \t]*(.+?))?[ \t]*$/im); return m? (m[1]||owner||'') : ''; }
  function setFokusLine(rest,on){ var L=String(rest||'').split('\n').filter(function(l){ return !/^[ \t]*FOKUS[ \t]*(:.*)?$/i.test(l); }); if(on) L.unshift('FOKUS'); return L.join('\n').replace(/^\n+/,''); }
  /* c5 (Dom 23.11.2026., standard 18): status je polje step_status s popisa, nikad tekst. Riječ na početku teksta next stepa se ne šalje. */
  function stripSlot(s){ return String(s||'').replace(/^\s*(ACTION|PENDING|ON HOLD|DONE)(?:\s*[-\u2013\u2014|:]+\s*|\s*$)/i,''); }
  var WFROM={'ACTION':'action','PENDING':'pending','ON HOLD':'hold','DONE':'done'};
  /* povijest (redovi "- D.M. ...") se samo dopisuje: u uređivanju opisa se ne prikazuje u polju i uvijek se vraća cijela */
  var HIST_RE=/^- \d{1,2}\.\d{1,2}\.(?:\d{4}\.)?\s/;
  function histOf(rest){ return String(rest||'').split('\n').filter(function(l){ return HIST_RE.test(l); }); }
  function bodyOf(rest){ return String(rest||'').split('\n').filter(function(l){ return !HIST_RE.test(l); }).join('\n').replace(/\s+$/,''); }
  function keepHist(oldRest,text){ var oh=histOf(oldRest), nb=[], nh=[]; String(text||'').split('\n').forEach(function(l){ (HIST_RE.test(l)?nh:nb).push(l); }); var hs=oh.concat(nh.filter(function(l){ return oh.indexOf(l)<0; })); var b=nb.join('\n').replace(/\s+$/,''); return b+(b&&hs.length?'\n':'')+hs.join('\n'); }
  function histBox(rest){ var h=histOf(rest); var d=document.createElement('div'); d.className='hist-ro'; if(!h.length){ d.style.display='none'; return d; } var t=document.createElement('div'); t.className='hist-t'; t.textContent='Povijest (samo dopisivanje)'; d.appendChild(t); h.forEach(function(l){ var x=document.createElement('div'); x.textContent=l; d.appendChild(x); }); return d; }
  function buildNotes(text,date,rest,critical,link){ var out=[]; if(critical) out.push('CRITICAL'); text=stripSlot(text); var has=(text||date); if(has) out.push('NEXT STEP: '+(text||'')+(date?' - '+fmtFull(date):'')); if(link) out.push('LINK: '+link); if(rest) out.push(rest); return out.join('\n'); }

  /* parametri i kod idu u tijelu POST zahtjeva, ne u adresi (4.11.2026.); text/plain da preglednik ne radi CORS preflight */
  function fetchRetry_(url, tries, wait, body){
    wait = wait || 1000;
    return fetch(url,{method:'POST', headers:{'Content-Type':'text/plain;charset=UTF-8'}, body:body}).then(function(r){ return r.text(); }).then(function(txt){
      var s=String(txt).trim();
      if(s.charAt(0)==='{' || s.charAt(0)==='[') return JSON.parse(s);
      throw new Error('Server trenutno ne odgovara');
    }).catch(function(e){
      if(tries>1) return new Promise(function(res){ setTimeout(res,wait); }).then(function(){ return fetchRetry_(url, tries-1, Math.min(wait*2,8000), body); });
      throw e;
    });
  }
  function api(params){ var _s=getSecret(); if(_s) params.secret=_s; else if(getKey()) params.key=getKey(); params.listId=LIST_ID;
    var _tries = params.action==='add' ? 1 : 5;
    return fetchRetry_(ENDPOINT, _tries, 1000, JSON.stringify(params)); }

  /* read-only pristup za Domove snapshot skripte (14.10.2026.) */
  window.kySnapshot=function(){ return { tasks:TASKS, mirror:(typeof MX!=='undefined'&&MX&&MX.items)?MX.items:[], mirrorTs:(typeof MX!=='undefined'&&MX)?MX.ts:0 }; };
  var TASKS=[], RAW=[], ownerOn={}, groupMode='due', loadCompleted=false, typeFilter='all', winFilter='all', waitFilter='all', searchQ='', selectMode=false, selected={}, critOnly=false, ovrOnly=false, staleOnly=false, timMode=false, tagOwner=false;
  var el=function(id){return document.getElementById(id);};
  function banner(m){ var b=el('banner'); if(!m){b.style.display='none';return;} b.textContent=m; b.style.display='block'; }
  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function load(){
    banner(''); var _had = (TASKS && TASKS.length > 0);
    if(!_had){ el('loading').style.display='block'; el('grid').innerHTML=''; }
    var params={action:'tasks'}; if(loadCompleted) params.all='true';
    api(params).then(function(res){
      el('loading').style.display='none';
      if(!res||res.error){ banner('Greška: '+((res&&res.error)||'nema odgovora')); if(res&&(res.error==='unauthorized'||res.error==='no_access'||res.error==='no_owner')){ /* koykan_key dijele i projektni boardovi na istoj adresi: ne brišem ga kad je valjan, a samo nema pristup */ if(res.error==='unauthorized'){ if(getSecret()) clearSecret(); else clearKey(); } showSetup(); if(res.error!=='unauthorized') banner('Ovaj ključ nema pristup dashboardu. Javi se Domu.'); } return; }
      RAW=res.tasks||[]; document.body.classList.toggle('scoped', (res.scope||'full')!=='full');
      try{ localStorage.setItem('ky_full', (res.scope||'full')==='full'?'1':'0'); }catch(e){}
      TASKS=(res.tasks||[]).map(function(t){ var o=ownerOf(t.title); var pj=stripProj(o.clean); var n=parseNext(t.notes||'');
        var wait = (t.step_status!==undefined) ? (WFROM[t.step_status]||'') : waitOf(n.text||'');   /* c5: polje; stari Worker: riječ */
        n.text = stripSlot(n.text);
        return { id:t.id, prefix:o.prefix, owner:o.owner, title:pj.title, isProject:pj.isProject, status:t.status, done:t.status==='completed', wait:wait,
                 due:t.due?new Date(t.due):null, notes:t.notes||'', nextDate:n.date, nextText:n.text, rest:n.rest, critical:n.critical, fokus:fokusOf(n.rest,o.owner), link:n.link, locked:!!t.locked, created:t.created||null, src:t.src||'', dlv:'', req:!!t.req, proof:t.proof||'' }; });
      autoFlip(); buildOwnerFilters(); render(); kyDefaults(); kyOpenRoute();
      el('bar').style.display='flex'; el('prog').style.display='flex';
      el('synced').textContent='sync '+new Date().toLocaleTimeString();
        }).catch(function(err){ el('loading').style.display='none'; banner(_had ? 'Sync nije prosao \u2014 prikaz je zadnji uspjesni. Klikni Osvjezi.' : ('Ne mogu dohvatiti endpoint ('+err+').')); });
  }

  function buildOwnerFilters(){
    var owners=[]; TASKS.forEach(function(t){ if(owners.indexOf(t.owner)<0) owners.push(t.owner); }); owners.sort(byOwner);
    owners.forEach(function(o){ if(ownerOn[o]===undefined) ownerOn[o]=true; });
    var box=el('owner-filters'); box.innerHTML=''; box.style.display='flex';
    var critN_=TASKS.filter(function(t){return t.critical && !t.done;}).length;
    var cb=document.createElement('div'); cb.className='chip'; cb.dataset.on='true'; cb.style.border='1px solid rgba(255,180,60,.45)'; cb.title='Svi kriticni taskovi svih nositelja';
    if(critOnly){ cb.style.background='rgba(255,180,60,.14)'; cb.style.color='#ffce85'; }
    cb.innerHTML='Critical <span class="cc crit">'+critN_+'</span>';
    cb.addEventListener('click',function(){ critOnly=!critOnly; if(critOnly){ Object.keys(ownerOn).forEach(function(x){ ownerOn[x]=true; }); } buildOwnerFilters(); render(); });
    box.appendChild(cb);
    var ovrN_=TASKS.filter(function(t){return !t.done && isOverdue(t);}).length;
    var ob=document.createElement('div'); ob.className='chip'; ob.dataset.on='true'; ob.style.border='1px solid rgba(239,111,111,.45)'; ob.title='Svi taskovi kojima je prosao rok (svih nositelja)';
    if(ovrOnly){ ob.style.background='rgba(239,111,111,.14)'; ob.style.color='#f3a0a0'; }
    ob.innerHTML='Overdue <span class="cc over">'+ovrN_+'</span>';
    ob.addEventListener('click',function(){ ovrOnly=!ovrOnly; if(ovrOnly){ Object.keys(ownerOn).forEach(function(x){ ownerOn[x]=true; }); } buildOwnerFilters(); render(); });
    box.appendChild(ob);
    var stlN_=TASKS.filter(isStale14).length;
    var sb=document.createElement('div'); sb.className='chip'; sb.dataset.on='true'; sb.title='Taskovi kojima nositelj nije mijenjao next step 14 ili više dana (svih nositelja)';
    if(staleOnly){ sb.style.background='rgba(120,110,95,.12)'; }
    sb.innerHTML='Bez upisa 14+ d <span class="cc stl">'+stlN_+'</span>';
    sb.addEventListener('click',function(){ staleOnly=!staleOnly; if(staleOnly){ Object.keys(ownerOn).forEach(function(x){ ownerOn[x]=true; }); } buildOwnerFilters(); render(); });
    box.appendChild(sb);
    owners.forEach(function(o){ var open=TASKS.filter(function(t){return t.owner===o && !t.done;});
      var n=open.length;
      var over=open.filter(isOverdue).length;
      var crit=open.filter(function(t){return t.critical;}).length;
      var extra=''; if(crit) extra+=' <span class="cc crit" title="'+crit+' critical">'+crit+'</span>'; if(over) extra+=' <span class="cc over" title="'+over+' kasni">'+over+'</span>';
      var c=document.createElement('div'); c.className='chip'; c.dataset.on=ownerOn[o]; c.innerHTML=o+' <span class="c">'+n+'</span>'+extra;
      c.addEventListener('click',function(){
        var onCount=0; owners.forEach(function(x){ if(ownerOn[x]) onCount++; });
        if(ownerOn[o] && onCount===1){ owners.forEach(function(x){ ownerOn[x]=true; }); }
        else { owners.forEach(function(x){ ownerOn[x]=(x===o); }); }
        autoFlip(); buildOwnerFilters(); render();
      }); box.appendChild(c); });
    box.setAttribute('data-solo', owners.filter(function(x){ return ownerOn[x]; }).length===1?'1':'');
  }
  function byOwner(a,b){ var ia=OWNER_ORDER.indexOf(a),ib=OWNER_ORDER.indexOf(b); if(ia<0)ia=99; if(ib<0)ib=99; return ia-ib||a.localeCompare(b); }
  function weekRange(off){ var t=today0(); var day=(t.getDay()+6)%7; var mon=new Date(t); mon.setDate(t.getDate()-day+off*7); mon.setHours(0,0,0,0); var sun=new Date(mon); sun.setDate(mon.getDate()+6); sun.setHours(23,59,59,999); return {from:mon,to:sun}; }
  function winRange(){ if(winFilter==='today'){ var t=today0(); var e=new Date(t); e.setHours(23,59,59,999); return {from:t,to:e}; } if(winFilter==='this') return weekRange(0); if(winFilter==='next') return weekRange(1); return null; }
  function inWin(t){ if(winFilter==='all') return true; var ds=[]; var _w=(t.wait==='pending'||t.wait==='hold'); if((t.isProject||_w) && t.nextDate) ds.push(new Date(t.nextDate)); if(t.due && !_w) ds.push(new Date(t.due)); if(!ds.length) return false;
    if(winFilter==='overdue'){ var t0=today0(); return ds.some(function(d){ var x=new Date(d); x.setHours(0,0,0,0); return x<t0; }); }
    if(winFilter==='tilltoday'){ var e=today0(); e.setHours(23,59,59,999); return ds.some(function(d){ return d<=e; }); }
    if(winFilter==='week'){ var ew=weekRange(0).to; return ds.some(function(d){ return d<=ew; }); }
    if(winFilter==='today'){ var t0=today0(); return ds.some(function(d){ var x=new Date(d); x.setHours(0,0,0,0); return x.getTime()===t0.getTime(); }); }
    if(winFilter==='tomorrow'){ var tm=today0(); tm.setDate(tm.getDate()+1); return ds.some(function(d){ var x=new Date(d); x.setHours(0,0,0,0); return x.getTime()===tm.getTime(); }); }
    return true; }
  function visibleTasks(){ return TASKS.filter(function(t){ if(critOnly && !t.critical) return false; if(ovrOnly && !isOverdue(t)) return false; if(staleOnly && !isStale14(t)) return false; if(!ownerOn[t.owner]) return false; if(typeFilter==='project'&&!t.isProject) return false; if(typeFilter==='task'&&t.isProject) return false; if(typeFilter==='critical'&&!t.critical) return false; if(typeFilter==='fokus'&&!t.fokus) return false; if(typeFilter==='req'&&!t.req) return false; if(waitFilter==='action'&&t.wait!=='action') return false; if(waitFilter==='pending'&&t.wait!=='pending') return false; if(waitFilter==='hold'&&t.wait!=='hold') return false; if(waitFilter==='done'&&t.wait!=='done') return false; if(waitFilter==='waiting'&&t.wait!=='pending'&&t.wait!=='hold') return false;if(waitFilter==='stale'&&!isStale(t)) return false; if(waitFilter==='notdone'&&t.wait==='done') return false; if(searchQ && norm(t.title+' '+(t.nextText||'')+' '+(t.owner||'')).indexOf(searchQ)<0) return false; if(!inWin(t)) return false; return true; }); }
  function autoFlip(){
    return; /* ISKLJUCENO 11.9.2026. - statuse mijenjaju nositelji rucno */
    var todo=TASKS.filter(function(t){ var n=String(t.nextText||''); return !t.done && !/^\s*done\b/i.test(n) && /^\s*(pending|on hold)\b/i.test(n) && isOverdue(t); });
    if(!todo.length) return;
    var d=new Date(), dm=d.getDate()+'.'+(d.getMonth()+1)+'.';
    todo.forEach(function(t){
      var n0=String(t.nextText||'');
      var was=/^\s*on hold\b/i.test(n0) ? 'ON HOLD' : 'PENDING';
      var nx=n0.replace(/^\s*(pending|on hold)\b/i,'ACTION');
      var rest=('AUTO: '+dm+' '+was+' -> ACTION, rok probijen\n'+String(t.rest||'')).replace(/\n+$/,'');
      t.nextText=nx; t.rest=rest;
      var notes=buildNotes(nx, t.nextDate, rest, t.critical, t.link);
      t.notes=notes;
      api({action:'update', taskId:t.id, notes:notes}).catch(function(){});
    });
    setTimeout(function(){ banner(todo.length+' tema prebačena u ACTION (rok probijen)'); }, 500);
  }
  function isOverdue(t){ if(t.done) return false; var t0=today0().getTime(); var ds=[]; if(t.due) ds.push(t.due); if(t.isProject && t.nextDate) ds.push(t.nextDate); return ds.some(function(d){ var x=new Date(d); x.setHours(0,0,0,0); return x.getTime()<t0; }); }

  /* Kritično traka (D.K. 9.11.2026): otvoreni critical taskovi SAMO odabranog nositelja (jedan board), na vrhu liste, u svakom pogledu */
  function renderCritStrip(){
    var grid=el('grid'); if(!grid) return;
    if(!(window.__kyCss||{})['cs-style']){ var t='.crit-strip{margin:0 0 14px;border:1px solid var(--over);border-left:5px solid var(--over);background:var(--panel);border-radius:12px;padding:10px 14px}'+
      '.crit-strip .cs-h{display:flex;align-items:center;gap:10px}'+
      '.crit-strip .cs-t{font-weight:700;color:var(--over);letter-spacing:.02em;text-transform:uppercase;font-size:13px}'+
      '.crit-strip .cs-n{font-weight:700;font-size:12px;color:#fff;background:var(--over);border-radius:999px;padding:1px 8px}'+
      '.crit-strip .cs-tg{margin-left:auto;border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:8px;padding:3px 10px;font-size:12px;cursor:pointer}'+
      '.crit-strip .cs-l{margin-top:8px;display:flex;flex-direction:column;max-height:420px;overflow:auto}'+'.crit-strip .cs-rows{display:block;margin:8px -6px -10px -10px;border-top:1px solid var(--line)}'+'.crit-strip .cs-head{padding-right:16px}'+'.crit-strip .cs-rows .srow:last-child{border-bottom:0}'+
      '.crit-strip .cs-r{display:grid;grid-template-columns:90px minmax(0,1fr) auto;gap:10px;align-items:baseline;padding:6px 4px;border-top:1px solid var(--line);cursor:pointer}'+
      '.crit-strip .cs-r:hover{background:rgba(209,69,59,.06)}'+
      '.crit-strip .cs-o{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
      '.crit-strip .cs-ti{font-size:14px;color:var(--text);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
      '.crit-strip .cs-m{font-size:12px;color:var(--muted);white-space:nowrap}'+
      '.crit-strip .cs-r.late .cs-m b{color:var(--over)}'+
      '@media (max-width:700px){.crit-strip .cs-r{grid-template-columns:minmax(0,1fr)}.crit-strip .cs-m{white-space:normal}}';
      (window.kyCss||function(id,t){ var w=window.__kyCss=window.__kyCss||{}; if(w[id]||document.getElementById(id)) return; w[id]=1; try{ var sh=new CSSStyleSheet(); sh.replaceSync(t); document.adoptedStyleSheets=document.adoptedStyleSheets.concat([sh]); }catch(e){ var st=document.createElement('style'); st.id=id; st.textContent=t; (document.head||document.documentElement).appendChild(st); } })('cs-style', t); }
    var box=document.getElementById('crit-strip');
    if(!box){ box=document.createElement('div'); box.id='crit-strip'; box.className='crit-strip'; grid.parentNode.insertBefore(box,grid); }
    var _sel=Object.keys(ownerOn).filter(function(k){ return ownerOn[k]; }); var _own=_sel.length===1?_sel[0]:null;
    var list=TASKS.filter(function(t){ return t.critical && !t.done && t.owner===_own; });
    if(!_own || critOnly || timMode || reqMode || !list.length){ box.style.display='none'; box.innerHTML=''; return; }
    var t0=today0().getTime();
    function d0(d){ var x=new Date(d); x.setHours(0,0,0,0); return x.getTime(); }
    function key(t){ var ds=[]; if(t.nextDate) ds.push(d0(t.nextDate)); if(t.due) ds.push(d0(t.due)); return ds.length?Math.min.apply(null,ds):8e15; }
    list.sort(function(a,b){ return key(a)-key(b); });
    var open=true; try{ open=localStorage.getItem('ky_crit_open')!=='0'; }catch(e){}
    var h='<div class="cs-h"><span class="cs-t">⚑ Kritično · '+escapeHtml(String(_own))+'</span><span class="cs-n">'+list.length+'</span><button class="cs-tg" type="button">'+(open?'Sakrij':'Prikaži')+'</button></div>';
    if(open) h+='<div class="cs-l cs-rows"></div>';
    box.innerHTML=h; box.style.display=''; box.__list=list;
    box.querySelector('.cs-tg').addEventListener('click',function(){ try{ localStorage.setItem('ky_crit_open',open?'0':'1'); }catch(e){} renderCritStrip(); });
  }
  /* redovi trake su isti redak kao u listi: status, next step, datumi, kvačica i bočna ploča rade na mjestu (D.K. 11.11.2026.) */
  function fillCritStrip(rowFn){ var box=document.getElementById('crit-strip'); if(!box || box.style.display==='none') return; var l=box.querySelector('.cs-rows'); if(!l) return;
    l.innerHTML='<div class="srowhead cs-head"><span class="hsbox"></span><span class="hss">Status</span><span class="hst">Task</span><span class="hsn">Next step</span><span class="hsd">Next step do</span><span class="hsd">Rok</span><span class="hso">Nositelj</span></div>'; (box.__list||[]).forEach(function(t){ l.appendChild(rowFn(t)); }); }
  function render(){
    try{ renderCritStrip(); }catch(e){}
    var grid=el('grid'); grid.innerHTML=''; if(timMode){ renderTim(grid); updateProg(); return; } if(reqMode){ renderReq(grid); updateProg(); return; }
    var items=visibleTasks(); if(!isScoped()){ var _kb=document.createElement('div'); _kb.className='kybar'; var _kh=false; if(waitFilter==='done'){ var _dn=items.filter(function(x){return !x.done && x.wait==='done';}); if(_dn.length){ _kh=true; var _b1=document.createElement('button'); _b1.className='btn'; _b1.textContent='Zatvori sve prikazane DONE ('+_dn.length+')'; _b1.addEventListener('click',function(){ closeDoneBulk(_dn); }); _kb.appendChild(_b1); } } if(_kh) grid.appendChild(_kb); } grid.className='grid'; var _on=Object.keys(ownerOn).filter(function(k){return ownerOn[k];}); if(true){ grid.className='grid solo'; var _c=document.createElement('div'); _c.className='card'; var _l=document.createElement('div'); _l.className='list'; items.sort(function(a,b){ if(a.done!==b.done)return a.done?1:-1; if(a.critical!==b.critical)return a.critical?-1:1; var da=sortDate(a), db=sortDate(b); if(da===Infinity)da=8e15; if(db===Infinity)db=8e15; return da-db; }); 
  var _saveAll=function(t,row,f){ var nx=('nx' in f)?f.nx:t.nextText, nd=('nd' in f)?f.nd:t.nextDate, rest=('rest' in f)?f.rest:t.rest, crit=('crit' in f)?f.crit:t.critical, link=('link' in f)?f.link:t.link; var notes=buildNotes(nx,nd,rest,crit,link); if(typeof busy==='function')busy(row,true); api({action:'update',taskId:t.id,notes:notes}).then(function(res){ if(typeof busy==='function')busy(row,false); if(!res||res.error){ banner('Ne mogu spremiti: '+((res&&res.error)||'?')); load(); return; } t.nextText=nx; t.nextDate=nd; t.rest=rest; t.critical=crit; t.link=link; t.notes=notes; render(); }).catch(function(e){ banner('Greska: '+e); load(); }); };
 if(!window._soInit){ window._soInit=true; var mw=document.createElement('div'); mw.className='so-modal'; mw.innerHTML='<div class="so-box"><div class="so-hd"><b>Opis</b><button class="so-x" aria-label="Zatvori">\u2715</button></div><textarea class="so-ta" placeholder="Unesi opis\u2026"></textarea><div class="so-hist"></div><div class="so-row"><button class="so-cancel">Zatvori</button><button class="so-save">Spremi</button></div></div>'; document.body.appendChild(mw); window._soMW=mw; var cl=function(){ mw.classList.remove('show'); }; mw.querySelector('.so-x').addEventListener('click',cl); mw.querySelector('.so-cancel').addEventListener('click',cl); mw.addEventListener('click',function(e){ if(e.target===mw) cl(); }); mw.querySelector('.so-save').addEventListener('click',function(){ var c=window._soCur; if(c){ _saveAll(c.t,c.row,{rest:keepHist(c.t.rest,mw.querySelector('.so-ta').value.trim())}); } cl(); }); }
 var openOpis=function(t,row){ window._soCur={t:t,row:row}; window._soMW.querySelector('.so-ta').value=bodyOf(t.rest); var _sh=window._soMW.querySelector('.so-hist'); _sh.innerHTML=''; _sh.appendChild(histBox(t.rest)); window._soMW.classList.add('show'); setTimeout(function(){window._soMW.querySelector('.so-ta').focus();},30); };
 var soloRow=function(t){ var row=document.createElement('div'); row.__kyT=t; row.className='srow'+(t.done?' is-done':'')+(t.critical?' is-crit':''); var lnk=t.link||''; if(lnk && !/^https?:\/\//i.test(lnk)) lnk='https://'+lnk; var _t0=today0().getTime(); var _ndO=(!t.done&&t.nextDate&&new Date(new Date(t.nextDate).setHours(0,0,0,0)).getTime()<_t0)?' od':''; var _duO=(!t.done&&t.due&&new Date(new Date(t.due).setHours(0,0,0,0)).getTime()<_t0)?' od':''; row.innerHTML='<span class="sbox" title="gotovo">'+(t.done?'\u2713':'')+'</span><span class="sst">'+waitBadge(t)+'</span><div class="stitle">'+(t.req?'<span class="treq" title="Traži Domagoj: zatvara samo Domagoj, nositelj javlja gotovo jednim klikom">Traži Domagoj</span>':'')+(t.link?('<a class="slink" href="'+escapeAttr(lnk)+'" target="_blank" rel="noopener" title="Otvori link">\u2197</a> '):'')+escapeHtml(t.title)+(t.isProject?' <span class="sproj">projekt</span>':'')+rokBadge(t)+stale14Badge(t)+createdLine(t)+'</div><button class="s-copy" title="Kopiraj naziv" aria-label="Kopiraj naziv"></button><textarea class="s-next" rows="1" placeholder="next step\u2026">'+escapeHtml(t.nextText||'')+'</textarea>'+'<input type="date" class="s-ndate'+_ndO+(t.nextDate?'':' d-empty')+'" value="'+escapeAttr(dateInputVal(t.nextDate))+'" title="Datum next stepa">'+'<input type="date" class="s-due'+_duO+(t.locked?' due-lock':'')+(t.due?'':' d-empty')+'" value="'+escapeAttr(dateInputVal(t.due))+'" title="'+(t.locked?'Rok zaklju\u010dao Domagoj':'Rok zavrsetka taska')+'"'+((t.locked&&isScoped())?' disabled':'')+'><button class="icon opis-pill s-icn'+((t.rest&&t.rest.trim())?' has':'')+'" data-opis="'+escapeAttr(t.rest||'')+'" title="Opis (klik za uredi, hover za pregled)">\u270E</button><button class="icon s-icn s-link'+(t.link?' on':'')+'" title="Link">\uD83D\uDD17</button><button class="icon s-icn s-wait'+(t.wait?' won-'+t.wait:'')+'" title="Status (klik: odaberi s popisa)">'+(t.wait==='done'?'\u2705':(t.wait==='action'?'\uD83D\uDFE0':(t.wait==='pending'?'\uD83D\uDD35':(t.wait==='hold'?'\u23F8':'\u25CB'))))+'</button><button class="icon s-icn s-crit'+(t.critical?' on':'')+'" title="Critical">\u2691</button>'+(t.isProject&&!t.done&&t.owner!=='Private'&&(!isScoped()||t.fokus)?'<button class="icon s-icn s-fok'+(t.fokus?' on':'')+(isScoped()?' fok-lock':'')+'"'+(isScoped()?' disabled':'')+' title="'+(isScoped()?'Fokus određuje Domagoj':'Fokus projekt, jedan po osobi')+'">\u2605</button>':'<button class="icon s-icn s-fok s-fok-na" tabindex="-1" aria-hidden="true"></button>')+'<button class="icon s-icn s-lock'+(t.locked?' lon':'')+'" title="'+(t.locked?(isScoped()?'Rok zaklju\u010dao Domagoj':'Rok zaklju\u010dan \u2014 klik za otklju\u010davanje'):(isScoped()?'':'Zaklju\u010daj rok'))+'">'+(t.locked?'\uD83D\uDD10':'\u25CB')+'</button><button class="icon s-icn s-proj'+(t.isProject?' on':'')+'" title="'+(t.isProject?'Projekt \u2014 klik da vise nije':'Oznaci kao projekt')+'">'+(t.isProject?'\u25A3':'\u25A2')+'</button><select class="sowner s-own" title="Nositelj — promjena prebacuje task">'+ownerOpts(t.prefix)+'</select>'; row.querySelector('.sbox').addEventListener('click',function(){ toggle(t,row); }); row.querySelector('.s-copy').addEventListener('click',function(e){ e.stopPropagation(); copyText(t.title); });
    var _ow=row.querySelector('.s-own'); if(_ow){ _ow.addEventListener('click',function(e){ e.stopPropagation(); }); _ow.addEventListener('change',function(){ var _p=this.value; if(_p===t.prefix) return; if(!_p) return; saveTask(t,row,t.title,t.due,t.nextText||'',t.nextDate,_p,t.link); toast('Task prebačen na '+(MAP[_p]||_p)); }); }
    var _pj=row.querySelector('.s-proj'); if(_pj) _pj.addEventListener('click',function(e){ e.stopPropagation(); t.isProject=!t.isProject; saveTask(t,row,t.title,t.due,t.nextText||'',t.nextDate,t.prefix,t.link); }); row.querySelector('.s-next').addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); this.blur(); } }); /* mobilni (20.11.2026.): next step u 2 reda, i dalje jedan red teksta */ row.querySelector('.s-next').addEventListener('change',function(){ var v=stripSlot(this.value.replace(/\s*\n\s*/g,' ').trim()); if(v!==(t.nextText||'')){ t.rest=_stampStatus(t.rest); _saveAll(t,row,{nx:v}); } }); row.querySelector('.s-ndate')?.addEventListener('change',function(){ _saveAll(t,row,{nd:this.value?fromInput(this.value):null}); }); row.querySelector('.s-due').addEventListener('change',function(){
      var dd = this.value ? fromInput(this.value) : null;
      var _od = t.due, _or = t.rest, _rsn='';
      if(t.req && isScoped() && String(_od||'')!==String(dd||'')){ _rsn=(prompt('Za novi rok upiši razlog (zašto trebaš više vremena):','')||'').trim(); if(!_rsn){ this.value=dateInputVal(_od); return; } }
      var _nr = (String(_od||'') !== String(dd||'')) ? _stampRok(t.rest,_od,dd) : t.rest;
      var _nn = buildNotes(t.nextText,t.nextDate,_nr,t.critical,t.link);
      t.due = dd; t.rest = _nr; t.notes = _nn; render();
      var _pu={action:'update', taskId:t.id, notes:_nn, due: dd?toISODate(dd):''}; if(_rsn) _pu.reason=_rsn;
      api(_pu).then(function(res){
        if(!res||res.error){ t.due=_od; t.rest=_or; render(); banner('Rok nije spremljen: '+((res&&res.error)||'-')); return; }
        if(t.req) load();
        banner(''); el('synced').textContent = 'sync '+new Date().toLocaleTimeString();
      }).catch(function(e){ t.due=_od; t.rest=_or; render(); banner('Rok nije spremljen: '+e); });
    });
    row.querySelector('.opis-pill').addEventListener('click',function(){ openOpis(t,row); }); row.querySelector('.s-link').addEventListener('click',function(){ var v=prompt('Zalijepi link (Google Drive doc). Ostavi prazno za brisanje:', t.link||''); if(v!==null){ _saveAll(t,row,{link:v.trim()}); } }); row.querySelector('.s-crit').addEventListener('click',function(){ _saveAll(t,row,{crit:!t.critical}); }); var _fk=row.querySelector('.s-fok:not(.s-fok-na)'); if(_fk) _fk.addEventListener('click',function(e){ e.stopPropagation(); toggleFokus(t,row); }); var sl_=row.querySelector('.s-lock'); if(sl_) sl_.addEventListener('click',function(e){ e.stopPropagation(); toggleLock(t,row); }); row.querySelector('.s-wait').addEventListener('click',function(e){ e.stopPropagation(); toggleWait(t,row,e.currentTarget); }); var wpS_=row.querySelector('.wpill'); if(wpS_) wpS_.addEventListener('click',function(e){ e.stopPropagation(); statusMenu(t,row,wpS_); }); var la=row.querySelector('.slink'); if(la) la.addEventListener('click',function(e){ e.stopPropagation(); }); var _wrap=document.createElement('div'); _wrap.className='solo-wrap'; _wrap.appendChild(row); var _st=row.querySelector('.stitle'); if(_st){ _st.addEventListener('click',function(e){ if(e.target.closest('.slink'))return; e.stopPropagation(); openDrawer(t,row); }); } return _wrap; };
 var sh=document.createElement('div'); sh.className='srowhead'; try{ fillCritStrip(soloRow); }catch(e){} if(SORT.by) items.sort(sortCmp); sh.innerHTML='<span class="hsbox"></span>'+sortHead('hss','status','Status')+sortHead('hst','title','Task')+sortHead('hsn','nexttext','Next step')+sortHead('hsd','next','Next step do')+sortHead('hsd','due','Rok')+sortHead('hso','owner','Nositelj'); Array.prototype.forEach.call(sh.querySelectorAll('[data-s]'),function(h){ h.addEventListener('click',function(){ setSort(h.getAttribute('data-s')); }); }); _c.appendChild(sh);
 if(typeFilter==='req'&&!items.length){ var _e0=document.createElement('div'); _e0.className='ge-empty'; _e0.textContent='Nema otvorenih zahtjeva.'; _c.appendChild(_e0); grid.appendChild(_c); updateProg(); return; } items.forEach(function(t){ _l.appendChild(soloRow(t)); }); if(!items.length){ var _e=document.createElement('div'); _e.className='empty-v'; _e.textContent=searchQ?'Ništa ne odgovara pretrazi.':'Ovdje trenutno nema ničega.'; _l.appendChild(_e); } _c.appendChild(_l); grid.appendChild(_c); updateProg(); return; }
    if(groupMode==='owner_next'){ renderOwnerNested(grid, items, 'nextDate'); updateProg(); return; }
    if(groupMode==='owner_due'){ renderOwnerNested(grid, items, 'due'); updateProg(); return; }
    var groups={};
    items.forEach(function(t){ var key; if(groupMode==='owner') key=t.owner; else if(groupMode==='due') key=bucket(t.due); else key=t.nextDate?bucket(t.nextDate):'Bez next stepa'; (groups[key]=groups[key]||[]).push(t); });
    if(groupMode==='owner'){ var _ca=items.filter(function(t){return !t.done && t.critical;}); if(_ca.length) groups['CRITICAL']=_ca; }
    var keys=Object.keys(groups);
    if(groupMode==='owner') keys.sort(byOwner); else keys.sort(function(a,b){ var ia=BUCKET_ORDER.indexOf(a),ib=BUCKET_ORDER.indexOf(b); if(ia<0)ia=98; if(ib<0)ib=98; return ia-ib; });
    keys.forEach(function(k){ var arr=groups[k]; arr.sort(function(a,b){ if(a.done!==b.done) return a.done?1:-1; if(a.critical!==b.critical) return a.critical?-1:1; if(a.isProject!==b.isProject) return a.isProject?-1:1; return sortDate(a)-sortDate(b); });
      var card=document.createElement('div'); card.className='card';
      if(groupMode!=='owner'){ if(k==='Prekoračeno') card.className+=' b-over'; else if(k==='Danas') card.className+=' b-today'; } else if(k==='Private') card.className+=' cat-private'; else if(k==='CRITICAL') card.style.border='1px solid rgba(255,180,60,.4)';
      var doneN=arr.filter(function(t){return t.done;}).length;
      var badges='';
      if(groupMode==='owner'){ var oN=arr.filter(isOverdue).length, cN=arr.filter(function(t){return !t.done&&t.critical;}).length; if(cN) badges+='<span class="critb">'+cN+' crit</span>'; if(oN) badges+='<span class="kasni">kasni '+oN+'</span>'; }
      card.innerHTML='<div class="card-h"><div class="gname">'+k+'</div><div style="display:flex;gap:8px;align-items:center">'+badges+'<div class="count">'+(loadCompleted?doneN+'/'+arr.length:arr.length)+'</div></div></div>';
      var list=document.createElement('div'); list.className='list'; tagOwner=(groupMode==='owner' && k==='CRITICAL'); arr.forEach(function(t){ list.appendChild(rowEl(t)); }); tagOwner=false; card.appendChild(list); grid.appendChild(card); });
    updateProg();
  }
  function renderOwnerNested(grid, items, field){
    var emptyLbl = field==='due' ? 'Bez roka' : 'Bez next stepa';
    var owners=[]; items.forEach(function(t){ if(owners.indexOf(t.owner)<0) owners.push(t.owner); }); owners.sort(byOwner); var t0=today0().getTime();
    ['CRITICAL'].concat(owners).forEach(function(o){ var isCritGrp=(o==='CRITICAL'); tagOwner=isCritGrp; var arr=isCritGrp? items.filter(function(t){return !t.done && t.critical;}) : items.filter(function(t){return t.owner===o;}); if(isCritGrp && !arr.length) return;
      var card=document.createElement('div'); card.className='card'+(o==='Private'?' cat-private':''); if(isCritGrp){ card.style.border='1px solid rgba(255,180,60,.4)'; }
      var doneN=arr.filter(function(t){return t.done;}).length;
      var overN=arr.filter(isOverdue).length;
      var critN=arr.filter(function(t){return !t.done && t.critical;}).length;
      var kasni=overN>0? '<span class="kasni">kasni '+overN+'</span>':'';
      var critb=critN>0? '<span class="critb">'+critN+' crit</span>':'';
      var saO=selectMode?'<span class="selall" data-sa="o">sve</span>':'';
      card.innerHTML='<div class="card-h"><div class="gname">'+o+'</div><div style="display:flex;gap:8px;align-items:center">'+saO+critb+kasni+'<div class="count">'+(loadCompleted?doneN+'/'+arr.length:arr.length)+'</div></div></div>';
      if(selectMode){ var sao=card.querySelector('[data-sa="o"]'); if(sao) sao.addEventListener('click',function(e){ e.stopPropagation(); selectGroup(arr); }); }
      var list=document.createElement('div'); list.className='list';
      var subs={}; arr.forEach(function(t){ var k=t[field]?bucket(t[field]):emptyLbl; (subs[k]=subs[k]||[]).push(t); });
      var ORDER2=['Prekoračeno','Danas','Ovaj tjedan','Sljedeći tjedan','Kasnije','Bez datuma',emptyLbl];
      var bk=Object.keys(subs).sort(function(a,b){ var ia=ORDER2.indexOf(a),ib=ORDER2.indexOf(b); if(ia<0)ia=98; if(ib<0)ib=98; return ia-ib; });
      bk.forEach(function(k){ var sarr=subs[k]; sarr.sort(function(a,b){ if(a.done!==b.done) return a.done?1:-1; if(a.critical!==b.critical) return a.critical?-1:1; if(a.isProject!==b.isProject) return a.isProject?-1:1; var da=a[field]?new Date(a[field]).getTime():Infinity, db=b[field]?new Date(b[field]).getTime():Infinity; return da-db; });
        var sh=document.createElement('div'); sh.className='subhead'+(k==='Prekoračeno'?' over':(k==='Danas'?' today':'')); sh.innerHTML=k+' <span class="sc">'+sarr.length+'</span>'+(selectMode?' <span class="selall" data-sa="g">sve</span>':''); list.appendChild(sh);
        if(selectMode){ var sag=sh.querySelector('[data-sa="g"]'); if(sag) sag.addEventListener('click',function(e){ e.stopPropagation(); selectGroup(sarr); }); }
        sarr.forEach(function(t){ list.appendChild(rowEl(t)); }); });
      card.appendChild(list); grid.appendChild(card); });
  }
  function sortDate(t){ var c=[]; if(t.due) c.push(new Date(t.due).getTime()); if(t.isProject && t.nextDate) c.push(new Date(t.nextDate).getTime());
    c=c.filter(function(x){ return !isNaN(x); });
    return c.length? Math.min.apply(null,c) : Infinity; }

  function waitOf(txt){ var n=String(txt||'').replace(/^[\s\-\u2013\u2014|:]+/,''); if(/^done\b/i.test(n)) return 'done'; if(/^action\b/i.test(n)) return 'action'; if(/^pending\b/i.test(n)) return 'pending'; if(/^on hold\b/i.test(n)) return 'hold'; return ''; }
  function paintWait(row,w){ if(!row) return;
    var p=row.querySelector('.wpill'); if(p){ p.className='wpill '+(WCLS[w]||'wp-none'); p.textContent=WLBL[w]||'status'; }
    var sw=row.querySelector('.s-wait'); if(sw){ sw.className='icon s-icn s-wait'+(w?' won-'+w:''); sw.textContent=(w==='action'?'\uD83D\uDFE0':(w==='pending'?'\uD83D\uDD35':(w==='hold'?'\u23F8':'\u25CB'))); } }
  var WLBL={action:'ACTION',pending:'PENDING',hold:'ON HOLD',done:'DONE'}, WCLS={action:'wp-act',pending:'wp-pend',hold:'wp-hold',done:'wp-done'};
  function waitBadge(t){ return '<span class="wpill '+(WCLS[t.wait]||'wp-none')+'" title="Klik: promijeni status">'+(WLBL[t.wait]||'status')+'</span> '; }
  function rowEl(t){
    var row=document.createElement('div'); row.className='row'; row.dataset.done=t.done; row.dataset.id=t.id;
    row.dataset.cat=(t.owner==='Private')?'private':''; row.dataset.proj=t.isProject?'true':'false'; row.dataset.crit=t.critical?'true':'false';
    var toPriv=(t.owner!=='Private'); var btnLbl=toPriv?'→ Private':'→ Dom';
    var nextInner=(t.nextDate?'<span class="ndate '+whenClass(t.nextDate,t.done)+'">'+fmtShort(t.nextDate)+'</span>':'')+'<input class="ntext-in" placeholder="next step…" value="'+escapeAttr(t.nextText||'')+'">';
    var nudges='<span class="nudges"><button class="nudge" data-n="md">-1d</button><button class="nudge" data-n="today">danas</button><button class="nudge" data-n="d">+1d</button><button class="nudge" data-n="w">+1tj</button></span>';
    var nextHtml='<div class="next'+((t.nextDate||t.nextText)?'':' empty')+'"><span class="nlabel">NEXT</span>'+nextInner+nudges+'</div>';
    var rok=t.due?'<span class="rok '+whenClass(t.due,t.done)+'">rok '+fmtRok(t.due)+'</span>':'<span class="rok">+ rok</span>';
    var rnudges='<span class="rnudges"><button class="nudge" data-rn="md">-1d</button><button class="nudge" data-rn="today">danas</button><button class="nudge" data-rn="d">+1d</button><button class="nudge" data-rn="w">+1tj</button></span>';
    var ochip=(groupMode==='due'||groupMode==='next'||tagOwner)?'<span class="ochip'+(t.owner==='Private'?' priv':'')+'">'+t.owner+'</span>':'';
    var opis='<span class="pill opis-pill" data-opis="'+escapeAttr(t.notes||'')+'">opis'+((t.notes&&String(t.notes).trim())?' •':'')+'</span>';
    var uredi='<span class="pill uredi-pill">uredi</span>';
    var projp='<span class="pill projekt-pill'+(t.isProject?' proj-on':'')+'">'+(t.isProject?'projekt ✓':'projekt')+'</span>';
    var fokp=(t.isProject&&!t.done&&t.owner!=='Private'&&(!isScoped()||t.fokus))?'<span class="pill fok-pill'+(t.fokus?' fok-on':'')+'" title="Fokus projekt, jedan po osobi">'+(t.fokus?'★ fokus':'☆ fokus')+'</span>':'';
    var critp='<span class="pill crit-pill'+(t.critical?' crit-on':'')+'">'+(t.critical?'critical ✓':'critical')+'</span>';
    var lhref=t.link||''; if(lhref && !/^https?:\/\//i.test(lhref)) lhref='https://'+lhref;
    var linkp=t.link?'<a class="pill link-pill" href="'+escapeAttr(lhref)+'" target="_blank" rel="noopener">↗ otvori</a>':'';
    var waitp='<span class="pill wait-pill'+(t.wait?' w-on-'+t.wait:'')+'" title="Klik: odaberi status s popisa">'+(t.wait==='action'?'\uD83D\uDFE0 ACTION':(t.wait==='pending'?'\uD83D\uDD35 PENDING':'status'))+'</span>';
    row.innerHTML='<span class="selbox"></span><span class="box"><svg viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.6l4.4-5" fill="none" stroke="#0d1014" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'+
      '<span class="tbody"><span class="tt">'+waitBadge(t)+escapeHtml(t.title)+'</span>'+nextHtml+'<span class="tags">'+rok+rnudges+ochip+opis+uredi+projp+fokp+critp+waitp+linkp+'</span></span>'+
      '<button class="priv-btn">'+btnLbl+'</button>';
    var tbody=row.querySelector('.tbody');
    var _fp=row.querySelector('.fok-pill'); if(_fp) _fp.addEventListener('click',function(e){ e.stopPropagation(); toggleFokus(t,row); });
    var lp=row.querySelector('.link-pill'); if(lp) lp.addEventListener('click',function(e){ e.stopPropagation(); });
    var sb=row.querySelector('.selbox'); if(selected[t.id]) sb.setAttribute('data-sel','1');
    sb.addEventListener('click',function(e){ e.stopPropagation(); toggleSel(t.id,row); });

    var nin=row.querySelector('.ntext-in');
    if(nin){ nin.addEventListener('click',function(e){ e.stopPropagation(); });
      nin.addEventListener('change',function(){ var v=stripSlot(this.value.trim()); if(v===(t.nextText||'')) return;
        var notes=buildNotes(v, t.nextDate, t.rest, t.critical, t.link);
        busy(row,true); api({action:'update', taskId:t.id, notes:notes}).then(function(res){ busy(row,false); if(!res||res.error){ banner('Ne mogu spremiti next step'); load(); return; } banner(''); t.nextText=v; t.notes=(res&&res.notes)||notes; }).catch(function(err){ busy(row,false); banner('Greška: '+err); }); }); }

    // opis (uvijek), otklopiv + editabilan
    var op=row.querySelector('.opis-pill');
    op.addEventListener('click',function(e){ e.stopPropagation();
      var ex=tbody.querySelector('.notes'); if(ex){ ex.remove(); op.classList.remove('open'); return; }
      tbody.appendChild(notesPanel(t,row)); op.classList.add('open'); });

    ['.tt','.ndate','.nlabel','.uredi-pill','.rok'].forEach(function(sel){ var e0=row.querySelector(sel); if(e0) e0.addEventListener('click',function(e){ e.stopPropagation(); openEditor(t,row,tbody); }); });
    Array.prototype.forEach.call(row.querySelectorAll('.nudges .nudge'),function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); nudge(t,row,b.dataset.n); }); });
    Array.prototype.forEach.call(row.querySelectorAll('.rnudges .nudge'),function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); nudgeDue(t,row,b.dataset.rn); }); });
    row.querySelector('.projekt-pill').addEventListener('click',function(e){ e.stopPropagation(); toggleProject(t,row); });
    row.querySelector('.crit-pill').addEventListener('click',function(e){ e.stopPropagation(); toggleCritical(t,row); });
    
    var wp_=row.querySelector('.wpill'); if(wp_) wp_.addEventListener('click',function(e){ e.stopPropagation(); toggleWait(t,row,e.currentTarget); });
    row.addEventListener('click',function(e){ if(e.target.closest('.box')) toggle(t,row); });
    row.querySelector('.priv-btn').addEventListener('click',function(e){ e.stopPropagation(); rename(t,row,toPriv?'Private':'Dom'); });
    return row;
  }

  function notesPanel(t,row){
    var wrap=document.createElement('div'); wrap.className='notes';
    function showRead(){
      wrap.innerHTML='';
      if(t.rest){ t.rest.split('\n').forEach(function(line){ var p=document.createElement('div'); p.className='nline';
        var re=/(https?:\/\/[^\s]+)/g,last=0,m; while((m=re.exec(line))){ if(m.index>last) p.appendChild(document.createTextNode(line.slice(last,m.index)));
          var a=document.createElement('a'); a.href=m[0]; a.target='_blank'; a.rel='noopener'; a.textContent='link ↗'; a.className='nlink'; a.addEventListener('click',function(e){e.stopPropagation();}); p.appendChild(a); last=m.index+m[0].length; }
          if(last<line.length) p.appendChild(document.createTextNode(line.slice(last))); if(line.trim()==='') p.innerHTML='&nbsp;'; wrap.appendChild(p); }); }
      else { var em=document.createElement('div'); em.className='nline'; em.style.color='var(--faint)'; em.textContent='(nema opisa)'; wrap.appendChild(em); }
      var eb=document.createElement('button'); eb.className='mini edit'; eb.textContent='uredi opis'; eb.addEventListener('click',function(e){ e.stopPropagation(); showEdit(); }); wrap.appendChild(eb);
    }
    function showEdit(){
      wrap.innerHTML='';
      var box=document.createElement('div'); box.className='nedit';
      var ta=document.createElement('textarea'); ta.value=bodyOf(t.rest); box.appendChild(ta); box.appendChild(histBox(t.rest));
      var btns=document.createElement('div'); btns.className='nbtns';
      var sv=document.createElement('button'); sv.className='mini save'; sv.textContent='Spremi';
      var cn=document.createElement('button'); cn.className='mini cancel'; cn.textContent='Odustani';
      btns.appendChild(sv); btns.appendChild(cn); box.appendChild(btns); wrap.appendChild(box);
      ta.focus();
      cn.addEventListener('click',function(e){ e.stopPropagation(); showRead(); });
      sv.addEventListener('click',function(e){ e.stopPropagation(); saveDesc(t,row,keepHist(t.rest,ta.value), showRead); });
    }
    showRead();
    wrap.addEventListener('click',function(e){ e.stopPropagation(); });
    return wrap;
  }

  function openEditor(t,row,tbody){
    if(tbody.querySelector('.editor')) return;
    var ed=document.createElement('div'); ed.className='editor';
    ed.innerHTML='<div class="efld grow"><label>Naziv</label><input type="text" class="e-title"></div>'+
      '<div class="efld"><label>Nositelj</label><select class="e-owner">'+ownerOpts(t.prefix)+'</select></div>'+
      '<div class="efld"><label>Rok</label><input type="date" class="e-due"></div>'+
      '<div class="efld grow"><label>Next step</label><input type="text" class="e-ntext"></div>'+
      '<div class="efld"><label>Next datum</label><input type="date" class="e-ndate"></div>'+
      '<div class="efld grow"><label>Link (zasebna razrada / dokument)</label><input type="text" class="e-link" placeholder="https://..."></div>'+
      '<button class="save">Spremi</button><button class="cancel">Odustani</button>';
    tbody.appendChild(ed);
    ed.querySelector('.e-title').value=t.title; ed.querySelector('.e-due').value=dateInputVal(t.due); if(t.locked&&isScoped()){ ed.querySelector('.e-due').disabled=true; ed.querySelector('.e-due').title='Rok zaklju\u010dao Domagoj'; }
    ed.querySelector('.e-ntext').value=t.nextText||''; ed.querySelector('.e-ndate').value=dateInputVal(t.nextDate);
    ed.querySelector('.e-link').value=t.link||'';
    ed.addEventListener('click',function(e){ e.stopPropagation(); });
    ed.querySelector('.cancel').addEventListener('click',function(e){ e.stopPropagation(); ed.remove(); });
    ed.querySelector('.save').addEventListener('click',function(e){ e.stopPropagation(); saveTask(t,row, ed.querySelector('.e-title').value.trim(), fromInput(ed.querySelector('.e-due').value), ed.querySelector('.e-ntext').value.trim(), fromInput(ed.querySelector('.e-ndate').value), ed.querySelector('.e-owner').value, ed.querySelector('.e-link').value.trim()); });
  }

  function saveTask(t,row,naziv,dueDate,nextText,nextDate,newPrefix,newLink){
    var px=newPrefix||t.prefix; var ownerChanged=(px!==t.prefix);
    if(newLink!==undefined) t.link=newLink;
    var notes=buildNotes(nextText,nextDate,t.rest,t.critical,t.link);
    var params={action:'update', taskId:t.id, title:makeTitle(px,naziv,t.isProject), notes:notes};
    if(dueDate && !(t.locked&&isScoped())) params.due=toISODate(dueDate);
    busy(row,true); api(params).then(function(res){ busy(row,false); if(!res||res.error){ banner('Ne mogu spremiti: '+((res&&res.error)||'?')); return; }
      banner(''); t.title=naziv; t.prefix=px; t.owner=MAP[px]||px; if(dueDate && !(t.locked&&isScoped())) t.due=dueDate; t.nextText=nextText; t.nextDate=nextDate; t.notes=notes; if(ownerChanged) buildOwnerFilters(); render();
    }).catch(function(err){ busy(row,false); banner('Greška: '+err); });
  }
  function saveDesc(t,row,newRest,after){
    var notes=buildNotes(t.nextText,t.nextDate,newRest,t.critical,t.link);
    busy(row,true); api({action:'update', taskId:t.id, notes:notes}).then(function(res){ busy(row,false); if(!res||res.error){ banner('Ne mogu spremiti opis: '+((res&&(res.message||res.error))||'?')); return; }
      banner(''); t.rest=newRest; t.notes=notes; if(after) after(); else render();
    }).catch(function(err){ busy(row,false); banner('Greška: '+err); });
  }
  function nudge(t,row,kind){
    var base; if(kind==='today') base=today0(); else { base=t.nextDate? new Date(t.nextDate): today0(); base.setHours(0,0,0,0); if(kind==='d') base.setDate(base.getDate()+1); else if(kind==='w') base.setDate(base.getDate()+7); else if(kind==='md') base.setDate(base.getDate()-1); }
    var notes=buildNotes(t.nextText, base, t.rest,t.critical,t.link);
    busy(row,true); api({action:'update', taskId:t.id, notes:notes}).then(function(res){ busy(row,false); if(!res||res.error){ banner('Ne mogu pomaknuti: '+((res&&res.error)||'?')); return; }
      banner(''); t.nextDate=base; t.notes=notes; render();
    }).catch(function(err){ busy(row,false); banner('Greška: '+err); });
  }
  function nudgeDue(t,row,kind){
    var base; if(kind==='today') base=today0(); else { base=t.due? new Date(t.due): today0(); base.setHours(0,0,0,0); if(kind==='d') base.setDate(base.getDate()+1); else if(kind==='w') base.setDate(base.getDate()+7); else if(kind==='md') base.setDate(base.getDate()-1); }
    busy(row,true); api({action:'update', taskId:t.id, due:toISODate(base)}).then(function(res){ busy(row,false); if(!res||res.error){ banner('Ne mogu pomaknuti rok: '+((res&&res.error)||'?')); return; }
      banner(''); t.due=base; render();
    }).catch(function(err){ busy(row,false); banner('Greška: '+err); });
  }
  function isScoped(){ return document.body.classList.contains('scoped'); }
/* ===== Mirror: taskovi nositelja s projektnih boardova ===== */
var MX={items:[], ts:0, loading:false, err:'', open:{}};
var MX_LINK={kcep:'kcep',zabica:'zabica',cm:'cm',menu:'menu',gastro:'gastro',stores:'stores',procurement:'procurement'};
var MX_OWN={'AnaT':'Ana Trusk','Silvana':'Silva'};
try{ MX.open=JSON.parse(localStorage.getItem('ky_mx_open')||'{}')||{}; }catch(e){ MX.open={}; }
function mxEsc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function mxOwner(o){ return MX_OWN[o]||o; }
function mxD(x){ var a=x.sdue||'', b=x.due||''; if(a&&b) return a<b?a:b; return a||b; }
function mxLoad(force){ if(MX.loading) return; if(!force && Date.now()-MX.ts<60000) return; MX.loading=true;
  api({action:'mirror'}).then(function(r){ MX.loading=false; MX.ts=Date.now(); if(!r||r.error){ MX.err=(r&&r.error)||'?'; MX.items=[]; } else { MX.err=''; MX.items=(r.items||[]).filter(function(x){ return x.due||x.sdue; }).map(function(x){ x.dlv=''; return x; }); } mxRender(); })
  .catch(function(e){ MX.loading=false; MX.ts=Date.now(); MX.err=String(e); mxRender(); }); }
function mxVisible(){ var scoped=isScoped(); var t0=today0();
  return MX.items.filter(function(x){
    if(!scoped){ var o=mxOwner(x.owner); if(ownerOn[o]!==true) return false; }
    if(searchQ && (String(x.naziv)+' '+String(x.parent)+' '+String(x.label)+' '+String(x.store||'')).toLowerCase().indexOf(searchQ)<0) return false;
    if(typeof critOnly!=='undefined' && critOnly && !x.critical) return false;
    var d=mxD(x)?new Date(mxD(x)+'T00:00:00'):null;
    if(typeof ovrOnly!=='undefined' && ovrOnly && !(d && d<t0)) return false;
    if(winFilter!=='all' && !inWin({due:x.due?x.due+'T00:00:00':null, nextDate:x.sdue?x.sdue+'T00:00:00':null, isProject:true})) return false;
    return true; }); }
function mxPill(n){ var s=String(n||'').replace(/^[\s\-–—|:]+/,''); var m=s.match(/^(action|pending|on hold|done)\b/i); if(!m) return ''; var k=m[1].toLowerCase(); return '<span class="mx-pill mx-'+k.replace(' ','')+'">'+m[1].toUpperCase()+'</span>'; }
var _timTs=-1;
function mxRender(){ var box=el('mirror'); if(!box) return; if(timMode||reqMode){ box.style.display='none'; if(_timTs!==MX.ts){ _timTs=MX.ts; render(); } return; } 
  if(!MX.ts && !MX.items.length){ box.style.display='none'; return; }
  if(MX.err){ box.style.display='block'; box.innerHTML='<div class="mx-h"><b>Projektni boardovi</b><span class="mx-n">nedostupno ('+mxEsc(MX.err)+')</span></div>'; return; }
  /* sažetak po boardu (4.11.2026.): jedan red po boardu umjesto svih stavki; uređuje se na samom boardu */
  var vis=mxVisible(); if(!vis.length){ box.style.display='none'; return; }
  var t0=today0(), groups={}; vis.forEach(function(x){ (groups[x.board]=groups[x.board]||[]).push(x); });
  var h='<div class="mx-h"><b>Projektni boardovi</b><span class="mx-n">'+vis.length+' s rokom u ovom prikazu</span><button class="mx-rf" title="Osvježi">↻</button></div>';
  Object.keys(groups).sort(function(a,c){ return groups[c].length-groups[a].length; }).forEach(function(b){ var arr=groups[b];
    var over=arr.filter(function(x){ return mxD(x) && new Date(mxD(x)+'T00:00:00')<t0; }).length;
    h+='<a class="mx-sum" href="'+mxEsc(MX_LINK[b]||b)+'/"><b>'+mxEsc(arr[0].label)+'</b><span class="mx-n">'+arr.length+' otvoreno</span>'+(over?'<span class="mx-over">'+over+' kasni</span>':'')+'<span class="mx-go">Otvori ↗</span></a>'; });
  box.style.display='block'; box.innerHTML=h; mxWire(box); }
function mxFind(row){ var b=row.getAttribute('data-b'), id=row.getAttribute('data-id'); return MX.items.filter(function(x){ return x.board===b && x.id===id; })[0]; }
function mxSave(x, fields, row, okMsg){ if(row) row.classList.add('busy'); var p={action:'mupdate', board:x.board, id:x.id}; Object.keys(fields).forEach(function(k){ p[k]=fields[k]; });
  api(p).then(function(r){ if(row) row.classList.remove('busy'); if(!r||r.error){ banner('Nije spremljeno: '+((r&&r.error)||'?')); mxLoad(true); return; }
    Object.keys(fields).forEach(function(k){ x[k]=fields[k]; }); if(fields.status==='Gotovo'){ MX.items=MX.items.filter(function(y){ return y!==x; }); }
    banner(okMsg||'Spremljeno na '+x.label); mxRender(); }).catch(function(e){ if(row) row.classList.remove('busy'); banner('Greška: '+e); }); }
function mxWire(box){
  var rf=box.querySelector('.mx-rf'); if(rf) rf.addEventListener('click', function(){ mxLoad(true); });
  Array.prototype.forEach.call(box.querySelectorAll('.mx-bh'), function(hd){ hd.addEventListener('click', function(e){ if(e.target.closest('a')) return; var b=hd.parentNode.getAttribute('data-b'); var cur=hd.parentNode.classList.contains('open'); MX.open[b]=!cur; try{ localStorage.setItem('ky_mx_open', JSON.stringify(MX.open)); }catch(_){} mxRender(); }); });
  Array.prototype.forEach.call(box.querySelectorAll('.mx-r'), function(row){ var x=mxFind(row); if(!x) return;
    row.querySelector('.mx-ck').addEventListener('click', function(){ if(!confirm('Zatvoriti na boardu '+x.label+':\n"'+x.naziv+'"?')) return; mxSave(x,{status:'Gotovo'},row,'Zatvoreno na '+x.label); });
    var n=row.querySelector('.mx-note'); n.addEventListener('keydown', function(e){ if(e.key==='Enter') this.blur(); }); n.addEventListener('change', function(){ var v=this.value.trim(); if(v!==String(x.note||'')) mxSave(x,{note:v},row); });
    var d=row.querySelector('.mx-due'); d.addEventListener('change', function(){ if(this.value!==String(x.due||'')) mxSave(x,{due:this.value},row); });
    row.querySelector('.mx-nz').addEventListener('click', function(){ mxEdit(x); }); row.querySelector('.mx-ed').addEventListener('click', function(){ mxEdit(x); });
    var sd=row.querySelector('.mx-sdue'); sd.addEventListener('change', function(){ if(this.value!==String(x.sdue||'')) mxSave(x,{sdue:this.value},row); }); });
}
var _mxRender0=render; render=function(){ _mxRender0.apply(this, arguments); try{ mxRender(); mxLoad(false); }catch(e){} };
/* ===== Mirror editor: puno uređivanje taska s projektnog boarda ===== */
var MX_OWNERS={kcep:['Dom','Boro','Tamara','Sandra','Edin','Andrej','DE savjetnik','BDO','Xela','Neodređeno'],zabica:['Davor','Silva','Ankica','AnaT','Nataša','Lucija','Dom','Neodređeno'],cm:['Dom','Tom','Lucija','Stefan','Sandra','Neodređeno'],menu:['Nino','Davor','AnaT','Ankica','Nataša','Silva','Tamara','Dom','Neodređeno'],bbt:['Dom','Davor','Nino','AnaT','Ankica','Nataša','Martina'],gastro:['Dom','Davor','Antonio','Sandi','Nino','Silva','Neodređeno'],stores:['Davor','Nino','Silva','AnaT','Ankica','Nataša','Dom','PEP tim','Neodređeno'],procurement:['Dom','Nino','Nataša','Neodređeno']};
var MX_STORES=['Arena (Zagreb)','Tkalčićeva (Zagreb)','City Center One (Split)','Supernova (Zadar)','PEP (München)','Eurovea (Bratislava)','Aupark (Bratislava)','Máj Národní (Prag)'];
function mxEdit(x){
  var own=(MX_OWNERS[x.board]||[]).slice(); if(x.owner && own.indexOf(x.owner)<0) own.unshift(x.owner);
  var sel=function(arr,cur){ return arr.map(function(o){ return '<option'+(o===cur?' selected':'')+'>'+mxEsc(o)+'</option>'; }).join(''); };
  var extra='';
  if(x.board==='stores'){ var st=MX_STORES.slice(); if(x.store && st.indexOf(x.store)<0) st.unshift(x.store);
    extra='<div class="mxe-2"><div><label>Poslovnica</label><select data-f="store"><option value="">—</option>'+sel(st,x.store)+'</select></div><div><label>Prioritet</label><select data-f="prio">'+['','P1','P2','P3'].map(function(p){ return '<option value="'+p+'"'+(p===(x.prio||'')?' selected':'')+'>'+(p||'—')+'</option>'; }).join('')+'</select></div><div><label>Trošak (EUR)</label><input data-f="cost"></div></div>'; }
  if(x.board==='procurement') extra='<label>Dobavljač</label><input data-f="store">';
  var m=document.createElement('div'); m.className='mxe-bg';
  m.innerHTML='<div class="mxe"><div class="mxe-h"><b>'+mxEsc(x.label)+'</b>'+(x.parent?'<span class="mx-par">↳ '+mxEsc(x.parent)+'</span>':'')+'<button class="mxe-x" data-x>✕</button></div>'+
    '<label>Naziv</label><input data-f="naziv">'+
    '<div class="mxe-2"><div><label>Nositelj</label><select data-f="owner">'+sel(own,x.owner)+'</select></div><div><label>Critical</label><label class="mxe-ck"><input type="checkbox" data-f="critical"'+(x.critical?' checked':'')+'> ⚑ critical</label></div></div>'+
    '<label>Next step</label><input data-f="note" placeholder="ACTION / PENDING / ON HOLD / DONE - …">'+
    '<div class="mxe-2"><div><label>Datum next stepa</label><input type="date" data-f="sdue"></div><div><label>Rok završetka</label><input type="date" data-f="due"></div></div>'+
    '<label>Opis</label><textarea data-f="opis" rows="5"></textarea>'+
    '<label>Link</label><input data-f="link" placeholder="https://…">'+extra+
    '<div class="mxe-f"><button class="btn" data-done style="margin-right:auto">✓ Zatvori task</button><button class="btn" data-x>Odustani</button><button class="btn mxe-ok" data-ok>Spremi</button></div></div>';
  document.body.appendChild(m);
  ['naziv','note','sdue','due','opis','link','store','cost'].forEach(function(f){ var n=m.querySelector('[data-f="'+f+'"]'); if(n) n.value=x[f]||''; });
  m.querySelector('[data-f="naziv"]').focus();
  function close(){ m.remove(); document.removeEventListener('keydown',esc_); }
  function esc_(e){ if(e.key==='Escape') close(); }
  document.addEventListener('keydown',esc_);
  Array.prototype.forEach.call(m.querySelectorAll('[data-x]'),function(b){ b.addEventListener('click',close); });
  m.addEventListener('mousedown',function(e){ if(e.target===m) close(); });
  m.querySelector('[data-done]').addEventListener('click',function(){ if(!confirm('Zatvoriti na boardu '+x.label+':\n"'+x.naziv+'"?')) return; close(); mxSave(x,{status:'Gotovo'},null,'Zatvoreno na '+x.label); });
  m.querySelector('[data-ok]').addEventListener('click',function(){
    var ch={};
    Array.prototype.forEach.call(m.querySelectorAll('[data-f]'),function(n){ var f=n.getAttribute('data-f');
      if(f==='critical'){ if(n.checked!==!!x.critical) ch.critical=n.checked; return; }
      var v=n.value; if(f!=='opis') v=v.trim(); else v=v.replace(/\s+$/,'');
      if(v!==String(x[f]||'')) ch[f]=v; });
    if(ch.naziv!==undefined && !ch.naziv){ banner('Naziv ne smije biti prazan'); m.querySelector('[data-f="naziv"]').focus(); return; }
    if(!Object.keys(ch).length){ close(); return; }
    if(ch.owner!==undefined && isScoped() && !confirm('Prebacuješ task na: '+ch.owner+'.\nNakon spremanja više ga nećeš vidjeti na svom boardu. Nastaviti?')) return;
    var b=m.querySelector('[data-ok]'); b.disabled=true; b.textContent='Spremam…';
    var p={action:'mupdate', board:x.board, id:x.id}; Object.keys(ch).forEach(function(k){ p[k]=(k==='critical')?String(ch[k]):ch[k]; });
    api(p).then(function(r){ if(!r||r.error){ b.disabled=false; b.textContent='Spremi'; banner('Nije spremljeno: '+((r&&r.error)||'?')); return; }
      Object.keys(ch).forEach(function(k){ x[k]=ch[k]; }); if(ch.nextstep!==undefined) x.dlv=ch.nextstep; close(); banner('Spremljeno na '+x.label); mxRender(); mxLoad(true); })
    .catch(function(e){ b.disabled=false; b.textContent='Spremi'; banner('Greška: '+e); });
  });
}
/* ===== kraj mirror editora ===== */
function pdHr(d){ if(!d) return ''; var p=d.split('-'); return (+p[2])+'.'+(+p[1])+'.'+p[0]+'.'; }
function pdTodayISO(){ var x=new Date(); return x.getFullYear()+'-'+('0'+(x.getMonth()+1)).slice(-2)+'-'+('0'+x.getDate()).slice(-2); }

/* ===== kraj mirror modula ===== */

  function kyN(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\u0111/g,'d').trim(); }
  function fmtD(ts){ var d=new Date(ts); return d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear()+'.'; }
  function staleDays(t){ if(t.done) return -1; var m=String(t.notes||'').match(/^\s*STATUS:\s*(\d{4}-\d{2}-\d{2})/im); var base=m?m[1]:((t.src==='app'&&t.created)?String(t.created).slice(0,10):null); if(!base) return null; var b=new Date(base+'T00:00:00'); var n=today0(); return Math.max(0,Math.round((n.getTime()-b.getTime())/864e5)); }
  function isStale(t){ if(t.done||t.wait==='done') return false; var d=staleDays(t); return d===null||d>=7; }
  function createdLine(t){ if(!t||!t.created) return ''; var d=new Date(t.created); if(isNaN(d.getTime())) return ''; return '<div class="screated" title="Datum upisa taska (ne mijenja se)">upisano '+fmtD(d.getTime())+'</div>'; }
  function staleBadge(t){ if(t.done||t.wait==='done') return ''; var d=staleDays(t); if(d!==null&&d<7) return ''; if(d===null) return ' <span class="stale hot" title="Nema STATUS upisa (next step nije mijenjan od uvo\u0111enja pra\u0107enja)">\u23F3 bez upisa</span>'; return ' <span class="stale'+(d>=14?' hot':'')+'" title="Zadnji upis next stepa prije '+d+' dana">\u23F3'+d+'d</span>'; }
  function rokBadge(t){ var n=(String(t.notes||'').match(/^\s*ROK:/gim)||[]).length; if(n<2) return ''; return ' <span class="rokx'+(n>=3?' hot':'')+'" title="Rok pomaknut '+n+'x">\u21BB'+n+'\u00D7</span>'; }
  function kyDefaults(){ if(window.__kyDef) return; window.__kyDef=1; setView('today'); fillQuickOwner(); if(!isScoped()){ if(Object.prototype.hasOwnProperty.call(ownerOn,'Dom')){ Object.keys(ownerOn).forEach(function(x){ ownerOn[x]=(x==='Dom'); }); buildOwnerFilters(); render(); } } }
  function closeDoneBulk(list){ if(!confirm('Zatvoriti '+list.length+' taskova ozna\u010denih DONE?')) return; var i=0, ok=0; (function next(){ if(i>=list.length){ if(!loadCompleted){ TASKS=TASKS.filter(function(x){ return !x.__closed; }); } banner('Zatvoreno '+ok+' od '+list.length); render(); return; } var t=list[i++]; banner('Zatvaram '+i+'/'+list.length+'\u2026'); api({action:'complete',taskId:t.id,done:true}).then(function(res){ if(res&&!res.error){ ok++; t.__closed=true; t.done=true; t.status='completed'; } next(); }).catch(function(){ next(); }); })(); }
  function toggleLock(t,row){ if(isScoped()) return; var nl=!t.locked; busy(row,true);
    api({action:'lock',taskId:t.id,locked:nl}).then(function(res){ busy(row,false); if(!res||res.error){ banner('Ne mogu zaklju\u010dati: '+((res&&res.error)||'?')); return; } banner(''); t.locked=nl; render(); }).catch(function(err){ busy(row,false); banner('Gre\u0161ka: '+err); }); }
  /* 16.11.2026. (D.K.): nositelji sami zatvaraju svoje taskove; zaključani (Lock) task i dalje samo javljaju DONE, zatvara ga Domagoj */
  /* 17.11.2026. (D.K.): Traži Domagoj zatvara samo Domagoj; nositelj javlja gotovo (od 18.11.2026. bez dokaza) */
  /* Kako radi Traži Domagoj (17.11.2026.): kratka pomoć za nositelje, hrvatski i engleski (PEP) */
  function openTreqHelp(){
    if(document.getElementById('treq-help-bg')) return;
    var bg=document.createElement('div'); bg.id='treq-help-bg'; bg.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px';
    bg.innerHTML='<div role="dialog" aria-label="Kako radi Traži Domagoj" style="background:var(--panel,#1a1a25);color:var(--text,#e8ebef);border:1px solid var(--line,#2c3340);border-radius:12px;max-width:600px;width:100%;max-height:88vh;overflow:auto;padding:18px 22px;font:400 13.5px/1.5 var(--body,system-ui)">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><b style="font-size:16px">Traži Domagoj: kako radi</b><span style="flex:1"></span><button id="treq-help-x" class="btn" aria-label="Zatvori">✕</button></div>'+
      '<ul style="margin:0 0 6px;padding-left:18px">'+
      '<li><b>Što je to.</b> Zahtjev koji je Domagoj tražio od tebe (mail, sastanak, poruka). Ima ljubičastu značku "Traži Domagoj".</li>'+
      '<li><b>Tko ga zatvara.</b> Samo Domagoj. Kvačica ga ne zatvara.</li>'+
      '<li><b>Kad je gotovo.</b> Klikni kvačicu ili "Javi da je gotovo". Dokaz ne treba (komentar ili link možeš dodati ako želiš). Zahtjev tada čeka Domagoja, koji ga zatvara.</li>'+
      '<li><b>Novi rok.</b> Promijeni rok i upiši razlog. Razlog ostaje u povijesti zahtjeva.</li>'+
      '<li><b>"vraćeno: ..."</b> znači da je Domagoj zahtjev vratio s komentarom. Ispravi što piše i ponovno javi da je gotovo.</li>'+
      '<li><b>Podsjetnik.</b> Svaki ponedjeljak u 7.00 dobiješ mail s otvorenim zahtjevima, s adrese projekti@koykan.com.</li></ul>'+
      '<hr style="border:0;border-top:1px solid var(--line,#2c3340);margin:12px 0"><b>English (PEP)</b>'+
      '<ul style="margin:6px 0 0;padding-left:18px">'+
      '<li><b>What it is.</b> A request Domagoj made to you. It has a purple "Traži Domagoj" badge. Only he closes it; the checkbox does not.</li>'+
      '<li><b>When done.</b> Click the checkbox or "Javi da je gotovo" (report done). No proof needed (you may add a comment or link). The request then waits for Domagoj, who closes it.</li>'+
      '<li><b>New due date.</b> Change the date and give a reason. The reason stays in the request history.</li>'+
      '<li><b>"vraćeno: ..."</b> means Domagoj returned it with a comment. Fix it and report done again.</li>'+
      '<li><b>Reminder.</b> Every Monday at 7.00 you get an email with your open requests from projekti@koykan.com.</li></ul></div>';
    function close(){ if(bg.parentNode) bg.parentNode.removeChild(bg); document.removeEventListener('keydown',esc); }
    function esc(e){ if(e.key==='Escape') close(); }
    bg.addEventListener('click',function(e){ if(e.target===bg) close(); });
    bg.querySelector('#treq-help-x').addEventListener('click',close);
    document.addEventListener('keydown',esc);
    document.body.appendChild(bg);
  }
  document.addEventListener('click',function(e){ var a=e.target.closest&&e.target.closest('[data-treqhelp]'); if(a){ e.preventDefault(); e.stopPropagation(); openTreqHelp(); } },true);
  /* 18.11.2026. (Dom): gotovo se javlja jednim klikom, dokaz ne treba; u ploči se može dodati komentar ili link (nije obavezno) */
  function reportDone(t,row,ask){ var v=''; if(ask){ v=prompt('Javi da je gotovo. Komentar ili link (nije obavezno):',''); if(v===null) return; v=v.trim(); } if(row) busy(row,true);
    var q={action:'report',taskId:t.id}; if(v){ if(v.indexOf('https://')===0 && v.indexOf(' ')<0) q.proof=v; else q.text=v; }
    api(q).then(function(res){ if(row) busy(row,false); if(!res||res.error){ banner('Nije javljeno: '+((res&&res.error)||'?')); return; } banner(''); toast('Javljeno gotovo. Zatvara Domagoj.'); load(); }).catch(function(e){ if(row) busy(row,false); banner('Greška: '+e); }); }
  function returnTask(t,row){ var c=prompt('Vrati nositelju. Što fali?',''); if(c===null) return; c=c.trim(); if(!c){ toast('Vraćanje traži komentar.'); return; } if(row) busy(row,true);
    api({action:'return',taskId:t.id,comment:c}).then(function(res){ if(row) busy(row,false); if(!res||res.error){ banner('Nije vraćeno: '+((res&&res.error)||'?')); return; } banner(''); toast('Vraćeno: '+t.owner); load(); }).catch(function(e){ if(row) busy(row,false); banner('Greška: '+e); }); }
  function toggle(t,row){ var nd=!t.done; if(nd&&isScoped()&&t.req){ if(t.wait!=='done'){ reportDone(t,row,false); } else toast('Javljeno gotovo, čeka Domagoja.'); return; } if(nd&&isScoped()&&t.locked){ if(t.wait!=='done'){ setWait(t,row,'done'); toast('Zaključani task: javljeno da je gotovo. Zatvara ga Domagoj.'); } return; } busy(row,true);
    api({action:'complete',taskId:t.id,done:nd}).then(function(res){ busy(row,false); if(!res||res.error){ banner('Ne mogu promijeniti task: '+((res&&res.error)||'?')); return; }
      banner(''); t.done=nd; t.status=nd?'completed':'needsAction'; if(!loadCompleted && nd){ TASKS=TASKS.filter(function(x){return x.id!==t.id;}); } render();
    }).catch(function(err){ busy(row,false); banner('Greška: '+err); }); }
  function rename(t,row,newOwner){ var px=PREFIX[newOwner]||newOwner; busy(row,true);
    api({action:'update',taskId:t.id,title:makeTitle(px,t.title,t.isProject)}).then(function(res){ busy(row,false); if(!res||res.error){ banner('Ne mogu preimenovati: '+((res&&res.error)||'?')); return; }
      banner(''); t.prefix=px; t.owner=MAP[px]||px; buildOwnerFilters(); render();
    }).catch(function(err){ busy(row,false); banner('Greška: '+err); }); }
  function toggleProject(t,row){ var np=!t.isProject; busy(row,true);
    api({action:'update',taskId:t.id,title:makeTitle(t.prefix,t.title,np)}).then(function(res){ busy(row,false); if(!res||res.error){ banner('Ne mogu označiti projekt: '+((res&&res.error)||'?')); return; }
      banner(''); t.isProject=np; render();
    }).catch(function(err){ busy(row,false); banner('Greška: '+err); }); }
  function toggleFokus(t,row){ if(isScoped()) return; var on=!t.fokus; var jobs=[];
    var upd=function(x,rest){ var notes=buildNotes(x.nextText,x.nextDate,rest,x.critical,x.link); return api({action:'update',taskId:x.id,notes:notes}).then(function(res){ if(!res||res.error) throw new Error((res&&res.error)||'?'); x.rest=rest; x.notes=notes; x.fokus=fokusOf(rest,x.owner); }); };
    if(on){ TASKS.forEach(function(x){ if(x!==t && !x.done && x.fokus && x.fokus===t.owner) jobs.push(upd(x,setFokusLine(x.rest,false))); }); jobs.push(upd(t,setFokusLine(t.rest,true))); } else jobs.push(upd(t,setFokusLine(t.rest,false)));
    busy(row,true); Promise.all(jobs).then(function(){ busy(row,false); banner(''); render(); }).catch(function(err){ busy(row,false); banner('Ne mogu promijeniti fokus: '+err.message); render(); }); }
  function toggleCritical(t,row){ var nc=!t.critical; var notes=buildNotes(t.nextText,t.nextDate,t.rest,nc,t.link); busy(row,true);
    api({action:'update',taskId:t.id,notes:notes}).then(function(res){ busy(row,false); if(!res||res.error){ banner('Ne mogu označiti critical: '+((res&&res.error)||'?')); return; }
      banner(''); t.critical=nc; t.notes=notes; render();
    }).catch(function(err){ busy(row,false); banner('Greška: '+err); }); }

  function toggleWait(t,row,anchor){ statusMenu(t,row,anchor||row); }   /* c5: status samo s popisa (izbornik), ne kruženjem */
  function setWait(t,row,nw){ if(isScoped()&&t.req&&nw==='done'&&t.wait!=='done'){ reportDone(t,row,false); return; } if(isScoped()&&t.req&&t.wait==='done'){ toast('Javljeno gotovo, vraća ga samo Domagoj.'); return; } var prev={wait:t.wait, notes:t.notes}; t.wait=nw; paintWait(row,nw); api({action:'update',taskId:t.id,step_status:WLBL[nw]||''}).then(function(res){ if(!res||res.error){ t.wait=prev.wait; t.notes=prev.notes; paintWait(row,prev.wait); banner('Nije spremljeno: '+((res&&(res.message||res.error))||'?')); } else { if(res.notes!==undefined) t.notes=res.notes||''; banner(''); render(); } }).catch(function(err){ t.wait=prev.wait; paintWait(row,prev.wait); banner('Greska: '+err); }); }

  function _d10(){ var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function _stampStatus(rest){ var ls=String(rest||'').split('\n').filter(function(l){ return !/^\s*STATUS:\s*\d{4}-\d{2}-\d{2}\s*$/i.test(l); }); return ('STATUS: '+_d10()+'\n'+ls.join('\n')).replace(/\n+$/,''); }
  function _fmtD(x){ if(!x) return '-'; try{ var d=new Date(x); if(isNaN(d.getTime())) return '-'; return ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear(); }catch(e){ return '-'; } }
  function _stampRok(rest,st,no){ return ('ROK: '+_d10()+' '+_fmtD(st)+' -> '+_fmtD(no)+'\n'+String(rest||'')).replace(/\n+$/,''); }
  /* ---- v7 pojednostavljeno (4.11.2026.): gotovi pogledi, status iz izbornika, bočna ploča, brzi unos ---- */
  var VIEWS={ today:{w:'tilltoday',a:'notdone',d:'all'}, week:{w:'week',a:'notdone',d:'all'}, wait:{w:'all',a:'waiting',d:'all'}, done:{w:'all',a:'done',d:'all'}, req:{w:'all',a:'all',d:'all'}, tim:{w:'all',a:'all',d:'all'}, all:{w:'all',a:'all',d:'all'} };
  var WHINT={action:'radi se na tome',pending:'čeka nekog drugog',hold:'pauzirano',done:'gotovo, Domagoj zatvara','':'bez statusa'}, WDOT={action:'d-act',pending:'d-pend',hold:'d-hold',done:'d-done','':'d-none'};
  function setView(v){ var c=VIEWS[v]; if(!c) return; winFilter=c.w; waitFilter=c.a; timMode=(v==='tim'); reqMode=(v==='req');
    [['win-seg','w',c.w],['wait-seg','a',c.a]].forEach(function(s){ Array.prototype.forEach.call(el(s[0]).children,function(b){ b.classList.toggle('on', b.dataset[s[1]]===s[2]); }); });
    Array.prototype.forEach.call(el('views').children,function(b){ b.classList.toggle('on', b.dataset.v===v); });
    render(); }
  /* bez upisa: nositelj nije mijenjao next step 14+ dana (STATUS: pečat; bez pečata se računa kao bez upisa) */
  function isStale14(t){ if(t.done||t.wait==='done') return false; var d=staleDays(t); return d===null||d>=14; }
  function stale14Badge(t){ if(!isStale14(t)) return ''; var d=staleDays(t); return ' <span class="stl14" title="Next step nije mijenjan '+(d===null?'od uvođenja praćenja':d+' dana')+'">'+(d===null?'bez upisa':d+' d bez upisa')+'</span>'; }
  function copyText(s){ function ok(){ toast('Kopirano: '+s); }
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(s).then(ok).catch(function(){ fallbackCopy(s,ok); }); } else fallbackCopy(s,ok); }

  /* pregled Tim: jedan red po nositelju (glavni board + projektni boardovi s rokom) */
  function renderTim(grid){ var G={}, td=pdTodayISO(), t0=today0();
    function g(o){ return G[o]=G[o]||{open:0,over:0,rokx:0,stale:0,mx:0,mxOver:0}; }
    TASKS.forEach(function(t){ if(t.done||t.owner==='Private') return; var r=g(t.owner); r.open++; if(isOverdue(t)) r.over++;
      if((String(t.notes||'').match(/^\s*ROK:/gim)||[]).length>=2) r.rokx++; if(isStale14(t)) r.stale++; });
    (MX.items||[]).forEach(function(x){ var o=mxOwner(x.owner); if(!o||o==='Private') return; var r=g(o); r.mx++; if(mxD(x) && new Date(mxD(x)+'T00:00:00')<t0) r.mxOver++; });
    var names=Object.keys(G).sort(function(a,b){ return (G[b].over+G[b].mxOver)-(G[a].over+G[a].mxOver) || a.localeCompare(b,'hr'); });
    function c(n,bad){ return '<td class="'+(n&&bad?'bad':(n?'':'zero'))+'">'+n+'</td>'; }
    var h='<table class="tim"><thead><tr><th>Nositelj</th><th>Otvoreno</th><th>Kasni</th><th>Rok pomaknut 2+ puta</th><th>Bez upisa 14+ d</th><th>Projektni boardovi</th><th>Od toga kasni</th></tr></thead><tbody>';
    names.forEach(function(n){ var r=G[n]; h+='<tr data-o="'+escapeAttr(n)+'"><td class="nm">'+escapeHtml(n)+'</td>'+c(r.open)+c(r.over,1)+c(r.rokx,1)+c(r.stale,1)+c(r.mx)+c(r.mxOver,1)+'</tr>'; });
    h+='</tbody></table><div class="tim-n">Klik na red otvara sve taskove tog nositelja.'+(MX.ts?'':' Projektni boardovi se još učitavaju.')+'</div>';
    var card=document.createElement('div'); card.className='card tim-card'; card.innerHTML=h; grid.className='grid solo'; grid.appendChild(card);
    Array.prototype.forEach.call(card.querySelectorAll('tr[data-o]'),function(tr){ tr.addEventListener('click',function(){ var o=tr.getAttribute('data-o'); Object.keys(ownerOn).forEach(function(x){ ownerOn[x]=(x===o); }); critOnly=ovrOnly=staleOnly=false; buildOwnerFilters(); setView('all'); }); });
    if(!MX.ts) mxLoad(false); }

  /* ===== Traži Domagoj: pregled svih zahtjeva po nositeljima (17.11.2026., zamjenjuje "Duguju mi") ===== */
  var reqMode=false, reqF='all', reqOwner='';
  /* sortiranje tablice klikom na zaglavlje (Dom 23.11.2026.); bez odabira vrijedi izbornik Sortiraj (Nositelj, Task, Rok, Status) */
  var reqSort={by:'',dir:1}; try{ var _rs=JSON.parse(localStorage.getItem('ky_req_sort')||'{}'); if(_rs&&_rs.by) reqSort={by:String(_rs.by),dir:_rs.dir===-1?-1:1}; }catch(e){}
  var REQ_STR={reported:0,returned:1,open:2};
  function reqActiveSort(){ if(reqSort.by) return reqSort; var g={owner:'owner',title:'title',due:'due',status:'st'}[SORT.by]; return g?{by:g,dir:SORT.dir}:null; }
  function reqVal(x,by){ var t=x.t,i=x.i; if(by==='owner') return t.owner||null; if(by==='title') return t.title||null; if(by==='due') return i.due||null; if(by==='st') return REQ_STR[i.st]; if(by==='link') return t.proof?0:1; if(by==='late') return i.late; if(by==='rk') return i.rk; return null; }
  function reqSetSort(by){ reqSort=(reqSort.by===by)?{by:by,dir:-reqSort.dir}:{by:by,dir:1}; try{ localStorage.setItem('ky_req_sort',JSON.stringify(reqSort)); }catch(e){} render(); }
  function reqISO(d){ return d?(d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)):''; }
  function reqInfo(t){ var td=pdTodayISO(), due=reqISO(t.due), late=0;
    if(due&&due<td) late=Math.round((new Date(td+'T12:00:00')-new Date(due+'T12:00:00'))/864e5);
    var ns=String(t.nextText||'').replace(/^\s*(ACTION|PENDING|ON HOLD|DONE)\s*[-–—:]*\s*/i,'');
    var st=(t.wait==='done')?'reported':(/^vraćeno:/i.test(ns)?'returned':'open');
    var rk=(String(t.notes||'').match(/rok promijenjen s /gi)||[]).length;
    return {due:due,late:late,st:st,rk:rk,ns:ns}; }
  function renderReq(grid){
    var all=TASKS.filter(function(t){ return t.req && !t.done; }).map(function(t){ return {t:t,i:reqInfo(t)}; });
    var nRep=all.filter(function(x){ return x.i.st==='reported'; }).length, nEsc=all.filter(function(x){ return x.i.late>7||x.i.rk>=2; }).length;
    var owners={}; all.forEach(function(x){ owners[x.t.owner]=(owners[x.t.owner]||0)+1; });
    var rows=all.filter(function(x){ if(reqOwner && x.t.owner!==reqOwner) return false; if(searchQ && norm(x.t.title+' '+(x.i.ns||'')+' '+(x.t.owner||'')).indexOf(searchQ)<0) return false; if(reqF==='reported') return x.i.st==='reported'; if(reqF==='esc') return x.i.late>7||x.i.rk>=2; return true; });
    rows.sort(function(a,b){ var ra=a.i.st==='reported'?0:1, rb=b.i.st==='reported'?0:1; if(ra!==rb) return ra-rb; return (b.i.late-a.i.late)||(a.i.due||'9').localeCompare(b.i.due||'9'); });
    var _ras=reqActiveSort(); if(_ras) rows.sort(function(a,b){ var x=reqVal(a,_ras.by), y=reqVal(b,_ras.by); if(x===null||y===null) return (x===null)-(y===null); var c=(typeof x==='string')?x.localeCompare(y,'hr'):(x-y); return c*_ras.dir; });
    function rth(k,lbl){ var on=_ras&&_ras.by===k; return '<th class="rsort'+(on?' on':'')+'" data-rs="'+k+'" title="Sortiraj po: '+lbl+'">'+lbl+(on?(_ras.dir===1?' ↑':' ↓'):'')+'</th>'; }
    var STL={open:'otvoreno',reported:'javljeno gotovo',returned:'vraćeno'};
    function fb(k,lbl,n){ return '<button data-rf="'+k+'" class="'+(reqF===k?'on':'')+'">'+lbl+' <span class="cc">'+n+'</span></button>'; }
    var h='<div class="req-bar"><div class="seg">'+fb('all','Sve',all.length)+fb('reported','Javljeno gotovo',nRep)+fb('esc','Eskalacije',nEsc)+'</div>'+
      '<select class="req-own"><option value="">Svi nositelji</option>'+Object.keys(owners).sort(function(a,b){ return a.localeCompare(b,'hr'); }).map(function(o){ return '<option value="'+escapeAttr(o)+'"'+(o===reqOwner?' selected':'')+'>'+escapeHtml(o)+' ('+owners[o]+')</option>'; }).join('')+'</select>'+
      '<span class="req-hint">Eskalacija: kasni više od 7 dana ili je rok pomaknut 2+ puta.</span></div>';
    if(!rows.length){ h+='<div class="ge-empty">'+(searchQ?'Ništa ne odgovara pretrazi.':'Nema otvorenih zahtjeva.')+'</div>'; }
    else {
      h+='<div class="req-wrap"><table class="tim req"><thead><tr>'+rth('owner','Nositelj')+rth('title','Zahtjev')+rth('due','Rok')+rth('st','Status')+rth('link','Link')+rth('late','Kasni')+rth('rk','Rok pomaknut')+'<th></th></tr></thead><tbody>';
      rows.forEach(function(x,ix){ var t=x.t, i=x.i;
        h+='<tr data-ix="'+ix+'"'+(i.st==='reported'?' class="rep"':'')+'><td class="nm">'+escapeHtml(t.owner)+'</td>'+
          '<td><a href="#" class="req-open">'+escapeHtml(t.title)+'</a><div class="req-ns">'+escapeHtml(i.ns)+'</div></td>'+
          '<td>'+(i.due?pdHr(i.due):'-')+'</td><td class="st-'+i.st+'">'+STL[i.st]+'</td>'+
          '<td>'+(t.proof?'<a target="_blank" rel="noopener" href="'+escapeAttr(t.proof)+'">otvori</a>':'-')+'</td>'+
          '<td class="'+(i.late>7?'bad':(i.late?'':'zero'))+'">'+(i.late?i.late+' d':'-')+'</td>'+
          '<td class="'+(i.rk>=2?'bad':(i.rk?'':'zero'))+'">'+(i.rk||'-')+'</td>'+
          '<td class="req-act"><button class="btn req-close" title="Zatvori zahtjev (odobreno)">✓ Zatvori</button> <button class="btn req-ret" title="Vrati nositelju s komentarom">↩ Vrati</button></td></tr>'; });
      h+='</tbody></table></div>';
    }
    var card=document.createElement('div'); card.className='card tim-card req-card'; card.innerHTML=h; grid.className='grid solo'; grid.appendChild(card);
    Array.prototype.forEach.call(card.querySelectorAll('[data-rf]'),function(b){ b.addEventListener('click',function(){ reqF=b.getAttribute('data-rf'); render(); }); });
    var sel=card.querySelector('.req-own'); if(sel) sel.addEventListener('change',function(){ reqOwner=sel.value; render(); });
    Array.prototype.forEach.call(card.querySelectorAll('th[data-rs]'),function(th){ th.addEventListener('click',function(){ reqSetSort(th.getAttribute('data-rs')); }); });
    Array.prototype.forEach.call(card.querySelectorAll('tr[data-ix]'),function(tr){ var x=rows[Number(tr.getAttribute('data-ix'))], t=x.t;
      tr.querySelector('.req-open').addEventListener('click',function(e){ e.preventDefault(); openDrawer(t,tr); });
      tr.querySelector('.req-ret').addEventListener('click',function(){ returnTask(t,null); });
      tr.querySelector('.req-close').addEventListener('click',function(){ if(!confirm('Zatvoriti zahtjev za '+t.owner+':\n"'+t.title+'"?')) return;
        api({action:'complete',taskId:t.id,done:true}).then(function(res){ if(!res||res.error){ banner('Nije zatvoreno: '+((res&&res.error)||'?')); return; } banner(''); t.done=true; t.status='completed'; TASKS=TASKS.filter(function(y){ return y.id!==t.id; }); toast('Zatvoreno: '+t.owner); render(); }).catch(function(e){ banner('Greška: '+e); }); }); });
  }
  /* ===== Opis na prelazak mišem preko naslova (17.11.2026.); klik i dalje otvara bočnu ploču ===== */
  (function(){ var tip=null, showT=null, hideT=null;
    function clean(t){ return String(t.rest||'').split('\n').filter(function(l){ return !/^\s*(STATUS|ROK|LINK|IZVOR|FOKUS)\b/i.test(l) && !/^\s*TRAŽI DOMAGOJ\s*$/i.test(l); }).join('\n').trim(); }
    function hide(){ clearTimeout(showT); clearTimeout(hideT); if(tip){ tip.remove(); tip=null; } }
    function later(){ clearTimeout(hideT); hideT=setTimeout(hide,250); }
    document.addEventListener('mouseover',function(e){ var s=e.target.closest&&e.target.closest('.srow .stitle'); if(!s) return; var row=s.closest('.srow'); var t=row&&row.__kyT; if(!t) return;
      clearTimeout(hideT); if(tip && tip.__t===t) return; clearTimeout(showT);
      showT=setTimeout(function(){ hide(); var txt=clean(t); tip=document.createElement('div'); tip.className='ky-tip'; tip.__t=t;
        tip.innerHTML='<div class="ky-tip-h">'+escapeHtml(t.title)+'</div><div class="ky-tip-b">'+(txt?escapeHtml(txt):'<span class="drw-mute">Bez opisa.</span>')+'</div>';
        document.body.appendChild(tip); var r=s.getBoundingClientRect(), w=Math.min(480,window.innerWidth-24); tip.style.width=w+'px';
        var left=Math.max(12,Math.min(r.left,window.innerWidth-w-12)), top=r.bottom+6; if(top+tip.offsetHeight>window.innerHeight-8) top=Math.max(8,r.top-tip.offsetHeight-6);
        tip.style.left=left+'px'; tip.style.top=top+'px';
        tip.addEventListener('mouseenter',function(){ clearTimeout(hideT); }); tip.addEventListener('mouseleave',later); },350); });
    document.addEventListener('mouseout',function(e){ var s=e.target.closest&&e.target.closest('.srow .stitle'); if(s) { clearTimeout(showT); later(); } });
    document.addEventListener('scroll',function(e){ if(tip && !tip.contains(e.target)) hide(); },true);
    document.addEventListener('click',function(e){ if(tip && !tip.contains(e.target)) hide(); },true);
  })();
  /* sortiranje (6.11.2026.): po statusu, nazivu, datumu next stepa, roku, nositelju; prazno uvijek na dnu */
  var SORT={by:'',dir:1}; try{ var _so=JSON.parse(localStorage.getItem('ky_sort')||'{}'); if(_so&&_so.by) SORT={by:String(_so.by),dir:_so.dir===-1?-1:1}; }catch(e){}
  var WRANK={action:0,pending:1,hold:2,done:3};
  function sortVal(t,by){ if(by==='status') return (t.wait in WRANK)?WRANK[t.wait]:null; if(by==='title') return t.title||null; if(by==='owner') return t.owner||null; if(by==='nexttext'){ var _ns=String(t.nextText||'').replace(/^\s*(ACTION|PENDING|ON HOLD|DONE)\s*[-–—:]*\s*/i,'').trim(); return _ns||null; }
    var d=by==='next'?t.nextDate:t.due; return d?new Date(d).setHours(0,0,0,0):null; }
  function sortCmp(a,b){ var x=sortVal(a,SORT.by), y=sortVal(b,SORT.by); if(x===null||y===null) return (x===null)-(y===null);
    var c=(typeof x==='string')?x.localeCompare(y,'hr'):(x-y); return c*SORT.dir; }
  function setSort(by,dir){ if(dir===undefined) dir=(SORT.by===by)?-SORT.dir:1; SORT={by:by,dir:by?dir:1}; try{ localStorage.setItem('ky_sort',JSON.stringify(SORT)); }catch(e){} reqSort={by:'',dir:1}; try{ localStorage.removeItem('ky_req_sort'); }catch(e){} paintSort(); render(); }
  function paintSort(){ var s=el('sort-by'), d=el('sort-dir'); if(!s) return; s.value=SORT.by; d.style.visibility=SORT.by?'visible':'hidden'; d.textContent=SORT.dir===1?'↑':'↓'; d.title=SORT.dir===1?'Uzlazno (klik: obrni)':'Silazno (klik: obrni)'; }
  function sortHead(cls,by,lbl){ var on=SORT.by===by; return '<span class="'+cls+' sorth'+(on?' on':'')+'" data-s="'+by+'" title="Sortiraj po: '+lbl+'">'+lbl+(on?(SORT.dir===1?' ↑':' ↓'):'')+'</span>'; }

  function toast(m){ var x=el('ky-toast'); if(!x){ x=document.createElement('div'); x.id='ky-toast'; document.body.appendChild(x); } x.textContent=m; x.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(function(){ x.classList.remove('show'); },3500); }

  function closeMenu(){ var m=document.querySelector('.stmenu'); if(m) m.remove(); document.removeEventListener('click',closeMenu); }
  function statusMenu(t,row,anchor){ closeMenu(); var m=document.createElement('div'); m.className='stmenu';
    ['action','pending','hold','done',''].forEach(function(w){ var b=document.createElement('button'); b.className=((t.wait||'')===w?'cur':'');
      b.innerHTML='<i class="dot '+WDOT[w]+'"></i><b>'+(WLBL[w]||'—')+'</b><span>'+WHINT[w]+'</span>';
      b.addEventListener('click',function(e){ e.stopPropagation(); closeMenu(); if((t.wait||'')!==w) setWait(t,row,w); }); m.appendChild(b); });
    document.body.appendChild(m); var r=anchor.getBoundingClientRect(); var top=r.bottom+4; if(top+m.offsetHeight>window.innerHeight-8) top=r.top-m.offsetHeight-4;
    m.style.left=Math.max(8,Math.min(r.left,window.innerWidth-m.offsetWidth-8))+'px'; m.style.top=top+'px';
    setTimeout(function(){ document.addEventListener('click',closeMenu); },0); }

  function closeDrawer(){ var d=document.querySelector('.drw'), b=document.querySelector('.drw-bg'); if(d) d.remove(); if(b) b.remove(); document.removeEventListener('keydown',drwEsc); }
  function drwEsc(e){ if(e.key==='Escape') closeDrawer(); }
  function openDrawer(t,row){ closeDrawer(); var adm=!isScoped(), lockDue=t.locked&&!adm, dw=t.wait||'';
    var base=t.nextText||'';
    var bg=document.createElement('div'); bg.className='drw-bg'; var d=document.createElement('aside'); d.className='drw';
    d.innerHTML='<div class="drw-h"><span class="drw-own">'+escapeHtml(t.owner)+'</span><button class="drw-x" aria-label="Zatvori">✕</button></div>'+
      '<textarea class="drw-title" rows="2" data-f="title"></textarea>'+
      '<label>Status</label><div class="drw-st">'+['action','pending','hold','done'].map(function(w){ return '<button data-w="'+w+'" class="'+WCLS[w]+(dw===w?' on':'')+'" title="'+WHINT[w]+'">'+WLBL[w]+'</button>'; }).join('')+'</div>'+
      '<label>Next step</label><input data-f="nx" placeholder="što je sljedeći korak">'+
      '<div class="drw-2"><div><label>Rok'+(t.locked?' (zaključan)':'')+'</label><input type="date" data-f="due"'+(lockDue?' disabled title="Rok zaključao Domagoj"':'')+'></div>'+'<div><label>Datum next stepa</label><input type="date" data-f="nd"></div>'+'</div>'+
      (adm?'<label class="drw-ck"><input type="checkbox" data-f="lock"'+(t.locked?' checked':'')+'> Zaključaj rok (nositelj ga ne može mijenjati)</label>':'')+
      '<label>Opis</label><textarea data-f="rest" rows="7" placeholder="bilješke, kontekst, dogovori"></textarea>'+
      '<label>Link</label><div class="drw-link"><input data-f="link" placeholder="https://...">'+(t.link?'<a class="btn" target="_blank" rel="noopener">Otvori</a>':'')+'</div>'+
      '<div class="drw-2">'+(adm?'<div><label>Nositelj</label><select data-f="owner">'+ownerOpts(t.prefix)+'</select></div>':'')+'<div><label>Oznake</label><label class="drw-ck"><input type="checkbox" data-f="crit"'+(t.critical?' checked':'')+'> Critical</label>'+(adm?'<label class="drw-ck"><input type="checkbox" data-f="proj"'+(t.isProject?' checked':'')+'> Projekt</label>':'')+'</div></div>'+
      (t.created?'<div class="drw-meta">Upisano '+fmtD(new Date(t.created).getTime())+'</div>':'')+
      (t.req?'<div class="drw-meta"><span class="treq">Traži Domagoj</span><a class="treq-how" data-treqhelp="1" href="#">Kako radi?</a>'+(t.proof?' Link: <a target="_blank" rel="noopener" href="'+escapeAttr(t.proof)+'">otvori</a>':'')+'</div>':'')+
      (adm&&t.owner!=='Dom'&&t.owner!=='Private'?'<label class="drw-ck"><input type="checkbox" data-f="treq"'+(t.req?' checked':'')+'> Traži Domagoj (nositelj ne zatvara, javlja gotovo jednim klikom)</label>':'')+
      '<div class="drw-f">'+(t.req&&!adm?(t.wait==='done'?'<span class="drw-mute">Javljeno gotovo, čeka Domagoja</span>':'<button class="btn drw-repbtn">✓ Javi da je gotovo</button>'):'')+(t.req&&adm?'<button class="btn drw-retbtn">↩ Vrati s komentarom</button>':'')+((t.req&&!adm)?'':(adm||!t.locked)?'<button class="btn drw-close" title="Zatvara task (makne ga s boarda)">✓ Zatvori task</button>':(t.wait==='done'?'<span class="drw-mute">Javljeno gotovo, čeka Domagoja</span>':'<button class="btn drw-donebtn">✓ Javi da je gotovo</button>'))+'<span class="spacer"></span><button class="btn drw-cancel">Odustani</button><button class="btn add drw-save">Spremi</button></div>';
    function f(k){ return d.querySelector('[data-f="'+k+'"]'); }
    f('title').value=t.title; f('nx').value=base; f('due').value=dateInputVal(t.due); if(f('nd')) f('nd').value=dateInputVal(t.nextDate);
    f('rest').value=bodyOf(t.rest); f('rest').parentNode.insertBefore(histBox(t.rest), f('rest').nextSibling); f('link').value=t.link||'';
    var la=d.querySelector('.drw-link a'); if(la){ var lh=t.link; if(!/^https?:\/\//i.test(lh)) lh='https://'+lh; la.href=lh; }
    Array.prototype.forEach.call(d.querySelectorAll('.drw-st button'),function(b){ b.addEventListener('click',function(){ dw=(dw===b.dataset.w)?'':b.dataset.w; Array.prototype.forEach.call(d.querySelectorAll('.drw-st button'),function(y){ y.classList.toggle('on',y.dataset.w===dw); }); }); });
    document.body.appendChild(bg); document.body.appendChild(d); document.addEventListener('keydown',drwEsc);
    bg.addEventListener('click',closeDrawer); d.querySelector('.drw-x').addEventListener('click',closeDrawer); d.querySelector('.drw-cancel').addEventListener('click',closeDrawer);
    var cb=d.querySelector('.drw-close'); if(cb) cb.addEventListener('click',function(){ closeDrawer(); toggle(t,row); });
    var db=d.querySelector('.drw-donebtn'); if(db) db.addEventListener('click',function(){ dw='done'; save(); });
    var rp=d.querySelector('.drw-repbtn'); if(rp) rp.addEventListener('click',function(){ closeDrawer(); reportDone(t,row,true); });
    var rt=d.querySelector('.drw-retbtn'); if(rt) rt.addEventListener('click',function(){ closeDrawer(); returnTask(t,row); });
    d.querySelector('.drw-save').addEventListener('click',save);
    function save(){
      var title=f('title').value.replace(/\s+/g,' ').trim(); if(!title){ f('title').focus(); return; }
      var nx=stripSlot(f('nx').value.trim()), stCh=(dw||'')!==(t.wait||'');
      var nd=f('nd')?fromInput(f('nd').value):t.nextDate, due=lockDue?t.due:fromInput(f('due').value);
      var rest=keepHist(t.rest,f('rest').value.replace(/\s+$/,'')), link=f('link').value.trim(), crit=f('crit').checked;
      var px=adm?f('owner').value||t.prefix:t.prefix, proj=adm?f('proj').checked:t.isProject, lock=adm?f('lock').checked:t.locked;
      var nxCh=nx!==(t.nextText||''), dueCh=!lockDue && dateInputVal(due)!==dateInputVal(t.due);
      if(nxCh||stCh) rest=_stampStatus(rest); if(dueCh) rest=_stampRok(rest,t.due,due);
      var notesCh=nxCh||dueCh||dateInputVal(nd)!==dateInputVal(t.nextDate)||rest!==(t.rest||'')||crit!==!!t.critical||link!==(t.link||'');
      var notes=notesCh?buildNotes(nx,nd,rest,crit,link):t.notes, nt=makeTitle(px,title,proj);
      var calls=[], p={action:'update',taskId:t.id};
      if(nt!==makeTitle(t.prefix,t.title,t.isProject)) p.title=nt; if(notesCh) p.notes=notes; if(dueCh) p.due=due?toISODate(due):''; if(stCh) p.step_status=WLBL[dw]||'';
      if(dueCh&&t.req&&!adm){ var _r=(prompt('Za novi rok upiši razlog (zašto trebaš više vremena):','')||'').trim(); if(!_r) return; p.reason=_r; }
      
      if(p.title||p.notes||dueCh||stCh) calls.push(p);
      if(adm&&f('treq')&&f('treq').checked!==!!t.req) calls.push({action:'trazi',taskId:t.id,on:f('treq').checked});
      if(lock!==!!t.locked) calls.push({action:'lock',taskId:t.id,locked:lock});
      if(!calls.length){ closeDrawer(); return; }
      var sb=d.querySelector('.drw-save'); sb.disabled=true; sb.textContent='Spremam...';
      (function step(i){ if(i>=calls.length){ var oc=(px!==t.prefix);
          t.title=title; t.prefix=px; t.owner=MAP[px]||px; t.isProject=proj; t.nextText=nx; t.wait=dw||''; t.nextDate=nd; t.due=due; t.rest=rest; t.critical=crit; t.link=link; t.notes=notes; t.locked=lock;
          if(adm&&f('treq')) t.req=f('treq').checked;
          closeDrawer(); if(oc) buildOwnerFilters(); render(); toast(oc?'Spremljeno, task prebačen na '+t.owner:'Spremljeno'); return; }
        api(calls[i]).then(function(res){ if(!res||res.error){ sb.disabled=false; sb.textContent='Spremi'; banner('Nije spremljeno: '+((res&&(res.message||res.error))||'?')); load(); return; } step(i+1); })
          .catch(function(e){ sb.disabled=false; sb.textContent='Spremi'; banner('Greška: '+e); }); })(0);
    }
    setTimeout(function(){ f('nx').focus(); },30);
  }

  function nextWorkday(add){ var x=today0(); x.setDate(x.getDate()+add); while(x.getDay()===0||x.getDay()===6) x.setDate(x.getDate()+1); return x; }
  function scopedPrefix(){ var c={}, best=''; TASKS.forEach(function(t){ if(t.prefix) c[t.prefix]=(c[t.prefix]||0)+1; }); Object.keys(c).forEach(function(k){ if(!best||c[k]>c[best]) best=k; }); return best; }
  function fillQuickOwner(){ var s=el('q-owner'); if(isScoped()){ s.style.display='none'; return; } s.innerHTML=ownerOpts('Dom'); }
  function quickAdd(){ var inp=el('q-title'), naziv=inp.value.replace(/\s+/g,' ').trim(); if(!naziv){ inp.focus(); return; }
    var px=isScoped()?scopedPrefix():(el('q-owner').value||'Dom');
    var due=nextWorkday((isScoped()||px==='Dom'||px==='Private')?0:1); // svoj task: rok danas; tuđi: sljedeći radni dan
    inp.disabled=true;
    api({action:'add', title:makeTitle(px,naziv,false), step_status:'ACTION', due:toISODate(due)}).then(function(res){ inp.disabled=false;
      if(!res||res.error){ banner('Ne mogu dodati: '+((res&&res.error)||'?')); return; }
      inp.value=''; inp.focus(); toast('Dodano za '+(MAP[px]||px||'tebe')+', rok '+fmtFull(due)); load();
    }).catch(function(e){ inp.disabled=false; banner('Greška: '+e); }); }

  function markProjectsBatch(){
    var cand=TASKS.filter(function(t){ if(t.isProject||t.done) return false; var nt=norm(t.title); return PROJECT_HINTS.some(function(h){ return nt.indexOf(norm(h))>=0; }); });
    if(cand.length===0){ banner('Nema novih kandidata za projekt (ili su već označeni).'); return; }
    if(!confirm('Dodati A_ na '+cand.length+' taskova prepoznatih kao projekti?')) return;
    var i=0; (function step(){ if(i>=cand.length){ banner('Označeno '+cand.length+' projekata.'); render(); return; }
      var t=cand[i++]; api({action:'update',taskId:t.id,title:makeTitle(t.prefix,t.title,true)}).then(function(res){ if(res&&!res.error){ t.isProject=true; } step(); }).catch(function(){ step(); }); })();
  }

  function busy(row,on){ if(on) row.setAttribute('aria-busy','true'); else row.removeAttribute('aria-busy'); }

  function fillOwnerSelect(){ var s=el('a-owner'); var prev=s.value; s.innerHTML=''; var arr=OWNER_PREFIXES.slice(); TASKS.forEach(function(t){ if(t.prefix && arr.indexOf(t.prefix)<0) arr.push(t.prefix); }); arr.forEach(function(px){ var o=document.createElement('option'); o.value=px; o.textContent=MAP[px]||px; s.appendChild(o); }); if(prev) s.value=prev; }
  function addTask(){
    var naziv=el('a-title').value.trim(); if(!naziv){ banner('Upiši naziv taska.'); return; }
    var px=el('a-owner').value; var dueDate=fromInput(el('a-due').value); var ntext=el('a-ntext').value.trim(); var ndate=fromInput(el('a-ndate').value);
    var params={action:'add', title:makeTitle(px,naziv,false), step_status:'ACTION'}; var notes=buildNotes(ntext,ndate,'',false); if(notes) params.notes=notes; if(dueDate) params.due=toISODate(dueDate);
    api(params).then(function(res){ if(!res||res.error){ banner('Ne mogu dodati: '+((res&&res.error)||'?')); return; }
      banner(''); el('addform').classList.remove('open'); el('a-title').value=''; el('a-due').value=''; el('a-ntext').value=''; el('a-ndate').value=''; load();
    }).catch(function(err){ banner('Greška: '+err); });
  }

  function updateProg(){ var open=TASKS.filter(function(t){return !t.done;}).length, total=TASKS.length, dn=total-open;
    el('open-n').textContent=open;
    var base=loadCompleted?total:open; var pct=(loadCompleted&&total)?Math.round(dn/total*100):0; el('pct').textContent=loadCompleted?pct+'%':open;
    var circ=144.5; el('ring-fg').style.strokeDashoffset=(circ-circ*(loadCompleted?pct:100)/100).toFixed(1);
    el('sub').textContent=loadCompleted?(open+' otvoreno · '+total+' ukupno'):(open+' otvorenih taskova');
  }

  function selectedTasks(){ return TASKS.filter(function(t){ return selected[t.id]; }); }
  function updateBulkBar(){ var n=Object.keys(selected).length; var e0=el('bsel-n'); if(e0) e0.textContent=n; el('bulkbar').classList.toggle('show', selectMode && n>0); }
  function toggleSel(id,row){ if(selected[id]) delete selected[id]; else selected[id]=true; if(row){ var sb=row.querySelector('.selbox'); if(sb) sb.setAttribute('data-sel', selected[id]?'1':''); } updateBulkBar(); }
  function selectGroup(arr){ var allSel=arr.every(function(t){return selected[t.id];}); arr.forEach(function(t){ if(allSel) delete selected[t.id]; else selected[t.id]=true; }); render(); updateBulkBar(); }
  function clearSel(){ selected={}; render(); updateBulkBar(); }
  function bulkRun(perTask,label){ var arr=selectedTasks(); if(!arr.length){ banner('Ništa nije označeno.'); return; } var i=0,ok=0; banner(label+'...');
    (function step(){ if(i>=arr.length){ banner(label+' gotovo: '+ok+'/'+arr.length); render(); updateBulkBar(); return; }
      var t=arr[i++]; var spec=perTask(t); if(!spec){ step(); return; } var params={action:'update',taskId:t.id}; for(var k in spec.params) params[k]=spec.params[k];
      api(params).then(function(res){ if(res&&!res.error){ ok++; spec.commit(); } step(); }).catch(function(){ step(); }); })(); }
  function bulkNextText(){ var val=el('b-ntext').value.trim(); bulkRun(function(t){ var notes=buildNotes(val,t.nextDate,t.rest,t.critical,t.link); return {params:{notes:notes},commit:function(){t.nextText=val;t.notes=notes;}}; },'Opis next stepa'); }
  function bulkNextRel(kind){ bulkRun(function(t){ var base; if(kind==='today') base=today0(); else { base=t.nextDate?new Date(t.nextDate):today0(); base.setHours(0,0,0,0); base.setDate(base.getDate()+(kind==='d'?1:7)); } var notes=buildNotes(t.nextText,base,t.rest,t.critical,t.link); return {params:{notes:notes},commit:function(){t.nextDate=base;t.notes=notes;}}; },'Next datum'); }
  function bulkNextAbs(){ var d=fromInput(el('b-ndate').value); if(!d){ banner('Odaberi next datum.'); return; } bulkRun(function(t){ var notes=buildNotes(t.nextText,d,t.rest,t.critical,t.link); return {params:{notes:notes},commit:function(){t.nextDate=d;t.notes=notes;}}; },'Next datum'); }
  function bulkDueRel(){ bulkRun(function(t){ var base=t.due?new Date(t.due):today0(); base.setHours(0,0,0,0); base.setDate(base.getDate()+7); return {params:{due:toISODate(base)},commit:function(){t.due=base;}}; },'Rok +1tj'); }
  function bulkDueAbs(){ var d=fromInput(el('b-due').value); if(!d){ banner('Odaberi rok.'); return; } bulkRun(function(t){ return {params:{due:toISODate(d)},commit:function(){t.due=d;}}; },'Rok'); }
  function bulkCritical(val){ bulkRun(function(t){ if(t.critical===val) return null; var notes=buildNotes(t.nextText,t.nextDate,t.rest,val,t.link); return {params:{notes:notes},commit:function(){t.critical=val;t.notes=notes;}}; }, val?'Critical ozn.':'Critical skini'); }

  // ---- Tablica edit (grid bulk) ----
  var geRows=[];
  function escapeAttr(s){ return escapeHtml(String(s)).replace(/"/g,'&quot;'); }
  function openGridEdit(){
    var items=visibleTasks().filter(function(t){return !t.done;});
    geRows=[]; var body=el('ge-body');
    if(!items.length){ body.innerHTML='<div class="ge-empty">Nema otvorenih taskova za prikaz. Provjeri filtere (osoba, tip, vrijeme, traži).</div>'; }
    else {
      var html='<table class="ge-table"><thead><tr><th>Osoba</th><th>Naziv</th><th>Next step</th><th>Next datum</th><th>Rok</th></tr></thead><tbody>';
      items.forEach(function(t,ix){
        var nd=dateInputVal(t.nextDate), du=dateInputVal(t.due);
        var pj=t.isProject?'<span class="pj">A_</span>':''; var cd=t.critical?'<span class="cd">●</span>':'';
        var overD=(whenClass(t.due,false)==='over')?' over':'';
        html+='<tr data-ix="'+ix+'"'+(t.critical?' class="crit"':'')+'>'+
          '<td class="ge-who"><select data-f="owner" class="ge-owner">'+ownerOpts(t.prefix)+'</select></td>'+
          '<td class="ge-name">'+cd+pj+escapeHtml(t.title)+'</td>'+
          '<td><input type="text" data-f="ntext" value="'+escapeAttr(t.nextText||'')+'" placeholder="sljedeći korak"></td>'+
          '<td><input type="date" data-f="ndate" value="'+nd+'"></td>'+
          '<td><input type="date" data-f="due" class="rok'+overD+'" value="'+du+'"></td>'+
        '</tr>';
        geRows.push({t:t, oNtext:(t.nextText||''), oNdate:nd, oDue:du, oOwner:t.prefix});
      });
      html+='</tbody></table>'; body.innerHTML=html;
      Array.prototype.forEach.call(body.querySelectorAll('tr[data-ix]'),function(tr){ tr.addEventListener('input',function(){ markDirty(tr); }); tr.addEventListener('change',function(){ markDirty(tr); }); });
    }
    el('ge-sub').textContent=items.length+' '+(items.length===1?'task':'taskova')+' (filtrirano)';
    el('ge-dirty').textContent=''; el('ge-overlay').classList.add('open');
  }
  function rowVals(tr){ return {ntext:tr.querySelector('[data-f=ntext]').value.trim(), ndate:tr.querySelector('[data-f=ndate]').value, due:tr.querySelector('[data-f=due]').value, owner:(tr.querySelector('[data-f=owner]')?tr.querySelector('[data-f=owner]').value:'')}; }
  function rowDirty(tr){ var r=geRows[+tr.dataset.ix]; var v=rowVals(tr); return (v.ntext!==r.oNtext)||(v.ndate!==r.oNdate)||(v.due!==r.oDue)||(v.owner!==r.oOwner); }
  function markDirty(tr){ tr.classList.toggle('dirty',rowDirty(tr)); var n=el('ge-body').querySelectorAll('tr.dirty').length; el('ge-dirty').textContent=n?(n+' izmijenjeno'):''; }
  function closeGridEdit(){ el('ge-overlay').classList.remove('open'); geRows=[]; }
  function saveGridEdit(){
    var trs=Array.prototype.slice.call(el('ge-body').querySelectorAll('tr[data-ix].dirty'));
    if(!trs.length){ banner('Nema izmjena za spremiti.'); return; }
    var btn=el('ge-save'); btn.disabled=true; var i=0,ok=0; banner('Spremam '+trs.length+' izmjena...');
    (function step(){
      if(i>=trs.length){ btn.disabled=false; banner('Spremljeno '+ok+'/'+trs.length+'.'); render(); buildOwnerFilters(); el('synced').textContent='sync '+new Date().toLocaleTimeString(); closeGridEdit(); return; }
      var tr=trs[i++]; var r=geRows[+tr.dataset.ix]; var t=r.t; var v=rowVals(tr);
      var changedNotes=(v.ntext!==r.oNtext)||(v.ndate!==r.oNdate); var changedDue=(v.due!==r.oDue); var changedOwner=(v.owner!==r.oOwner);
      var params={action:'update', taskId:t.id}; var newNdate=fromInput(v.ndate); var notes=null;
      if(changedNotes){ notes=buildNotes(v.ntext,newNdate,t.rest,t.critical,t.link); params.notes=notes; }
      if(changedDue){ params.due = v.due? toISODate(fromInput(v.due)) : ''; }
      if(changedOwner){ params.title=makeTitle(v.owner,t.title,t.isProject); }
      api(params).then(function(res){ if(res&&!res.error){ ok++;
          if(changedNotes){ t.nextText=v.ntext; t.nextDate=newNdate; t.notes=notes; }
          if(changedDue){ t.due = v.due? fromInput(v.due):null; }
          if(changedOwner){ t.prefix=v.owner; t.owner=MAP[v.owner]||v.owner; }
        } step(); }).catch(function(){ step(); });
    })();
  }

  function showSetup(){ el('setup').style.display='block'; el('bar').style.display='none'; el('prog').style.display='none'; el('owner-filters').style.display='none'; el('addform').classList.remove('open'); el('grid').innerHTML=''; }
  el('secret-save').addEventListener('click',function(){ var v=el('secret-in').value.trim(); if(!v)return; setSecret(v); el('setup').style.display='none'; fillOwnerSelect(); load(); });
  el('secret-in').addEventListener('keydown',function(e){ if(e.key==='Enter') el('secret-save').click(); });
  el('group-seg')&&el('group-seg').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b)return; groupMode=b.dataset.g; Array.prototype.forEach.call(this.children,function(x){x.classList.toggle('on',x===b);}); render(); });
  el('refresh').addEventListener('click',load);
  el('grid-edit').addEventListener('click',openGridEdit);
  el('ge-close').addEventListener('click',closeGridEdit);
  el('ge-save').addEventListener('click',saveGridEdit);
  el('ge-overlay').addEventListener('click',function(e){ if(e.target===this) closeGridEdit(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape' && el('ge-overlay').classList.contains('open')) closeGridEdit(); });
  el('copy-json')&&el('copy-json').addEventListener('click',function(){ var self=this;
    if(!RAW||!RAW.length){ banner('Nema učitanih taskova za kopiranje.'); return; }
    var payload=JSON.stringify({ exported:new Date().toISOString(), count:RAW.length, tasks:RAW }, null, 2);
    var done=function(){ var old=self.textContent; self.textContent='Kopirano ✓'; setTimeout(function(){ self.textContent=old; },1500); };
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(payload).then(done).catch(function(){ fallbackCopy(payload,done); }); }
    else fallbackCopy(payload,done); });
  function fallbackCopy(text,cb){ var ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.left='-9999px'; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); cb&&cb(); }catch(e){ banner('Ne mogu kopirati automatski. Otvori konzolu, JSON je ispisan.'); console.log(text); }
    document.body.removeChild(ta); }
  el('load-completed').addEventListener('click',function(){ loadCompleted=!loadCompleted; this.textContent=loadCompleted?'Gotovi: učitani':'Gotovi: skriveni'; this.classList.toggle('on',loadCompleted); load(); });
  el('type-seg').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b)return; typeFilter=b.dataset.t; if(typeFilter==='req'){ Object.keys(ownerOn).forEach(function(x){ ownerOn[x]=true; }); buildOwnerFilters(); } Array.prototype.forEach.call(this.children,function(x){x.classList.toggle('on',x===b);}); render(); });
  el('more-btn').addEventListener('click',function(){ var a=el('oldf'); var open=a.style.display==='none'; a.style.display=open?'flex':'none'; this.classList.toggle('on',open); this.textContent=open?'Manje filtera':'Više filtera'; });
  el('sort-by').addEventListener('change',function(){ setSort(this.value,1); });
  el('sort-dir').addEventListener('click',function(){ setSort(SORT.by,-SORT.dir); });
  paintSort();
  el('views').addEventListener('click',function(e){ var b=e.target.closest('button'); if(b) setView(b.dataset.v); });
  el('oldf').addEventListener('click',function(e){ if(e.target.closest('.seg button') && !e.target.closest('.req-bar')){ timMode=false; reqMode=false; Array.prototype.forEach.call(el('views').children,function(b){ b.classList.remove('on'); }); } }, true);
  el('owner-filters').addEventListener('click',function(e){ if((timMode||reqMode) && e.target.closest('.chip')){ timMode=false; reqMode=false; Array.prototype.forEach.call(el('views').children,function(b){ b.classList.toggle('on', b.dataset.v==='all'); }); } }, true);
  el('q-title').addEventListener('keydown',function(e){ if(e.key==='Enter') quickAdd(); });
  el('q-save').addEventListener('click',quickAdd);
  el('win-seg').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b)return; winFilter=b.dataset.w; Array.prototype.forEach.call(this.children,function(x){x.classList.toggle('on',x===b);}); render(); });
  el('wait-seg').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b)return; waitFilter=b.dataset.a; Array.prototype.forEach.call(this.children,function(x){x.classList.toggle('on',x===b);}); render(); });
  el('search').addEventListener('input',function(){ searchQ=norm(this.value); render(); });
  el('mark-proj').addEventListener('click',markProjectsBatch);
  el('logout').addEventListener('click',function(){ clearSecret(); clearKey(); showSetup(); });
  el('new-task').addEventListener('click',function(){ fillOwnerSelect(); el('addform').classList.toggle('open'); if(el('addform').classList.contains('open')) el('a-title').focus(); });
  el('a-cancel').addEventListener('click',function(){ el('addform').classList.remove('open'); });
  el('a-save').addEventListener('click',addTask);
  el('bulk-toggle').addEventListener('click',function(){ selectMode=!selectMode; document.querySelector('.wrap').classList.toggle('selecting',selectMode); this.classList.toggle('on',selectMode); this.textContent=selectMode?'Bulk ✓':'Bulk'; if(!selectMode) selected={}; render(); updateBulkBar(); });
  el('bulkbar').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b) return; if(b.dataset.bn) bulkNextRel(b.dataset.bn); else if(b.dataset.br) bulkDueRel(); });
  el('b-ntext-set').addEventListener('click',bulkNextText);
  el('b-ndate-set').addEventListener('click',bulkNextAbs);
  el('b-due-set').addEventListener('click',bulkDueAbs);
  el('b-crit-on').addEventListener('click',function(){ bulkCritical(true); });
  el('b-crit-off').addEventListener('click',function(){ bulkCritical(false); });
  el('b-clear').addEventListener('click',clearSel);

  if(getKey()||getSecret()){ fillOwnerSelect(); load(); } else showSetup();
})();
