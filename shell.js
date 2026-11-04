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
    var bs=document.createElement('script'); bs.src=ROOT+'board-simple.js?v=1'; document.body.appendChild(bs); }
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
