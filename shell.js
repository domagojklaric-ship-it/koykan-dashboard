/*
  Koykan – zajednički app shell (bočni izbornik) za glavni i sve projektne boardove.
  Uključuje se jednim redom: <script src="shell.js"></script> (ili ../shell.js na boardovima).
  Prikazuje samo boardove za koje je u ovom pregledniku spremljen pristupni kod (ili sve ako je
  glavni board javio puni pristup). To je samo navigacija: pristup i dalje provjerava worker.
*/
(function(){
  if(window.__kyShell) return; window.__kyShell=true;
  var me=document.currentScript; var ROOT=me? me.src.replace(/shell\.js(\?.*)?$/,'') : './';
  var BOARDS=[
    {key:'bbt', name:'BBT pilot', skey:'bbt_secret'},
    {key:'pep', name:'PEP Takeover', skey:'pep_secret'},
    {key:'zabica', name:'Žabica (Rijeka)', skey:'zabica_secret'},
    {key:'stores', name:'Stores', skey:'stores_secret'},
    {key:'kcep', name:'KCEP restructure', skey:'kcep_secret'},
    {key:'menu', name:'Menu CZ', skey:'menu_secret'},
    {key:'gastro', name:'Gastro-tim', skey:'gastro_secret'},
    {key:'procurement', name:'Sourcing', skey:'procurement_secret'},
    {key:'hr', name:'HR Global', skey:'hr_secret'},
    {key:'cm', name:'CM insolvencija', skey:'cm_secret'},
    {key:'explore', name:'Keep exploring', skey:'explore_secret'}
  ];
  function ls(k){ try{ return localStorage.getItem(k)||''; }catch(e){ return ''; } }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  var css=document.createElement('link'); css.rel='stylesheet'; css.href=ROOT+'shell.css?v=1'; document.head.appendChild(css);

  var path=location.pathname.replace(/index\.html$/,'');
  var rootPath=new URL(ROOT, location.href).pathname;
  var cur=path===rootPath ? '' : (path.slice(rootPath.length).split('/')[0]||'');
  if(cur){ var fn=document.createElement('link'); fn.rel='stylesheet'; fn.href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap'; document.head.appendChild(fn);
    var bt=document.createElement('link'); bt.rel='stylesheet'; bt.href=ROOT+'board-theme.css?v=1'; document.head.appendChild(bt);
    var bs=document.createElement('script'); bs.src=ROOT+'board-simple.js?v=2'; document.body.appendChild(bs); }
  var full=ls('ky_full')==='1';

  var h='<div class="kys-brand"><span class="kys-logo">K</span><span>Koykan</span></div>';
  if(cur==='' || ls('koykan_secret')){
    h+='<a class="kys-item'+(cur===''?' on':'')+'" href="'+ROOT+'"><span class="kys-ic kys-ic-tasks"></span><span class="kys-tx">Taskovi</span></a>';
  }
  h+='<div id="ky-side-slot"></div>';
  var vis=BOARDS.filter(function(b){ return b.key===cur || full || !!ls(b.skey); });
  if(vis.length){
    h+='<div class="kys-sec">Projektni boardovi</div>';
    vis.forEach(function(b){ h+='<a class="kys-item'+(b.key===cur?' on':'')+'" href="'+ROOT+b.key+'/"><span class="kys-av">'+esc(b.name.charAt(0))+'</span><span class="kys-tx">'+esc(b.name)+'</span></a>'; });
  }
  h+='<div class="kys-foot" id="ky-side-foot"></div>';

  var side=document.createElement('nav'); side.className='kys'; side.id='ky-side'; side.innerHTML=h;
  var mob=document.createElement('div'); mob.className='kys-mob';
  mob.innerHTML='<button class="kys-burger" aria-label="Izbornik"><span></span></button><span class="kys-mt">Koykan</span>';
  var bg=document.createElement('div'); bg.className='kys-bg';
  function mount(){
    document.body.insertBefore(bg, document.body.firstChild);
    document.body.insertBefore(side, document.body.firstChild);
    document.body.insertBefore(mob, document.body.firstChild);
    document.body.classList.add('ky-shell');
  }
  function toggle(on){ document.body.classList.toggle('kys-open', on); }
  mob.querySelector('.kys-burger').addEventListener('click', function(){ toggle(!document.body.classList.contains('kys-open')); });
  bg.addEventListener('click', function(){ toggle(false); });
  side.addEventListener('click', function(e){ if(e.target.closest('a,.chip')) toggle(false); });
  if(document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();

/* Koykan – hrvatski prikaz datuma (DD.MM.GGGG.) u svim poljima za datum (D.K. 6.11.2026).
   Nativni <input type="date"> ostaje (vrijednost i kalendar rade isto, YYYY-MM-DD),
   samo se njegov tekst sakrije i preko njega se ispiše datum s točkama. */
(function(){
  if(window.__kyDate) return; window.__kyDate=true;
  var st=document.createElement('style');
  st.textContent='.kyd-w{position:relative;display:inline-flex;align-items:center;flex:none;max-width:100%;vertical-align:middle}'+
    '.kyd-w.kyd-full{display:flex;width:100%}'+
    'input[type=date].kyd::-webkit-datetime-edit{opacity:0}'+
    '.kyd-l{position:absolute;display:flex;align-items:center;pointer-events:none;white-space:nowrap;overflow:hidden;z-index:1}';
  (document.head||document.documentElement).appendChild(st);
  function fmt(v){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||''); return m? m[3]+'.'+m[2]+'.'+m[1]+'.' : ''; }
  function paint(inp){
    var l=inp.__kydL; if(!l) return;
    var cs=getComputedStyle(inp), f=fmt(inp.value);
    l.textContent=f||'dd.mm.gggg.';
    l.style.font=cs.font; l.style.letterSpacing=cs.letterSpacing; l.style.color=cs.color;
    l.style.opacity=f? cs.opacity : String((parseFloat(cs.opacity)||1)*0.45);
    l.style.visibility=cs.visibility; l.style.display=(cs.display==='none')?'none':'flex';
    var bl=parseFloat(cs.borderLeftWidth)||0, pl=parseFloat(cs.paddingLeft)||0;
    l.style.left=(inp.offsetLeft+bl+pl)+'px';
    l.style.top=inp.offsetTop+'px';
    l.style.height=inp.offsetHeight+'px';
    l.style.width=Math.max(0,inp.offsetWidth-bl-pl-22)+'px';
  }
  function wrap(inp){
    if(inp.__kydL||inp.type!=='date'||!inp.parentNode) return;
    var w0=inp.offsetWidth; if(!w0) return; // nije vidljivo, omotat ce se kad se prikaze
    var w=document.createElement('span'); w.className='kyd-w';
    inp.parentNode.insertBefore(w,inp); w.appendChild(inp);
    if(inp.offsetWidth<w0-2){ w.classList.add('kyd-full'); }
    var l=document.createElement('span'); l.className='kyd-l'; w.appendChild(l);
    inp.__kydL=l; inp.classList.add('kyd');
    ['input','change','focus','blur'].forEach(function(ev){ inp.addEventListener(ev,function(){ paint(inp); }); });
    paint(inp);
  }
  var ro=('ResizeObserver' in window)? new ResizeObserver(function(es){ es.forEach(function(e){ var t=e.target; if(t.__kydL) paint(t); else wrap(t); }); }) : null;
  function scan(root){
    var list=root.querySelectorAll? root.querySelectorAll('input[type=date]') : [];
    Array.prototype.forEach.call(list,function(inp){ if(!inp.__kydSeen){ inp.__kydSeen=true; if(ro) ro.observe(inp); } wrap(inp); });
    if(root.tagName==='INPUT' && root.type==='date'){ if(!root.__kydSeen){ root.__kydSeen=true; if(ro) ro.observe(root); } wrap(root); }
  }
  ['value','valueAsDate','valueAsNumber'].forEach(function(p){
    var d=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,p); if(!d||!d.set) return;
    Object.defineProperty(HTMLInputElement.prototype,p,{configurable:true,enumerable:d.enumerable,get:d.get,set:function(v){ d.set.call(this,v); if(this.__kydL) paint(this); }});
  });
  var mo=new MutationObserver(function(ms){
    ms.forEach(function(m){
      if(m.type==='childList'){ Array.prototype.forEach.call(m.addedNodes,function(n){ if(n.nodeType===1) scan(n); }); }
      else if(m.target.__kydL){ paint(m.target); }
    });
  });
  function start(){ scan(document); mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled','style','value']}); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
  window.addEventListener('resize',function(){ Array.prototype.forEach.call(document.querySelectorAll('input.kyd'),paint); });
})();

/* #private u adresi: otvori Private pogled (svi rokovi) na osobnom boardu; link iz subotnjeg PRIVATE bloka u kalendaru (D.K. 9.11.2026) */
(function(){
  if((location.hash||'').toLowerCase()!=='#private') return;
  var n=0, iv=setInterval(function(){
    n++; if(n>80){ clearInterval(iv); return; }
    var chip=[].slice.call(document.querySelectorAll('.filters .chip')).find(function(e){ return /^\s*Private\b/.test(e.innerText||''); });
    if(!chip) return;
    clearInterval(iv);
    if(chip.getAttribute('data-on')!=='true') chip.click();
    setTimeout(function(){ var b=document.querySelector('.views button[data-v="all"]'); if(b) b.click(); },300);
  },250);
})();

/* Kritično traka na projektnim boardovima (D.K. 9.11.2026): samo otvoreni critical taskovi TOG boarda, na vrhu liste */
(function(){
  if(typeof window.RENDER_HOOKS==='undefined' || !window.RENDER_HOOKS || typeof window.RENDER_HOOKS.push!=='function') return;
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function ymd(s){ var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||'')); return m? new Date(+m[1],+m[2]-1,+m[3]).getTime() : null; }
  function dm(s){ var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||'')); return m? m[3]+'.'+m[2]+'.' : ''; }
  function dlv(s){ s=String(s||''); var i=s.indexOf('|'); if(i<0) return null; var d=s.slice(0,i); return /^\d{4}-\d{2}-\d{2}$/.test(d)? {d:d,t:s.slice(i+1)} : null; }
  function style(){ if(document.getElementById('csb-style')) return; var st=document.createElement('style'); st.id='csb-style';
    st.textContent='.crit-strip{margin:0 0 14px;border:1px solid var(--over,#d1453b);border-left:5px solid var(--over,#d1453b);background:var(--panel,#fff);border-radius:12px;padding:10px 14px}'+
    '.crit-strip .cs-h{display:flex;align-items:center;gap:10px}'+
    '.crit-strip .cs-t{font-weight:700;color:var(--over,#d1453b);letter-spacing:.02em;text-transform:uppercase;font-size:13px}'+
    '.crit-strip .cs-n{font-weight:700;font-size:12px;color:#fff;background:var(--over,#d1453b);border-radius:999px;padding:1px 8px}'+
    '.crit-strip .cs-tg{margin-left:auto;border:1px solid var(--line,#e6e3dc);background:transparent;color:var(--muted,#5f5c55);border-radius:8px;padding:3px 10px;font-size:12px;cursor:pointer}'+
    '.crit-strip .cs-l{margin-top:8px;display:flex;flex-direction:column;max-height:320px;overflow:auto}'+
    '.crit-strip .cs-r{display:grid;grid-template-columns:90px minmax(0,1fr) auto;gap:10px;align-items:baseline;padding:6px 4px;border-top:1px solid var(--line,#e6e3dc);cursor:pointer}'+
    '.crit-strip .cs-r:hover{background:rgba(209,69,59,.06)}'+
    '.crit-strip .cs-o{font-size:12px;color:var(--muted,#5f5c55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
    '.crit-strip .cs-ti{font-size:14px;color:var(--text,#1f1e1b);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
    '.crit-strip .cs-ti small{font-weight:400;color:var(--muted,#5f5c55)}'+
    '.crit-strip .cs-m{font-size:12px;color:var(--muted,#5f5c55);white-space:nowrap}'+
    '.crit-strip .cs-r.late .cs-m b{color:var(--over,#d1453b)}'+
    '.cs-flash{outline:2px solid var(--over,#d1453b);outline-offset:2px;transition:outline-color .4s}'+
    '@media (max-width:700px){.crit-strip .cs-r{grid-template-columns:minmax(0,1fr)}.crit-strip .cs-m{white-space:normal}}';
    document.head.appendChild(st); }
  function go(t){
    var row=document.querySelector('[data-id="'+String(t.id).replace(/"/g,'')+'"]');
    if(row && row.offsetParent){ row.scrollIntoView({block:'center',behavior:'smooth'}); row.classList.add('cs-flash'); setTimeout(function(){ row.classList.remove('cs-flash'); },2200); return; }
    var s=document.getElementById('search'); if(s){ s.value=String(t.naziv||''); s.dispatchEvent(new Event('input',{bubbles:true})); }
  }
  var busy=false;
  function paint(){ if(busy) return; busy=true; try{ paint_(); } finally { busy=false; } }
  function paint_(){
    var board=document.getElementById('board'); var T=window.TASKS; if(!board || !Array.isArray(T)) return;
    style();
    var box=document.getElementById('crit-strip-b');
    if(!box){ box=document.createElement('div'); box.id='crit-strip-b'; box.className='crit-strip'; var hs=document.querySelector('.head-scroll'); var anchor=(hs&&hs.parentNode===board.parentNode)?hs:board; anchor.parentNode.insertBefore(box,anchor); }
    var byId={}; T.forEach(function(t){ byId[t.id]=t; });
    var list=T.filter(function(t){ return t && t.critical && t.status!=='Gotovo' && t.id!=='_CFG'; });
    if(!list.length){ if(box.style.display!=='none'){ box.style.display='none'; box.innerHTML=''; box.__h=''; } return; }
    var t0=new Date(); t0.setHours(0,0,0,0); t0=t0.getTime();
    function key(t){ var ds=[]; var x=dlv(t.nextstep); if(x) ds.push(ymd(x.d)); if(t.due) ds.push(ymd(t.due)); ds=ds.filter(function(v){ return v!==null; }); return ds.length?Math.min.apply(null,ds):8e15; }
    list.sort(function(a,b){ return key(a)-key(b); });
    var open=true; try{ open=localStorage.getItem('ky_critb_open')!=='0'; }catch(e){}
    var h='<div class="cs-h"><span class="cs-t">⚑ Kritično na ovom boardu</span><span class="cs-n">'+list.length+'</span><button class="cs-tg" type="button">'+(open?'Sakrij':'Prikaži')+'</button></div>';
    if(open){ h+='<div class="cs-l">'+list.map(function(t,i){
      var x=dlv(t.nextstep), late=key(t)<t0, parts=[], par=t.parent&&byId[t.parent]?byId[t.parent]:null;
      if(x) parts.push('deliverable '+dm(x.d)+(x.t?' '+esc(String(x.t).slice(0,70)):''));
      if(t.due) parts.push('rok '+dm(t.due));
      return '<div class="cs-r'+(late?' late':'')+'" data-i="'+i+'" title="Pokaži task na boardu"><span class="cs-o">'+esc(t.owner)+'</span><span class="cs-ti">'+esc(t.naziv)+(par?' <small>· '+esc(String(par.naziv||'').slice(0,50))+'</small>':'')+'</span><span class="cs-m">'+(late?'<b>kasni</b>'+(parts.length?' · ':''):'')+parts.join(' · ')+'</span></div>';
    }).join('')+'</div>'; }
    if(box.__h===h && box.style.display!=='none'){ return; }
    box.__h=h; box.innerHTML=h; box.style.display='';
    box.querySelector('.cs-tg').addEventListener('click',function(){ try{ localStorage.setItem('ky_critb_open',open?'0':'1'); }catch(e){} paint(); });
    Array.prototype.forEach.call(box.querySelectorAll('.cs-r'),function(r){ r.addEventListener('click',function(){ go(list[+r.getAttribute('data-i')]); }); });
  }
  window.RENDER_HOOKS.push({post:function(){ try{ paint(); }catch(e){} }});
  try{ paint(); }catch(e){}
})();
