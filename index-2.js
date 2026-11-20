(function(){
  var pop=document.createElement('div'); pop.className='opis-hov'; document.body.appendChild(pop);
  document.addEventListener('mouseover',function(e){ var p=e.target.closest?e.target.closest('.opis-pill'):null; if(!p)return; var tx=p.getAttribute('data-opis')||''; if(!tx.trim())return; pop.textContent=tx; pop.style.display='block'; var b=p.getBoundingClientRect(); var w=pop.offsetWidth; var left=b.left; if(left+w>window.innerWidth-8) left=window.innerWidth-8-w; if(left<8)left=8; var top=b.bottom+6; if(top+pop.offsetHeight>window.innerHeight-8) top=b.top-pop.offsetHeight-6; pop.style.left=left+'px'; pop.style.top=top+'px'; });
  document.addEventListener('mouseout',function(e){ var p=e.target.closest?e.target.closest('.opis-pill'):null; if(p) pop.style.display='none'; });
})();
