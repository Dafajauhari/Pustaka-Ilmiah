(function(){
'use strict';
var DATA = PI.DATA, FIELD_ORDER = PI.FIELD_ORDER, FIELD_COLOR = PI.FIELD_COLOR, EXAMPLES = PI.EXAMPLES;

/* ---------- Util ---------- */
function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function load(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
function store(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
var toastT;
function toast(msg){var t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){t.hidden=true;},2400);}
function fc(b){return FIELD_COLOR[b]||FIELD_COLOR.Lainnya;}
var FIELD_TEXT={Sosial:'#1B1B1B'};
function ft(b){return FIELD_TEXT[b]||'#FFFFFF';}

/* ---------- State ---------- */
var mine=load('pi:mine',[]);
var saved=load('pi:saved',[]);
var cmp=load('pi:cmp',[]);
var PAGE=24;
var state={tab:'lib',q:'',field:'Semua',sort:'new',cur:null,shown:PAGE};
var EXTRA_KEY='pi:extra:v1';
var extra=[],_all=null,_map=null,spinesDone=false;
var RM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function inval(){_all=null;_map=null;}
function all(){return _all||(_all=DATA.concat(extra,mine));}
function byId(id){if(!_map){_map={};all().forEach(function(a){_map[a.id]=a;});}return _map[id]||null;}
function fieldList(){
  var seen={},out=[];
  FIELD_ORDER.concat(all().map(function(a){return a.bidang;})).forEach(function(f){if(!seen[f]&&all().some(function(a){return a.bidang===f;})){seen[f]=1;out.push(f);}});
  return out;
}

/* ---------- Markdown ringan (aman) ---------- */
function inline(s){
  s=s.replace(/\*\*(.+?)\*\*/g,'<mark>$1</mark>');
  s=s.replace(/\[([auo][a-z0-9]{2,})\]/g,function(m,id){var a=byId(id);return a?'<button class="ref" data-act="open" data-id="'+id+'">'+esc(a.pendek+' '+a.tahun)+'</button>':m;});
  return s;
}
function md(src){
  var lines=esc(src).split('\n'),html='',list=null,m;
  function close(){if(list){html+='</'+list+'>';list=null;}}
  lines.forEach(function(ln){
    var t=ln.trim();
    if(!t){close();return;}
    if((m=t.match(/^[-•]\s+(.*)$/))||(m=t.match(/^\*\s+(.*)$/))){if(list!=='ul'){close();html+='<ul>';list='ul';}html+='<li>'+inline(m[1])+'</li>';}
    else if((m=t.match(/^\d+[.)]\s+(.*)$/))){if(list!=='ol'){close();html+='<ol>';list='ol';}html+='<li>'+inline(m[1])+'</li>';}
    else if((m=t.match(/^#{1,4}\s+(.*)$/))){close();html+='<h4>'+inline(m[1])+'</h4>';}
    else{close();html+='<p>'+inline(t)+'</p>';}
  });
  close();return html;
}

/* ---------- Pencarian ---------- */
var SYN={umpan:['feedback'],balik:['feedback'],motivasi:['motivation'],hoaks:['misinformation','fake news','rumor'],obesitas:['obesity'],
  belajar:['learning'],pembelajaran:['learning'],siswa:['student'],murid:['student'],mahasiswa:['student'],guru:['teacher'],sekolah:['school'],
  pendidikan:['education'],kesehatan:['health'],penyakit:['disease'],kanker:['cancer'],vaksin:['vaccine'],jantung:['heart','cardio'],
  lingkungan:['environment'],iklim:['climate'],hutan:['forest'],energi:['energy'],keberlanjutan:['sustainab'],
  ekonomi:['econom'],pasar:['market'],pajak:['tax'],kemiskinan:['poverty'],bank:['bank'],
  sosial:['social'],masyarakat:['society','communit'],budaya:['culture'],ketimpangan:['inequality'],
  psikologi:['psycholog'],stres:['stress'],depresi:['depression'],emosi:['emotion'],perilaku:['behavior','behaviour'],memori:['memory'],
  teknologi:['technolog'],kecerdasan:['intelligence'],buatan:['artificial'],komputer:['comput'],data:['data'],
  anak:['child'],remaja:['adolescen'],perempuan:['women','gender'],kerja:['work','employ'],kepemimpinan:['leadership']};
function groupsOf(text){
  return String(text||'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(function(t){return [t].concat(SYN[t]||[]);});
}
function groups(){return groupsOf(state.q);}
function tokens(){var o=[];groups().forEach(function(g){o=o.concat(g);});return o;}
function hl(text){
  var tk=tokens();if(!tk.length)return esc(text);
  var re=new RegExp('('+tk.map(function(t){return t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('|')+')','gi');
  return String(text).split(re).map(function(p,i){return i%2?'<mark>'+esc(p)+'</mark>':esc(p);}).join('');
}
function filtered(){
  var gr=groups();
  var r=all().filter(function(a){
    if(state.field!=='Semua'&&a.bidang!==state.field)return false;
    if(!gr.length)return true;
    var h=(a.judul+' '+a.penulis+' '+a.jurnal+' '+a.bidang+' '+(a.tags||[]).join(' ')+' '+a.ringkas).toLowerCase();
    return gr.every(function(g){return g.some(function(t){return h.indexOf(t)>-1;});});
  });
  r.sort(function(a,b){
    if(state.sort==='az')return a.judul.localeCompare(b.judul,'id');
    var ya=Number(a.tahun)||0,yb=Number(b.tahun)||0;
    return state.sort==='old'?ya-yb:yb-ya;
  });
  return r;
}

/* ---------- Render pustaka ---------- */
function metaLine(a){
  var y=a.tahun?', '+esc(a.tahun):'';
  return esc(a.pendek)+y+'. <i>'+esc(a.jurnal)+'</i>';
}
function rowHtml(a,withSum,mode){
  var tg=(a.tags||[]).slice(0,3).map(function(t){return '<span class="tg">'+esc(t)+'</span>';}).join('');
  var sv='<button class="btn sm" data-act="save" data-id="'+a.id+'" aria-pressed="false">Simpan</button>';
  var cp='<button class="btn sm" data-act="cmp" data-id="'+a.id+'" aria-pressed="false">Bandingkan</button>';
  var dl='<button class="btn sm" data-act="delmine" data-id="'+a.id+'">Hapus</button>';
  return '<article class="card rv" style="--c:'+fc(a.bidang)+';--cx:'+ft(a.bidang)+'">'+
    '<div class="card-top"><span class="ftag">'+esc(a.bidang)+'</span>'+(a.mine?'<span class="badge">Artikelmu</span>':'')+(a.ext?'<span class="badge" title="Abstrak berbahasa Inggris">EN</span>':'')+(a.tahun?'<span class="yr" aria-hidden="true">'+esc(a.tahun)+'</span>':'')+'</div>'+
    '<h3><button class="ttl" data-act="open" data-id="'+a.id+'">'+hl(a.judul)+'</button></h3>'+
    '<p class="meta">'+metaLine(a)+'</p>'+
    (withSum?'<p class="sum">'+hl(a.ringkas)+'</p>':'')+
    (tg?'<div class="tgs">'+tg+'</div>':'')+
    '<div class="acts">'+(mode==='mine'?cp+dl:sv+cp)+'</div></article>';
}
var SPINE_H=[228,212,222,214,232,216,224,208,230];
function renderChips(){
  var fl=['Semua'].concat(fieldList()),total=all().length;
  $('#chips').innerHTML=fl.map(function(f,i){
    var n=f==='Semua'?total:all().filter(function(a){return a.bidang===f;}).length;
    var c=f==='Semua'?'var(--ink)':fc(f),x=f==='Semua'?'var(--paper)':ft(f);
    return '<button class="spine'+(spinesDone?'':' spine-in')+'" data-act="chip" data-v="'+esc(f)+'" aria-pressed="'+(state.field===f)+'" style="--c:'+c+';--cx:'+x+';--h:'+SPINE_H[i%SPINE_H.length]+'px;--i:'+i+'"><span class="sl">'+esc(f)+'</span><span class="sn">'+n+'</span></button>';
  }).join('');
  spinesDone=true;
  countTo($('#count'),total,fl.length-1);
}
var cntLast=0,cntRaf;
function countTo(el,total,nf){
  cancelAnimationFrame(cntRaf);
  var from=cntLast,t0=null,dur=900;cntLast=total;
  function txt(n){return n.toLocaleString('id-ID')+' artikel di '+nf+' bidang';}
  if(RM||from===total){el.textContent=txt(total);return;}
  function step(t){if(t0===null)t0=t;var p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=txt(Math.round(from+(total-from)*e));if(p<1)cntRaf=requestAnimationFrame(step);}
  cntRaf=requestAnimationFrame(step);
}
function renderSpot(){
  var el=$('#spot');
  if(state.q||state.field!=='Semua'){el.hidden=true;return;}
  var a=DATA[Math.floor(Date.now()/864e5)%DATA.length];
  var first=a.ringkas.indexOf('. ')>-1?a.ringkas.slice(0,a.ringkas.indexOf('. ')+1):a.ringkas;
  el.hidden=false;
  el.innerHTML='<div class="spot-in" style="--c:'+fc(a.bidang)+';--cx:'+ft(a.bidang)+'">'+
    '<p class="spot-label">Sorotan hari ini: '+esc(a.bidang)+'</p>'+
    '<h3>'+esc(a.judul)+'</h3>'+
    '<p class="meta">'+metaLine(a)+'</p>'+
    '<p class="sp-sum">'+esc(first)+'</p>'+
    '<button class="btn" data-act="open" data-id="'+a.id+'">Baca ringkasan</button></div>';
}
function renderList(){
  var r=filtered(),n=Math.min(state.shown,r.length);
  $('#found').textContent=r.length.toLocaleString('id-ID')+' artikel';
  $('#list').innerHTML=r.length?r.slice(0,n).map(function(a){return rowHtml(a,true);}).join(''):'<p class="empty">Tidak ada artikel yang cocok. Coba kata kunci lain, pilih Semua bidang, atau minta AI di tab Gagasan.</p>';
  var mo=$('#more');
  if(r.length>n){mo.hidden=false;mo.innerHTML='<button class="btn" data-act="more">Tampilkan '+Math.min(PAGE,r.length-n)+' lagi <span class="muted">(tersisa '+(r.length-n).toLocaleString('id-ID')+')</span></button>';}
  else{mo.hidden=true;mo.innerHTML='';}
  renderSpot();
  refreshToggles();
  observe();
}
function relist(){state.shown=PAGE;renderList();updateQ();}
function updateQ(){
  var qi=$('#qinfo'),has=!!state.q.trim();
  $('#qclear').hidden=!state.q;
  if(!has){qi.hidden=true;qi.innerHTML='';return;}
  var n=filtered().length;
  qi.hidden=false;
  qi.innerHTML=n?'<b>'+n.toLocaleString('id-ID')+'</b> hasil untuk &ldquo;'+esc(state.q.trim())+'&rdquo; <button class="btn sm" data-act="goto">Lihat hasil</button>':'Tidak ada hasil untuk &ldquo;'+esc(state.q.trim())+'&rdquo;. Coba kata kunci lain.';
}
function gotoResults(){$('.bar').scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});}
function showMore(){
  var r=filtered(),from=Math.min(state.shown,r.length);
  state.shown+=PAGE;
  var to=Math.min(state.shown,r.length);
  $('#list').insertAdjacentHTML('beforeend',r.slice(from,to).map(function(a){return rowHtml(a,true);}).join(''));
  var mo=$('#more');
  if(r.length>to)mo.innerHTML='<button class="btn" data-act="more">Tampilkan '+Math.min(PAGE,r.length-to)+' lagi <span class="muted">(tersisa '+(r.length-to).toLocaleString('id-ID')+')</span></button>';
  else{mo.hidden=true;mo.innerHTML='';}
  refreshToggles();observe();
}
/* Kartu muncul bertahap saat masuk layar */
var io=null;
function observe(){
  var cards=$$('.rv:not(.in)');
  if(!cards.length)return;
  if(RM||!('IntersectionObserver' in window)){cards.forEach(function(c){c.classList.add('in');});return;}
  if(!io)io=new IntersectionObserver(function(es){
    var k=0;
    es.forEach(function(e){if(e.isIntersecting){e.target.style.setProperty('--d',Math.min(k++,6));e.target.classList.add('in');io.unobserve(e.target);}});
  },{rootMargin:'0px 0px -6% 0px',threshold:0.05});
  cards.forEach(function(c){io.observe(c);});
}
function refreshToggles(){
  $$('[data-act=save]').forEach(function(b){var on=saved.indexOf(b.dataset.id)>-1;b.setAttribute('aria-pressed',on);b.textContent=on?'Tersimpan':'Simpan';});
  $$('[data-act=cmp]').forEach(function(b){var on=cmp.indexOf(b.dataset.id)>-1;b.setAttribute('aria-pressed',on);b.textContent=on?'Dipilih':'Bandingkan';});
  var bc=$('#bCmp'),bs=$('#bSv');
  bc.textContent=cmp.length;bc.hidden=!cmp.length;
  bs.textContent=saved.length;bs.hidden=!saved.length;
}
function pop(sel,id){$$(sel+'[data-id="'+id+'"]').forEach(function(b){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');});}
function toggleSave(id){
  var i=saved.indexOf(id);
  if(i>-1)saved.splice(i,1);else saved.push(id);
  store('pi:saved',saved);refreshToggles();renderSaved();pop('[data-act=save]',id);bump('#bSv');
}
function bump(sel){var e=$(sel);if(!e)return;e.classList.remove('bump');void e.offsetWidth;e.classList.add('bump');}
function toggleCmp(id){
  var i=cmp.indexOf(id);
  if(i>-1)cmp.splice(i,1);
  else{if(cmp.length>=4){toast('Maksimal 4 artikel untuk dibandingkan');return;}cmp.push(id);}
  store('pi:cmp',cmp);refreshToggles();renderCmp();pop('[data-act=cmp]',id);bump('#bCmp');
}

/* ---------- Bandingkan ---------- */
var ART={
  cmp:'<svg viewBox="0 0 120 80" aria-hidden="true"><rect x="12" y="14" width="40" height="56" rx="4" fill="#2F55D4"/><rect x="18" y="22" width="28" height="4" rx="2" fill="#fff" opacity=".5"/><rect x="18" y="30" width="22" height="4" rx="2" fill="#fff" opacity=".35"/><rect x="68" y="14" width="40" height="56" rx="4" fill="#C2255C"/><rect x="74" y="22" width="28" height="4" rx="2" fill="#fff" opacity=".5"/><rect x="74" y="30" width="22" height="4" rx="2" fill="#fff" opacity=".35"/><path d="M56 40h8M61 35l5 5-5 5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sv:'<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M40 8h40a4 4 0 0 1 4 4v62l-24-16-24 16V12a4 4 0 0 1 4-4z" fill="#0B7C86"/><rect x="50" y="22" width="20" height="4" rx="2" fill="#fff" opacity=".5"/><rect x="50" y="31" width="14" height="4" rx="2" fill="#fff" opacity=".35"/></svg>',
  mine:'<svg viewBox="0 0 120 80" aria-hidden="true"><rect x="24" y="12" width="56" height="60" rx="5" fill="#F2A900"/><rect x="32" y="24" width="40" height="4" rx="2" fill="#fff" opacity=".6"/><rect x="32" y="33" width="30" height="4" rx="2" fill="#fff" opacity=".45"/><path d="M82 62l-3 12 12-3 18-34-9-9z" fill="#C2255C"/></svg>'
};
function emptyBox(kind,text,btn){
  return '<div class="empty-art"><div class="art">'+ART[kind]+'</div><p>'+text+'</p>'+(btn||'')+'</div>';
}
function cmpItems(){return cmp.map(byId).filter(Boolean);}
function cmpTable(items){
  function row(label,fn){return '<tr><th scope="row">'+label+'</th>'+items.map(function(a){return '<td>'+fn(a)+'</td>';}).join('')+'</tr>';}
  return '<div class="tbl-wrap"><table><thead><tr><th></th>'+items.map(function(a){return '<th scope="col" class="colh" style="--c:'+fc(a.bidang)+';--cx:'+ft(a.bidang)+'"><button class="ttl sm" data-act="open" data-id="'+a.id+'">'+esc(a.pendek+' '+a.tahun)+'</button></th>';}).join('')+'</tr></thead><tbody>'+
    row('Bidang',function(a){return esc(a.bidang);})+
    row('Jurnal',function(a){return esc(a.jurnal);})+
    row('Metode',function(a){return esc(a.metode);})+
    row('Temuan utama',function(a){return a.temuan&&a.temuan.length?'<ul>'+a.temuan.slice(0,2).map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul>':esc(a.ringkas.length>170?a.ringkas.slice(0,170)+'…':a.ringkas);})+
    '</tbody></table></div>';
}
function renderCmp(){
  var items=cmpItems();
  if(!items.length){
    $('#cmpTray').innerHTML=emptyBox('cmp','Belum ada artikel dipilih. Ketuk <b>Bandingkan</b> pada minimal dua artikel di Pustaka (maksimal empat).','<button class="btn primary" data-tab="lib">Pilih dari Pustaka</button>');
    $('#cmpTable').innerHTML='';$('#cmpAI').hidden=true;return;
  }
  var slots='';
  for(var i=0;i<4;i++){
    var a=items[i];
    slots+=a?'<div class="slot on" style="--c:'+fc(a.bidang)+';--cx:'+ft(a.bidang)+'"><span class="slot-f">'+esc(a.bidang)+'</span><span class="t">'+esc(a.pendek+' '+a.tahun)+'</span><button class="btn sm" data-act="cmp" data-id="'+a.id+'" aria-label="Hapus dari perbandingan">Hapus</button></div>'
      :'<div class="slot"><span class="muted small">Slot '+(i+1)+' kosong</span></div>';
  }
  $('#cmpTray').innerHTML='<div class="slots">'+slots+'</div>'+(items.length<2?'<p class="fine">Pilih satu artikel lagi untuk mulai membandingkan.</p>':'');
  $('#cmpTable').innerHTML=items.length>=2?cmpTable(items):'';
  $('#cmpAI').hidden=items.length<2;
}

/* ---------- Simpanan & artikel sendiri ---------- */
function renderSaved(){
  var l=saved.map(byId).filter(Boolean);
  $('#svList').innerHTML=l.length?l.map(function(a){return rowHtml(a,false);}).join(''):emptyBox('sv','Belum ada artikel tersimpan. Ketuk <b>Simpan</b> pada artikel mana pun.','<button class="btn primary" data-tab="lib">Jelajahi Pustaka</button>');
  $('#mineList').innerHTML=mine.length?mine.map(function(a){return rowHtml(a,false,'mine');}).join(''):emptyBox('mine','Artikel yang kamu tambahkan lewat formulir di atas akan muncul di sini.');
  var fs={};l.forEach(function(a){fs[a.bidang]=1;});
  $('#stSv').textContent=l.length;$('#stMine').textContent=mine.length;$('#stFld').textContent=Object.keys(fs).length;
  refreshToggles();observe();
}
function fillBidang(){
  var opts=FIELD_ORDER.concat(['Lainnya']);
  $('#nBidang').innerHTML=opts.map(function(f){return '<option>'+esc(f)+'</option>';}).join('');
}
function addMine(){
  var judul=$('#nJudul').value.trim(),ring=$('#nRingkas').value.trim();
  if(!judul||ring.length<20){toast('Isi judul dan abstrak atau catatan (min. 20 karakter)');return;}
  var pen=$('#nPenulis').value.trim()||'Tanpa penulis';
  var first=pen.split(/[,&]/)[0].trim()||'Tanpa penulis';
  var a={id:'u'+Date.now(),bidang:$('#nBidang').value,pendek:first,penulis:pen,tahun:$('#nTahun').value.trim(),judul:judul,jurnal:$('#nJurnal').value.trim()||'Sumber sendiri',rinci:'',link:'',ringkas:ring,metode:'Catatan pengguna',tags:[],temuan:[],mine:true};
  mine.push(a);inval();store('pi:mine',mine);
  ['nJudul','nPenulis','nJurnal','nTahun','nRingkas'].forEach(function(id){$('#'+id).value='';});
  renderChips();relist();renderSaved();toast('Artikel ditambahkan ke pustaka');
}
function delMine(id){
  mine=mine.filter(function(a){return a.id!==id;});inval();
  saved=saved.filter(function(x){return x!==id;});cmp=cmp.filter(function(x){return x!==id;});
  store('pi:mine',mine);store('pi:saved',saved);store('pi:cmp',cmp);
  renderChips();relist();renderSaved();renderCmp();
}

/* ---------- AI ---------- */
var CFG = window.PI_CONFIG || {};
var ctls = {};
var RULES = 'Kamu asisten riset untuk mahasiswa Indonesia di dalam aplikasi pustaka jurnal. Jawab dalam bahasa Indonesia yang jelas dan ringkas. Gunakan data artikel yang diberikan sebagai dasar. Jika menambahkan dari pengetahuan umum, beri tanda "(di luar data aplikasi)" dan hanya bila kamu yakin. Jangan mengarang angka, kutipan, atau referensi. Format: paragraf pendek, daftar dengan tanda "- ", dan **tebal** hanya untuk frasa kunci (maksimal 6). Jangan pakai judul markdown (#) atau tabel. Bila merujuk artikel dari daftar, tulis id-nya dalam kurung siku, misalnya [a03].';
function digest(a){
  return '['+a.id+'] '+a.judul+' — '+a.penulis+' ('+a.tahun+'), '+a.jurnal+'. Bidang: '+a.bidang+'. Metode: '+a.metode+'. Ringkasan: '+a.ringkas+(a.temuan&&a.temuan.length?' Temuan: '+a.temuan.join('; ')+'.':'');
}
function errCopy(c){
  return c==='rate_limited' ? 'Terlalu banyak permintaan. Coba lagi beberapa menit lagi.' : 'AI tidak dapat dihubungi. Coba lagi, atau periksa server dan config.js.';
}
async function ask(o){
  if(ctls[o.key])ctls[o.key].abort();
  var ctl=new AbortController();ctls[o.key]=ctl;
  o.out.hidden=false;o.out.innerHTML='';o.stop.hidden=true;
  if(!CFG.aiEndpoint){
    o.out.innerHTML=md(o.offline());
    o.status.textContent='Mode offline: jawaban dari data bawaan, bukan AI. Isi aiEndpoint di config.js untuk mengaktifkan AI.';
    delete ctls[o.key];return;
  }
  o.status.textContent='Berpikir…';
  o.stop.hidden=false;o.stop.onclick=function(){ctl.abort();};
  o.go.forEach(function(b){b.disabled=true;});
  try{
    var res=await fetch(CFG.aiEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:o.prompt}),signal:ctl.signal});
    var data=await res.json().catch(function(){return {};});
    if(!res.ok||!data.text){throw {code:res.status===429?'rate_limited':'upstream_error'};}
    o.out.innerHTML=md(data.text);o.status.textContent='';
  }catch(e){
    o.out.hidden=true;
    o.status.textContent=(e&&e.name==='AbortError')?'':errCopy(e&&e.code);
  }finally{
    o.stop.hidden=true;
    o.go.forEach(function(b){b.disabled=false;});
    if(ctls[o.key]===ctl)delete ctls[o.key];
  }
}

/* Mode offline: tanpa AI, memakai data bawaan */
function firstSentence(s){var i=s.indexOf('. ');return i>-1?s.slice(0,i+1):s;}
function rankBy(t,n){
  var gr=groupsOf(t).filter(function(g){return g[0].length>2;});
  return all().map(function(a){
    var h=(a.judul+' '+(a.tags||[]).join(' ')+' '+a.ringkas+' '+a.bidang).toLowerCase(),sc=0;
    gr.forEach(function(g){if(g.some(function(w){return h.indexOf(w)>-1;}))sc++;});
    return {a:a,s:sc};
  }).filter(function(x){return x.s>0;}).sort(function(x,y){return y.s-x.s;}).slice(0,n);
}
function offIdea(t){
  var sc=rankBy(t,4);
  if(!sc.length)return 'Tidak ada artikel di koleksi yang cocok dengan kata-katamu. Coba kata kunci lain, atau tambahkan artikelmu di tab Simpanan.';
  var tags={};sc.forEach(function(x){(x.a.tags||[]).forEach(function(g){tags[g]=1;});});
  return '**Artikel yang paling mendekati** (dicocokkan lewat kata kunci, bukan pemahaman AI):\n'+
    sc.map(function(x){return '- ['+x.a.id+'] '+firstSentence(x.a.ringkas);}).join('\n')+
    (Object.keys(tags).length?'\n\n**Kata kunci untuk pencarian lanjutan:** '+Object.keys(tags).slice(0,6).join(', ')+'.':'')+'\n\nUntuk gagasan dan sudut pandang baru, aktifkan mode AI.';
}
function offSum(a,lv){
  var tm=a.temuan||[];
  if(lv==='singkat')return '**Ringkasan singkat:** '+firstSentence(a.ringkas)+(tm.length?'\n\n'+tm.slice(0,2).map(function(x){return '- '+x;}).join('\n'):'');
  return '**Ringkasan:** '+a.ringkas+(tm.length?'\n\n**Temuan utama:**\n'+tm.map(function(x){return '- '+x;}).join('\n'):'')+(a.mine?'':'\n\n**Metode:** '+a.metode);
}
function offQa(a,q){
  var tk=q.toLowerCase().split(/[^a-z0-9]+/).filter(function(w){return w.length>3;});
  var parts=(a.ringkas.match(/[^.]+\.?/g)||[a.ringkas]).map(function(x){return x.trim();}).concat(a.temuan||[]).concat([a.metode]);
  var hit=parts.filter(function(p){var l=p.toLowerCase();return tk.some(function(w){return l.indexOf(w)>-1;});}).slice(0,3);
  if(!hit.length)return 'Bagian data bawaan artikel ini tidak memuat jawaban untuk pertanyaan itu. Aktifkan mode AI, atau baca artikel aslinya lewat tautan.';
  return '**Bagian data yang berkaitan dengan pertanyaanmu:**\n'+hit.map(function(h){return '- '+h;}).join('\n')+'\n\nUntuk jawaban yang dirangkai, aktifkan mode AI.';
}
function offCmp(items){
  return items.map(function(a){
    return '**'+a.pendek+' '+a.tahun+'**\n- Metode: '+a.metode+'\n- Temuan: '+((a.temuan&&a.temuan[0])||firstSentence(a.ringkas));
  }).join('\n\n')+'\n\nUntuk analisis kekuatan, keterbatasan, dan kapan memakai yang mana, aktifkan mode AI.';
}

function doIdea(){
  var t=$('#idea').value.trim();
  if(t.length<8){toast('Tulis topik atau gagasanmu dulu');return;}
  var pool=rankBy(t,30).map(function(x){return x.a;});DATA.forEach(function(a){if(pool.length<30&&pool.indexOf(a)<0)pool.push(a);});
  var lib=pool.map(function(a){return '['+a.id+'] '+a.bidang+' | '+a.judul+' — '+a.penulis+' ('+a.tahun+'). '+(a.ringkas.length>320?a.ringkas.slice(0,320)+'…':a.ringkas);}).join('\n');
  var p=RULES+'\n\nPENGGUNA MENCARI GAGASAN:\n'+t+'\n\nARTIKEL PALING RELEVAN DARI KOLEKSI (dipilih dari ±1000 artikel):\n'+lib+
    '\n\nTUGASMU, dalam urutan ini:\n1) Artikel paling relevan (maksimal 4): satu kalimat alasan per artikel, sebut id-nya.\n2) Tiga gagasan atau sudut pandang yang bisa dikembangkan untuk tugas atau penelitian pengguna, masing-masing menyebut artikel yang mendasarinya.\n3) Celah: apa yang belum terjawab oleh koleksi ini, ditambah 3 kata kunci pencarian untuk Google Scholar, Garuda, atau SINTA.\nJika koleksi hampir tidak relevan, katakan terus terang dan jangan memaksakan artikel.\nTulis tiap bagian dengan kalimat pembuka tebal singkat.';
  ask({key:'idea',prompt:p,offline:function(){return offIdea(t);},out:$('#ideaOut'),status:$('#ideaStatus'),stop:$('#ideaStop'),go:[$('#ideaGo')]});
}
function doCmp(){
  var items=cmpItems();if(items.length<2){toast('Pilih minimal 2 artikel');return;}
  var f=$('#cmpFocus').value.trim();
  var p=RULES+'\n\nBANDINGKAN ARTIKEL BERIKUT:\n'+items.map(digest).join('\n')+
    '\n\n'+(f?'FOKUS dari pengguna: '+f+'\n\n':'')+
    'Mulai dengan satu kalimat yang menyatakan perbedaan utama. Lalu bandingkan per aspek dengan daftar: tujuan, metode, temuan, kekuatan dan keterbatasan. Tutup dengan "Kapan memakai yang mana" dalam 2–3 kalimat. Jika data tidak cukup untuk satu aspek, katakan.';
  ask({key:'cmp',prompt:p,offline:function(){return offCmp(items);},out:$('#cmpOut'),status:$('#cmpStatus'),stop:$('#cmpStop'),go:[$('#cmpGo')]});
}
function doSummary(){
  var a=byId(state.cur);if(!a)return;
  var lv=($('input[name=lvl]:checked')||{}).value||'singkat';
  var ins={
    singkat:'Rangkum dalam 3 poin (tujuan, temuan utama, makna) dengan total maksimal 90 kata.',
    sederhana:'Jelaskan dengan bahasa sederhana seolah kepada teman satu angkatan yang belum pernah membaca artikel ini. Pakai satu analogi.',
    tugas:'Buat ringkasan untuk tugas kuliah dengan daftar: masalah yang diteliti, metode, temuan, keterbatasan, dan satu kalimat parafrase yang bisa dipakai sebagai dasar tulisan (bukan kutipan langsung). Ingatkan agar mengutip artikel aslinya.'
  }[lv];
  ask({key:'d',prompt:RULES+'\n\nARTIKEL:\n'+digest(a)+'\n\n'+ins,offline:function(){return offSum(a,lv);},out:$('#dOut'),status:$('#dStatus'),stop:$('#dStop'),go:[$('#dSum'),$('#dAsk')]});
}
function doQa(){
  var a=byId(state.cur);if(!a)return;
  var q=$('#dQ').value.trim();if(!q){toast('Tulis pertanyaanmu dulu');return;}
  ask({key:'d',prompt:RULES+'\n\nARTIKEL:\n'+digest(a)+'\n\nPERTANYAAN PENGGUNA: '+q+'\n\nJawab berdasarkan data artikel. Bila data tidak cukup, katakan apa yang tidak ada dan sarankan membaca artikel aslinya.',offline:function(){return offQa(a,q);},out:$('#dOut'),status:$('#dStatus'),stop:$('#dStop'),go:[$('#dSum'),$('#dAsk')]});
}

/* ---------- Detail ---------- */
function openDetail(id){
  var a=byId(id);if(!a)return;
  if(ctls.d)ctls.d.abort();
  state.cur=id;
  var sh=$('#sheet');
  var link=a.link?'<p style="margin:14px 0 0"><a class="lnk" href="'+esc(a.link)+'" target="_blank" rel="noopener noreferrer">Buka artikel asli</a></p>':'';
  var det=a.rinci?', '+esc(a.rinci):'';
  sh.innerHTML='<div class="sheet-bar"><button class="btn" data-act="close" id="closeBtn">Tutup</button></div>'+
  '<div class="sheet-hero" style="--c:'+fc(a.bidang)+';--cx:'+ft(a.bidang)+'"><div class="sheet-in">'+
    '<span class="ftag">'+esc(a.bidang)+'</span>'+(a.mine?'<span class="badge">Artikelmu</span>':'')+(a.ext?'<span class="badge">EN</span>':'')+
    '<h1>'+esc(a.judul)+'</h1>'+
    '<p class="meta">'+esc(a.penulis)+(a.tahun?' ('+esc(a.tahun)+')':'')+'. <i>'+esc(a.jurnal)+'</i>'+det+'.</p>'+link+
  '</div></div>'+
  '<div class="sheet-in">'+
    '<div class="acts" style="margin-top:0;padding-top:0"><button class="btn sm" data-act="save" data-id="'+a.id+'" aria-pressed="false">Simpan</button><button class="btn sm" data-act="cmp" data-id="'+a.id+'" aria-pressed="false">Bandingkan</button></div>'+
    '<h2>'+(a.mine?'Abstrak atau catatanmu':(a.ext?'Abstrak (bahasa asli)':'Ringkasan'))+'</h2><p class="read">'+esc(a.ringkas)+'</p>'+
    (a.temuan&&a.temuan.length?'<h2>Temuan utama</h2><ul class="pts">'+a.temuan.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul>':'')+
    (!a.mine&&!a.ext?'<h2>Metode</h2><p class="read">'+esc(a.metode)+'</p>':'')+
    '<h2>Tanya AI tentang artikel ini</h2>'+
    '<div class="seg" role="radiogroup" aria-label="Gaya ringkasan">'+
      '<label><input type="radio" name="lvl" value="singkat" checked><span>Singkat</span></label>'+
      '<label><input type="radio" name="lvl" value="sederhana"><span>Bahasa sederhana</span></label>'+
      '<label><input type="radio" name="lvl" value="tugas"><span>Untuk tugas kuliah</span></label>'+
    '</div>'+
    '<div class="row"><button class="btn primary" id="dSum" data-act="sum">Rangkum</button><button class="btn" id="dStop" hidden>Berhenti</button></div>'+
    '<div class="askrow"><input id="dQ" type="text" placeholder="Tanya sesuatu tentang artikel ini" aria-label="Pertanyaan tentang artikel"><button class="btn" id="dAsk" data-act="qa">Tanya</button></div>'+
    '<div id="dStatus" class="status" aria-live="polite"></div><div id="dOut" class="ai-out" hidden></div>'+
    '<p class="fine">'+(a.mine?'AI hanya membaca abstrak atau catatan yang kamu tempel. ':(a.ext?'Abstrak berasal dari penerbit lewat Crossref, dipotong bila terlalu panjang. ':'Ringkasan di atas ditulis ulang, bukan abstrak asli. '))+'AI bisa keliru. Cek hal penting ke artikel asli.</p>'+
  '</div>';
  sh.hidden=false;sh.scrollTop=0;document.body.style.overflow='hidden';
  refreshToggles();
  $('#closeBtn').focus();
}
function closeDetail(){
  if(ctls.d)ctls.d.abort();
  $('#sheet').hidden=true;document.body.style.overflow='';state.cur=null;
}

/* ---------- Navigasi & events ---------- */
function setTab(t){
  state.tab=t;
  ['lib','idea','cmp','sv'].forEach(function(n){var v=$('#v-'+n);v.hidden=(n!==t);v.classList.remove('view-in');if(n===t&&!RM){void v.offsetWidth;v.classList.add('view-in');}});
  $$('.tab').forEach(function(b){if(b.dataset.tab===t)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  if(t==='cmp')renderCmp();
  if(t==='sv')renderSaved();
  window.scrollTo(0,0);
}
document.addEventListener('click',function(e){
  var tb=e.target.closest('[data-tab]');
  if(tb){if(!$('#sheet').hidden)closeDetail();setTab(tb.dataset.tab);return;}
  var t=e.target.closest('[data-act]');if(!t)return;
  var id=t.dataset.id;
  switch(t.dataset.act){
    case 'open':openDetail(id);break;
    case 'close':closeDetail();break;
    case 'save':toggleSave(id);break;
    case 'cmp':toggleCmp(id);break;
    case 'chip':state.field=t.dataset.v;renderChips();relist();if(state.field!=='Semua'){$('.bar').scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});}break;
    case 'more':showMore();break;
    case 'goto':gotoResults();break;
    case 'qclear':state.q='';$('#q').value='';relist();$('#q').focus();break;
    case 'retry':loadExtra(true);break;
    case 'q':state.q=t.dataset.v;$('#q').value=state.q;relist();gotoResults();break;
    case 'ex':$('#idea').value=t.dataset.v;$('#idea').focus();break;
    case 'delmine':delMine(id);break;
    case 'sum':doSummary();break;
    case 'qa':doQa();break;
  }
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&!$('#sheet').hidden)closeDetail();
  if(e.key==='Enter'&&e.target&&e.target.id==='dQ'){e.preventDefault();doQa();}
  if(e.key==='Enter'&&e.target&&e.target.id==='q'){e.preventDefault();gotoResults();}
});
$('#q').addEventListener('input',function(e){state.q=e.target.value;relist();});
$('#sort').addEventListener('change',function(e){state.sort=e.target.value;relist();});
$('#ideaGo').addEventListener('click',doIdea);
$('#cmpGo').addEventListener('click',doCmp);
$('#nAdd').addEventListener('click',addMine);

/* ---------- Koleksi tambahan (Crossref) ---------- */
function setLoad(html,pct,err){
  var lb=$('#loadbar');lb.hidden=false;lb.classList.toggle('err',!!err);
  lb.innerHTML='<p class="lb-t">'+html+'</p>'+(err?'':'<div class="lb-track"><div class="lb-fill" style="width:'+pct+'%"></div></div>');
}
function pruneIds(){
  saved=saved.filter(function(id){return !!byId(id);});
  cmp=cmp.filter(function(id){return !!byId(id);}).slice(0,4);
  store('pi:saved',saved);store('pi:cmp',cmp);
}
function afterExtra(){
  inval();renderChips();relist();renderSaved();renderCmp();
  var n=extra.length;
  $('#fineLib').textContent='Koleksi berisi '+DATA.length+' artikel pilihan dengan ringkasan berbahasa Indonesia'+(n?', ditambah '+n.toLocaleString('id-ID')+' artikel dari Crossref yang memakai abstrak asli (umumnya bahasa Inggris, ditandai EN). ':'. ')+'Cek artikel asli lewat tautan DOI sebelum dikutip. Tambahkan artikelmu sendiri di tab Simpanan.';
}
function loadExtra(force){
  if(!window.PI_FETCH_EXTRA){afterExtra();return;}
  var cached=force?null:load(EXTRA_KEY,null);
  if(cached&&cached.length){extra=cached;inval();pruneIds();afterExtra();return;}
  setLoad('Memuat ±1000 artikel tambahan dari Crossref…',4);
  window.PI_FETCH_EXTRA(function(d,tot){setLoad('Memuat ±1000 artikel tambahan dari Crossref… ('+d+'/'+tot+' bidang)',Math.max(4,Math.round(d/tot*100)));}).then(function(r){
    if(!r.list.length)throw new Error('kosong');
    extra=r.list;inval();
    if(r.failed===0){store(EXTRA_KEY,extra);pruneIds();$('#loadbar').hidden=true;toast(extra.length.toLocaleString('id-ID')+' artikel ditambahkan ke pustaka');}
    else setLoad('Sebagian bidang gagal dimuat ('+r.failed+' dari 7). <button class="btn sm" data-act="retry">Muat ulang</button>',100,true);
    afterExtra();
  }).catch(function(){
    setLoad('Artikel tambahan belum bisa dimuat (periksa koneksi internet). Koleksi awal tetap bisa dipakai. <button class="btn sm" data-act="retry">Coba lagi</button>',0,true);
  });
}

/* ---------- Init ---------- */
$('#ideaEx').innerHTML=EXAMPLES.map(function(x){return '<button class="chip" data-act="ex" data-v="'+esc(x)+'">'+esc(x)+'</button>';}).join('');
fillBidang();renderChips();renderList();renderSaved();renderCmp();
$('#modePill').textContent=CFG.aiEndpoint?'Mode AI aktif':'Mode offline (tanpa AI)';
$('#modePill').classList.toggle('on',!!CFG.aiEndpoint);
loadExtra(false);
})();
