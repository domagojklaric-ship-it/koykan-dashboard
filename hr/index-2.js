/* ---- provjera verzije: javi kad je deployana novija stranica ---- */
(function(){
  var tag0 = null, last = 0;
  function bar(){
    if(document.getElementById('vupd')) return;
    var d = document.createElement('div');
    d.id = 'vupd';
    d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#1f6fb2;color:#fff;font:600 13px/1.4 Segoe UI,Arial,sans-serif;padding:10px 14px;display:flex;gap:12px;align-items:center;justify-content:center;box-shadow:0 -2px 12px rgba(0,0,0,.35)';
    var s = document.createElement('span');
    s.textContent = 'Dashboard je a\u017euriran. Osvje\u017ei stranicu da dobije\u0161 zadnju verziju.';
    d.appendChild(s);
    var b = document.createElement('button');
    b.textContent = 'Osvje\u017ei sada';
    b.style.cssText = 'background:#fff;color:#1f6fb2;border:0;border-radius:6px;padding:6px 12px;font:700 13px Segoe UI,Arial,sans-serif;cursor:pointer';
    b.addEventListener('click', function(){ location.reload(); });
    d.appendChild(b);
    document.body.appendChild(d);
  }
  function check(){
    var now = Date.now(); if(now - last < 60000) return; last = now;
    fetch(location.pathname + '?vc=' + now, {method:'HEAD', cache:'no-store'}).then(function(r){
      var t = r.headers.get('etag') || r.headers.get('last-modified') || '';
      if(!t) return;
      if(tag0 === null){ tag0 = t; return; }
      if(t !== tag0) bar();
    }).catch(function(){});
  }
  check();
  setInterval(check, 600000);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) check(); });
})();
