/*
  Koykan – pojednostavljeni projektni boardovi (4.11.2026.). Učitava ga shell.js na boardovima s
  "unified project board v1" predloškom. Ne mijenja API ni format zapisa (note, opis, nextstep),
  samo prikaz: gotovi pogledi, kraći red, status iz izbornika, bočna ploča sa svim poljima.
*/
(function(){
  if(window.__kyBS || typeof BOARD!=='object' || typeof taskRow!=='function' || typeof update!=='function' || typeof WSTATES==='undefined') return;
  window.__kyBS=true;
  var ADM=!!KY_ADMIN;
  var ROOT=(document.currentScript&&document.currentScript.src||'').replace(/board-simple\.js(\?.*)?$/,'');
  var css=document.createElement('link'); css.rel='stylesheet'; css.href=ROOT+'board-simple.css?v=1'; document.head.appendChild(css);
  document.body.classList.add('ky-bs'); if(!ADM) document.body.classList.add('ky-nonadm');

  /* statusi bez emojija; ključevi: action, pending, hold, done, treba */
  WSTATES.forEach(function(w){ w[3]=w[1]; });
  var MENU=['action','pending','hold','done'], HINT={action:'radi se na tome',pending:'čeka nekog drugog',hold:'pauzirano',done:'gotovo, Domagoj zatvara'}, DOT={action:'#ffb15c',pending:'#7db4ff',hold:'#c9c2b6',done:'#4fd089'};
  function wIdx(k){ for(var i=0;i<WSTATES.length;i++){ if(WSTATES[i][0]===k) return i; } return -1; }
  function wKey(t){ var i=wState(t); return i<0?'':WSTATES[i][0]; }
  function stripKw(s){ return String(s||'').replace(WRX,'').replace(/^[\s\-–—|:]+/,''); }
  function withKw(k,txt){ if(WRX.test(txt)) return txt; var i=wIdx(k), kw=i<0?'':WSTATES[i][1]; return kw?(txt?kw+' - '+txt:kw):txt; }
  function setW(t,k){ var nn=withKw(k,stripKw(t.note)); if(nn!==String(t.note||'')) update(t,{note:nn, opis:stampStatus(t)}); }

  /* ---------- gotovi pogledi ---------- */
  var SV='open';
  var HAS_DLV=typeof renderDlvBoard==='function' && !!el('f-dlv');   /* pregled po deliverableu imaju samo noviji boardovi */
  var VIEWS=[['open','Otvoreno','Svi otvoreni koraci'],['over','Kasni','Probijen rok ili rok next stepa'],['week','Ovaj tjedan','Rok do nedjelje, uključujući zakašnjelo'],['wait','Čeka druge','PENDING i ON HOLD'],['done','Javljeno gotovo','Nositelj javio DONE, čeka zatvaranje'],['dlv','Po deliverableu','Otvoreni koraci po roku deliverablea'],['closed','Zatvoreno','Zatvoreni koraci']].filter(function(v){ return v[0]!=='dlv' || HAS_DLV; });
  function weekEnd(){ var e=new Date(); e.setHours(0,0,0,0); var wd=e.getDay(); e.setDate(e.getDate()+(wd===0?0:7-wd)); return dateVal(e); }
  FILTER_HOOKS.push(function(t){ var k=wKey(t);
    if(SV==='wait') return k==='pending'||k==='hold';
    if(SV==='done') return k==='done';
    if(SV==='week'){ var e=weekEnd(), d=dateVal(t.due), s=dateVal(t.sdue); return (!!d&&d<=e)||(!!s&&s<=e); }
    return true; });
  function setSV(v){ SV=v; fStatus=(v==='closed')?'Gotovo':'Otvoreno'; fOverdue=(v==='over'); fCrit=false; fP1=false;
    if(HAS_DLV){ fDlv=(v==='dlv')?'sort':'all'; document.body.classList.toggle('dlvmode', fDlv!=='all'); }
    qsa('[data-st]').forEach(function(x){ x.classList.toggle('on', x.getAttribute('data-st')===fStatus); });
    if(HAS_DLV) qsa('[data-dl]').forEach(function(x){ x.classList.toggle('on', x.getAttribute('data-dl')===fDlv); });
    el('f-overdue').classList.toggle('on',fOverdue); el('f-crit').classList.remove('on'); el('f-prio').classList.remove('on');
    paintTabs(); renderAll(); }
  function paintTabs(){ qsa('.bs-views button').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-v')===SV); }); }

  var filters=document.querySelector('.filters');
  var bar=document.createElement('div'); bar.className='bs-bar';
  bar.innerHTML='<div class="bs-views">'+VIEWS.map(function(v){ return '<button data-v="'+v[0]+'" title="'+v[2]+'">'+v[1]+'</button>'; }).join('')+'</div><span class="bs-sp"></span><button class="btn ghost bs-more">Više filtera</button>';
  filters.parentNode.insertBefore(bar, filters);
  bar.insertBefore(el('search'), bar.querySelector('.bs-more')); el('search').placeholder='Traži...';
  bar.querySelector('.bs-views').addEventListener('click', function(e){ var b=e.target.closest('button'); if(b) setSV(b.getAttribute('data-v')); });
  bar.querySelector('.bs-more').addEventListener('click', function(){ var on=document.body.classList.toggle('bs-advon'); this.classList.toggle('on',on); this.textContent=on?'Manje filtera':'Više filtera'; });
  el('f-overdue').parentNode.classList.add('bs-adv'); if(el('f-dlv')) el('f-dlv').classList.add('bs-adv');
  /* ručni filteri iz "Više filtera" poništavaju gotovi pogled */
  filters.addEventListener('click', function(e){ if(e.target.closest('.bs-adv .chip')){ SV=''; paintTabs(); } }, true);
  RENDER_HOOKS.push({post:function(){ bar.classList.toggle('hide', VIEW!=='list'); }});

  /* ---------- novi korak: uvijek otvoreno polje ---------- */
  el('addbar').classList.remove('hidden'); el('a-naziv').placeholder='Novi korak: upiši i pritisni Enter';
  el('a-cancel').addEventListener('click', function(){ el('addbar').classList.remove('hidden'); });

  /* ---------- red ---------- */
  var _taskRow=taskRow;
  taskRow=function(t,isSub){ var row=_taskRow(t,isSub);
    var ts=row.querySelector('.t-status'); if(ts) ts.value=stripKw(t.note);
    var wp=row.querySelector('.naziv .wpill'); if(wp && t.prio) wp.insertAdjacentHTML('afterend','<span class="bs-prio p-'+esc(t.prio)+'">'+esc(t.prio)+'</span> ');
    row.addEventListener('click', function(e){ var tg=e.target;
      if(tg.closest('.wpill')){ e.stopPropagation(); statusMenu(t, tg.closest('.wpill')); return; }
      if(tg.closest('.check') && !ADM && t.status!=='Gotovo'){ e.stopPropagation(); if(wKey(t)!=='done'){ setW(t,'done'); banner('Javljeno da je gotovo. Korak zatvara Domagoj.'); } return; }
      if(tg.closest('.naziv') && !tg.closest('a,.dlv,.dlv-add')){ e.stopPropagation(); openDrawer(t); } }, true);
    row.addEventListener('change', function(e){ if(!e.target.classList.contains('t-status')) return; e.stopPropagation();
      var nn=withKw(wKey(t), e.target.value.trim()); if(nn!==String(t.note||'')) update(t,{note:nn, opis:stampStatus(t)}); }, true);
    return row; };

  /* ---------- izbornik statusa ---------- */
  function closeMenu(){ var m=document.querySelector('.bs-menu'); if(m) m.remove(); document.removeEventListener('click',closeMenu); }
  function statusMenu(t,anchor){ closeMenu(); var m=document.createElement('div'); m.className='bs-menu'; var cur=wKey(t);
    MENU.forEach(function(k){ var b=document.createElement('button'); if(k===cur) b.className='cur';
      b.innerHTML='<i style="background:'+DOT[k]+'"></i><b>'+WSTATES[wIdx(k)][1]+'</b><span>'+HINT[k]+'</span>';
      b.addEventListener('click', function(e){ e.stopPropagation(); closeMenu(); if(k!==cur) setW(t,k); }); m.appendChild(b); });
    document.body.appendChild(m); var r=anchor.getBoundingClientRect(), top=r.bottom+4; if(top+m.offsetHeight>window.innerHeight-8) top=r.top-m.offsetHeight-4;
    m.style.left=Math.max(8,Math.min(r.left,window.innerWidth-m.offsetWidth-8))+'px'; m.style.top=top+'px';
    setTimeout(function(){ document.addEventListener('click',closeMenu); },0); }

  /* ---------- bočna ploča ---------- */
  function closeDrawer(){ qsa('.bs-drw,.bs-drw-bg').forEach(function(n){ n.remove(); }); document.removeEventListener('keydown',drwEsc); }
  function drwEsc(e){ if(e.key==='Escape') closeDrawer(); }
  function opts(arr,cur,lbl){ if(cur && arr.indexOf(cur)<0) arr=[cur].concat(arr); return arr.map(function(o){ return '<option value="'+escAttr(o)+'"'+(o===cur?' selected':'')+'>'+esc(lbl?lbl(o):(o||'–'))+'</option>'; }).join(''); }
  function openDrawer(t){ closeDrawer(); var lk=isLocked(t), lockDue=lk&&!ADM, x=dlvParse(t.nextstep)||{d:'',t:''}, dw=wKey(t), isTop=!t.parent, done=t.status==='Gotovo';
    var bg=document.createElement('div'); bg.className='bs-drw-bg'; var d=document.createElement('aside'); d.className='bs-drw';
    d.innerHTML='<div class="bs-h"><span class="bs-tag">'+esc(secLabel(t.section))+'</span><button class="bs-x" aria-label="Zatvori">✕</button></div>'+
      '<textarea class="bs-title" rows="2" data-f="naziv"></textarea>'+
      '<label>Status</label><div class="bs-st">'+MENU.map(function(k){ var w=WSTATES[wIdx(k)]; return '<button data-w="'+k+'" class="'+w[2]+(dw===k?' on':'')+'" title="'+HINT[k]+'">'+w[1]+'</button>'; }).join('')+'</div>'+
      '<label>Next step</label><input data-f="note" placeholder="što je sljedeći korak">'+
      '<div class="bs-2"><div><label>Rok'+(lk?' (zaključan)':'')+'</label><input type="date" data-f="due"'+(lockDue?' disabled title="Rok zaključao Domagoj"':'')+'></div><div><label>Datum next stepa</label><input type="date" data-f="sdue"></div></div>'+
      (ADM?'<label class="bs-ck"><input type="checkbox" data-f="locked"'+(lk?' checked':'')+'> Zaključaj rok (nositelj ga ne može mijenjati)</label>':'')+
      '<label>Deliverable</label>'+(ADM?'<div class="bs-dlv"><input data-f="dlvt" placeholder="što točno mora biti isporučeno"><input type="date" data-f="dlvd"></div>':'<div class="bs-ro">'+(x.t?esc(x.t)+(x.d?' · <b>'+hrDate(x.d)+'</b>':'')+' <span class="bs-mute">postavlja Domagoj</span>':'<span class="bs-mute">nema</span>')+'</div>')+
      '<label>Opis</label><textarea data-f="opis" rows="7" placeholder="bilješke, kontekst, dogovori"></textarea>'+
      '<label>Link</label><div class="bs-link"><input data-f="link" placeholder="https://...">'+(t.link?'<a class="btn" target="_blank" rel="noopener">Otvori</a>':'')+'</div>'+
      '<div class="bs-2"><div><label>Nositelj</label><select data-f="owner">'+opts(OWNERS.slice(), t.owner||'')+'</select></div><div><label>Grupa</label><select data-f="section">'+opts(secOrder(), t.section||'', secLabel)+'</select></div></div>'+
      '<div class="bs-2"><div><label>Prioritet</label><select data-f="prio">'+opts(['','P1','P2','P3'], t.prio||'')+'</select></div><div><label>Oznake</label><label class="bs-ck"><input type="checkbox" data-f="critical"'+(t.critical?' checked':'')+'> Critical</label></div></div>'+
      (isTop?'<label>Podtask</label><div class="bs-link"><input class="bs-subn" placeholder="naziv podtaska, Enter za dodavanje"><button class="btn bs-subok">Dodaj</button></div>':'')+
      '<div class="bs-meta">'+createdLine(t).replace(/<[^>]+>/g,'').replace(/^upisano/,'Upisano')+'</div>'+
      '<div class="bs-f">'+(done?'<button class="btn bs-reopen">Vrati u otvoreno</button>':(ADM?'<button class="btn bs-close">✓ Zatvori korak</button>':(dw==='done'?'<span class="bs-mute">Javljeno gotovo, čeka Domagoja</span>':'<button class="btn bs-donebtn">✓ Javi da je gotovo</button>')))+
        ((lk&&!ADM)?'':'<button class="btn ghost bs-del" title="Obriši korak">Obriši</button>')+'<span class="bs-sp"></span><button class="btn ghost bs-cancel">Odustani</button><button class="btn primary bs-save">Spremi</button></div>';
    function f(k){ return d.querySelector('[data-f="'+k+'"]'); }
    f('naziv').value=t.naziv||''; f('note').value=stripKw(t.note); f('due').value=dateVal(t.due); f('sdue').value=dateVal(t.sdue);
    if(f('dlvt')){ f('dlvt').value=x.t; f('dlvd').value=x.d; } f('opis').value=t.opis||''; f('link').value=t.link||'';
    var la=d.querySelector('.bs-link a'); if(la) la.href=t.link;
    Array.prototype.forEach.call(d.querySelectorAll('.bs-st button'), function(b){ b.addEventListener('click', function(){ dw=(dw===b.getAttribute('data-w'))?'':b.getAttribute('data-w'); Array.prototype.forEach.call(d.querySelectorAll('.bs-st button'), function(y){ y.classList.toggle('on', y.getAttribute('data-w')===dw); }); }); });
    document.body.appendChild(bg); document.body.appendChild(d); document.addEventListener('keydown',drwEsc);
    bg.addEventListener('click',closeDrawer); d.querySelector('.bs-x').addEventListener('click',closeDrawer); d.querySelector('.bs-cancel').addEventListener('click',closeDrawer);
    var b;
    if((b=d.querySelector('.bs-close'))) b.addEventListener('click', function(){ closeDrawer(); update(t,{status:'Gotovo'}); banner('Zatvoreno'); });
    if((b=d.querySelector('.bs-reopen'))) b.addEventListener('click', function(){ closeDrawer(); update(t,{status:'Otvoreno'}); });
    if((b=d.querySelector('.bs-donebtn'))) b.addEventListener('click', function(){ dw='done'; save(); banner('Javljeno da je gotovo. Korak zatvara Domagoj.'); });
    if((b=d.querySelector('.bs-del'))) b.addEventListener('click', function(){ if(confirm('Obrisati korak "'+t.naziv+'"'+(TASKS.some(function(y){ return y.parent===t.id; })?' i njegove podtaskove':'')+'?')){ closeDrawer(); del(t); } });
    if(isTop){ var sn=d.querySelector('.bs-subn'); var addSub=function(){ var v=sn.value.trim(); if(!v){ sn.focus(); return; } sn.value='';
        var p={action:'add', section:t.section, naziv:v, owner:(t.owner||BOARD.defOwner||'Dom'), status:'Otvoreno', parent:t.id, ord:Date.now(), due:''};
        if(MOD.stores||MOD.supplier) p.store=t.store||'';
        api(p).then(function(r){ banner(r&&r.ok?'Podtask dodan':'Nije dodano: '+((r&&r.error)||'?')); load(); }).catch(load); };
      sn.addEventListener('keydown', function(e){ if(e.key==='Enter') addSub(); }); d.querySelector('.bs-subok').addEventListener('click', addSub); }
    d.querySelector('.bs-save').addEventListener('click', save);
    function save(){ var F={}, naziv=f('naziv').value.replace(/\s+/g,' ').trim(); if(!naziv){ f('naziv').focus(); return; }
      if(naziv!==t.naziv) F.naziv=naziv;
      var nn=withKw(dw, f('note').value.trim()); if(nn!==String(t.note||'')) F.note=nn;
      if(!lockDue && f('due').value!==dateVal(t.due)) F.due=f('due').value;
      if(f('sdue').value!==dateVal(t.sdue)) F.sdue=f('sdue').value;
      var lnk=f('link').value.trim(); if(lnk!==String(t.link||'')) F.link=lnk;
      ['owner','section','prio'].forEach(function(k){ if(f(k).value!==String(t[k]||'')) F[k]=f(k).value; });
      if(f('critical').checked!==!!t.critical) F.critical=String(f('critical').checked);
      if(ADM && f('locked').checked!==lk) F.locked=String(f('locked').checked);
      if(ADM){ var tx=f('dlvt').value.replace(/\|/g,'/').replace(/\s+/g,' ').trim(), nv=tx?((f('dlvd').value||'')+'|'+tx):''; if(nv!==String(t.nextstep||'')) F.nextstep=nv; }
      var op=f('opis').value.replace(/\s+$/,'');
      if(F.note!==undefined) op=stampStatus({note:t.note, opis:op});
      if(F.due!==undefined) op=auditOpis({opis:op},'rok',t.due||'',F.due);
      if(F.sdue!==undefined) op=auditOpis({opis:op},'rok next stepa',t.sdue||'',F.sdue);
      if(op!==String(t.opis||'')) F.opis=op;
      closeDrawer(); if(!Object.keys(F).length) return;
      var had=!!codeKey(t.naziv); update(t,F); banner('Spremljeno');
      if(F.naziv && !t.parent && (had||codeKey(F.naziv))) autoSort(t.section); }
    setTimeout(function(){ f('note').focus(); },30);
  }

  /* prvi prikaz je možda već nacrtan prije učitavanja ove skripte */
  paintTabs(); if(TASKS.length) renderAll();
})();
