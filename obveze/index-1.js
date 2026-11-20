(function(){
var ENDPOINT = 'https://script.google.com/macros/s/AKfycbz0F81jPd8rl9PnO9hwbpXd0R49YESIA2iQHqSGytqK1l9PqEXNvAWrwOSfhjXq3kd51Q/exec';
var OWNERS = ['Dom','Lucija','Stefan','Silva','Davor','Ankica','Natasa','Nino','AnaT','Tamara','Private'];
var RITAM_LBL = {dnevno:'dnevno',tjedno:'tjedno',mjesecno:'mjesecno',kvartalno:'kvartalno',polugodisnje:'polugodisnje',godisnje:'godisnje'};
var DATA = {registar:[],povijest:[],ritmovi:[]};
var filter = 'all';

function el(id){return document.getElementById(id);}
function banner(t){var b=el('banner');b.textContent=t;b.style.display='block';setTimeout(function(){b.style.display='none';},2600);}
function getSecret(){return localStorage.getItem('obveze_secret')||'';}

function fetchRetry_(url,tries){
  return fetch(url,{method:'GET'}).then(function(r){return r.text();}).then(function(txt){
    var s=String(txt).trim();
    if(s.charAt(0)==='{'||s.charAt(0)==='[') return JSON.parse(s);
    throw new Error('Google trenutno ne odgovara');
  }).catch(function(e){
    if(tries>1) return new Promise(function(res){setTimeout(res,1500);}).then(function(){return fetchRetry_(url,tries-1);});
    throw e;
  });
}
function api(p){
  p.secret=getSecret();
  var qs=Object.keys(p).map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(p[k]);}).join('&');
  return fetchRetry_(ENDPOINT+'?'+qs, 3);
}

function pad(n){return ('0'+n).slice(-2);}
function periodKeys(ritam,n){
  var out=[],now=new Date(),y=now.getFullYear(),m=now.getMonth();
  var i;
  if(ritam==='mjesecno'){for(i=n-1;i>=0;i--){var d=new Date(y,m-i,1);out.push({k:d.getFullYear()+'-'+pad(d.getMonth()+1),l:pad(d.getMonth()+1)});}}
  else if(ritam==='kvartalno'){var q=Math.floor(m/3);for(i=n-1;i>=0;i--){var qq=q-i,yy=y;while(qq<0){qq+=4;yy--;}out.push({k:yy+'-Q'+(qq+1),l:'Q'+(qq+1)});}}
  else if(ritam==='polugodisnje'){var h=m<6?0:1;for(i=n-1;i>=0;i--){var hh=h-i,yh=y;while(hh<0){hh+=2;yh--;}out.push({k:yh+'-H'+(hh+1),l:'H'+(hh+1)});}}
  else if(ritam==='godisnje'){for(i=n-1;i>=0;i--){out.push({k:String(y-i),l:String(y-i).slice(2)});}}
  else if(ritam==='tjedno'){for(i=n-1;i>=0;i--){var dt=new Date(y,m,now.getDate()-i*7);var j1=new Date(dt.getFullYear(),0,1);var tj=Math.ceil((((dt-j1)/86400000)+j1.getDay()+1)/7);out.push({k:dt.getFullYear()+'-T'+pad(tj),l:'T'+tj});}}
  else {for(i=n-1;i>=0;i--){var dd=new Date(y,m,now.getDate()-i);out.push({k:dd.getFullYear()+'-'+pad(dd.getMonth()+1)+'-'+pad(dd.getDate()),l:String(dd.getDate())});}}
  return out;
}

function povFor(id){
  var m={};
  DATA.povijest.forEach(function(h){ if(String(h.obvezaId)===String(id)) m[String(h.period)]=String(h.status||''); });
  return m;
}

