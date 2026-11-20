/* app shell: nositelji i sync/odjava idu u bočni izbornik */
(function(){
  var slot=document.getElementById('ky-side-slot'), foot=document.getElementById('ky-side-foot');
  if(slot) slot.appendChild(document.getElementById('owner-filters'));
  if(foot) ['synced','refresh','logout'].forEach(function(id){ var n=document.getElementById(id); if(n) foot.appendChild(n); });
  var lo=document.getElementById('logout'); if(lo) lo.textContent='Odjava';
})();
