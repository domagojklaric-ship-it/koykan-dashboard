/* KCEP: filter po državi, Hrvatska (grupe "HR · ...") ili Njemačka (grupe "DE · ..."). D.K. 12.11.2026. */
(function(){
  var fCountry='all'; try{ fCountry=localStorage.getItem('kcep_country')||'all'; }catch(e){}
  function cOf(sec){ var s=String(sec||''); return /^\s*HR\b/.test(s)?'HR':(/^\s*DE\b/.test(s)?'DE':''); }
  FILTER_HOOKS.push(function(t){ return fCountry==='all' || cOf(t.section)===fCountry; });
  /* isti filter i za blok Kritično (shell.js) */
  window.CRIT_FILTER=function(t){ return fCountry==='all' || cOf(t.section)===fCountry; };
  window.CRIT_LABEL=function(){ return fCountry==='HR'?'Hrvatska':(fCountry==='DE'?'Njemačka':''); };
  var row=document.createElement('div'); row.className='chips'; row.id='f-country';
  function paint(){
    row.innerHTML='<span class="klabel">Država</span>'+[['all','Sve'],['HR','Hrvatska'],['DE','Njemačka']].map(function(c){
      var n=TASKS.filter(function(t){ return t.status!=='Gotovo' && (c[0]==='all' || cOf(t.section)===c[0]); }).length;
      return '<span class="chip'+(fCountry===c[0]?' on':'')+'" data-c="'+c[0]+'">'+c[1]+' <b class="ocnt">'+n+'</b></span>'; }).join('');
  }
  /* grupe druge države se skrivaju iz reda "Grupa" */
  function hideGroups(){ Array.prototype.forEach.call(document.querySelectorAll('#f-section .chip'), function(ch){
    var c=cOf(ch.title); ch.style.display=(fCountry==='all' || !c || c===fCountry)?'':'none'; }); }
  row.addEventListener('click', function(e){ var ch=e.target.closest('[data-c]'); if(!ch) return; fCountry=ch.getAttribute('data-c');
    try{ localStorage.setItem('kcep_country', fCountry); }catch(_){}
    if(fCountry!=='all' && fSection!=='all' && cOf(fSection)!==fCountry) fSection='all';
    renderAll(); });
  var fs=el('f-section'); fs.parentNode.insertBefore(row, fs);
  RENDER_HOOKS.push({pre:paint, post:hideGroups});
  paint();
})();