function render(){
  var tb=el('tb'); tb.innerHTML='';
  var list=DATA.registar.filter(function(o){
    var on=String(o.aktivna).toUpperCase().indexOf('D')===0;
    if(filter==='on') return on;
    if(filter==='off') return !on;
    return true;
  });

  list.forEach(function(o){
    var on=String(o.aktivna).toUpperCase().indexOf('D')===0;
    var tr=document.createElement('tr'); if(!on) tr.className='off';
    var hist=povFor(o.id);
    var keys=periodKeys(String(o.ritam),12);
    var cells=keys.map(function(p){
      var st=hist[p.k]||'';
      var cls=st==='isporuceno'?'isporuceno':st==='kasnilo'?'kasnilo':st==='propusteno'?'propusteno':st==='ceka'?'ceka':'none';
      return '<div class="cell '+cls+'" title="'+p.k+' - '+(st||'nema')+'">'+p.l+'</div>';
    }).join('');

    var ritOpts=Object.keys(RITAM_LBL).map(function(r){return '<option value="'+r+'"'+(String(o.ritam)===r?' selected':'')+'>'+RITAM_LBL[r]+'</option>';}).join('');
    var ownOpts=OWNERS.map(function(w){return '<option'+(String(o.owner)===w?' selected':'')+'>'+w+'</option>';}).join('');

    tr.innerHTML =
      '<td class="naziv"><input class="f-naziv" value="'+String(o.naziv||'').replace(/"/g,'&quot;')+'"></td>'+
      '<td class="w80"><select class="f-owner">'+ownOpts+'</select></td>'+
      '<td class="w80"><select class="f-ritam">'+ritOpts+'</select></td>'+
      '<td class="w60"><input class="f-rok" type="number" min="1" max="31" value="'+(o.rokDan||1)+'"></td>'+
      '<td class="w70"><select class="f-akt"><option value="DA"'+(on?' selected':'')+'>DA</option><option value="NE"'+(!on?' selected':'')+'>NE</option></select></td>'+
      '<td><div class="grid">'+cells+'</div></td>'+
      '<td><button class="del" title="Obrisi">&#10005;</button></td>';

    tr.querySelectorAll('.f-naziv,.f-owner,.f-ritam,.f-rok,.f-akt').forEach(function(inp){
      inp.addEventListener('change',function(){
        api({action:'update',id:o.id,
          naziv:tr.querySelector('.f-naziv').value,
          owner:tr.querySelector('.f-owner').value,
          ritam:tr.querySelector('.f-ritam').value,
          rokDan:tr.querySelector('.f-rok').value,
          aktivna:tr.querySelector('.f-akt').value
        }).then(function(){banner('Spremljeno');load();}).catch(function(){banner('Ne mogu spremiti');});
      });
    });
    tr.querySelector('.del').addEventListener('click',function(){
      if(!confirm('Obrisati obvezu "'+o.naziv+'"? Povijest ostaje.')) return;
      api({action:'delete',id:o.id}).then(function(){banner('Obrisano');load();});
    });
    tb.appendChild(tr);
  });

  var akt=DATA.registar.filter(function(o){return String(o.aktivna).toUpperCase().indexOf('D')===0;}).length;
  var prop=DATA.povijest.filter(function(h){return String(h.status)==='propusteno';}).length;
  var ceka=DATA.povijest.filter(function(h){return String(h.status)==='ceka';}).length;
  el('sub').textContent=DATA.registar.length+' obveza · '+akt+' aktivnih · '+ceka+' u tijeku · '+prop+' propusteno ukupno';
  el('foot').textContent=DATA.lastRun?('Zadnja provjera: '+DATA.lastRun):'Dnevna provjera jos nije odradena.';
}

function load(){
  api({action:'list'}).then(function(res){
    if(res.error){ banner(res.error); if(/kod/i.test(res.error)){localStorage.removeItem('obveze_secret');location.reload();} return; }
    DATA=res; render();
  }).catch(function(){ banner('Ne mogu ucitati registar'); });
}

function boot(){
  el('app').style.display='block'; el('gate').style.display='none';
  var os=el('n-owner'); OWNERS.forEach(function(w){var o=document.createElement('option');o.textContent=w;os.appendChild(o);});
  var rs=el('n-ritam'); Object.keys(RITAM_LBL).forEach(function(r){var o=document.createElement('option');o.value=r;o.textContent=RITAM_LBL[r];rs.appendChild(o);});
  rs.value='mjesecno';
  load();
}
el('gate-go').addEventListener('click',function(){
  var v=el('gate-input').value.trim(); if(!v) return;
  localStorage.setItem('obveze_secret',v); boot();
});
el('gate-input').addEventListener('keydown',function(e){ if(e.key==='Enter') el('gate-go').click(); });

document.querySelectorAll('.chip').forEach(function(b){
  b.addEventListener('click',function(){
    document.querySelectorAll('.chip').forEach(function(x){x.classList.remove('on');});
    b.classList.add('on'); filter=b.dataset.f; render();
  });
});
el('toggle-add').addEventListener('click',function(){ el('addbox').classList.toggle('show'); });
el('reload').addEventListener('click',load);
el('run').addEventListener('click',function(){
  banner('Provjera pokrenuta, moze potrajati...');
  api({action:'run'}).then(function(r){ banner(r.error?r.error:'Gotovo'); load(); }).catch(function(){banner('Nije proslo, probaj opet');});
});
el('n-save').addEventListener('click',function(){
  var naziv=el('n-naziv').value.trim(); if(!naziv){banner('Upisi naziv');return;}
  api({action:'add',naziv:naziv,owner:el('n-owner').value,ritam:el('n-ritam').value,
       rokDan:el('n-rok').value,aktivna:el('n-akt').value,napomena:el('n-nap').value})
   .then(function(){ el('n-naziv').value=''; el('n-nap').value=''; banner('Dodano'); load(); });
});

if(getSecret()) boot();
})();
