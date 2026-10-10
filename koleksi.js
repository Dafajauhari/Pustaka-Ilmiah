/* Koleksi tambahan: ±1000 artikel ilmiah asli.
   - 500 artikel luar negeri dari Crossref (https://api.crossref.org), diurutkan dari yang paling banyak dikutip.
   - 500 artikel dari jurnal Indonesia dari DOAJ (https://doaj.org), disaring dengan country:ID.
   Data bibliografi dan abstrak berasal dari penerbit, jadi bahasa abstrak mengikuti artikelnya (Indonesia atau Inggris).
   Dimuat sekali lalu disimpan di browser (localStorage) agar pembukaan berikutnya instan. */
(function(){
'use strict';
var PER_FIELD=72;      /* per bidang untuk tiap sumber: 7 x 72 = 504, dipotong ke 500 */
var LIMIT_EACH=500;
var ROWS=150;
var CR_QUERIES=[
  ['Pendidikan','education learning students teaching school'],
  ['Kesehatan','health disease clinical patients medicine'],
  ['Sosial','society social inequality community culture'],
  ['Psikologi','psychology cognition behavior emotion mental'],
  ['Teknologi','machine learning computing technology software'],
  ['Ekonomi','economics market finance economy trade'],
  ['Lingkungan','environment climate ecology sustainability biodiversity']
];
var ID_QUERIES=[
  ['Pendidikan','pendidikan OR pembelajaran OR siswa OR mahasiswa OR education OR learning OR students OR teaching'],
  ['Kesehatan','kesehatan OR penyakit OR pasien OR gizi OR health OR disease OR patients OR clinical'],
  ['Sosial','sosial OR masyarakat OR budaya OR komunitas OR social OR society OR community OR culture'],
  ['Psikologi','psikologi OR perilaku OR emosi OR stres OR psychology OR behavior OR emotion OR mental'],
  ['Teknologi','teknologi OR aplikasi OR informatika OR komputer OR software OR algorithm OR network OR sistem'],
  ['Ekonomi','ekonomi OR keuangan OR pasar OR bank OR investasi OR economic OR finance OR market'],
  ['Lingkungan','lingkungan OR iklim OR ekologi OR keberlanjutan OR environment OR climate OR ecology OR sustainability']
];
var ENT={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&apos;':"'",'&nbsp;':' '};

function clean(s){
  return String(s||'').replace(/<jats:title>[\s\S]*?<\/jats:title>/gi,' ').replace(/<[^>]+>/g,' ')
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g,function(m){return ENT[m]||' ';})
    .replace(/^\s*abstract[:.\s]+/i,'').replace(/\s+/g,' ').trim();
}
function cut(s,n){
  if(s.length<=n)return s;
  var t=s.slice(0,n),i=Math.max(t.lastIndexOf('. '),t.lastIndexOf('? '),t.lastIndexOf('! '));
  if(i>n*0.5)return t.slice(0,i+1);
  return t.slice(0,t.lastIndexOf(' '))+'…';
}
function initials(g){
  return String(g||'').split(/[\s.\-]+/).filter(Boolean).map(function(p){return p.charAt(0).toUpperCase()+'.';}).join(' ');
}
function oneAuthor(a){
  var f=(a.family||'').trim(),g=initials(a.given);
  return f?(g?f+', '+g:f):(a.name||'').trim();
}
function hash(s){var h=5381,i;for(i=0;i<s.length;i++){h=((h<<5)+h+s.charCodeAt(i))>>>0;}return h.toString(36);}

/* Bahasa abstrak: hitung kata penghubung bahasa Indonesia yang umum */
var ID_WORDS={yang:1,dan:1,di:1,untuk:1,dengan:1,pada:1,dalam:1,ini:1,adalah:1,dari:1,oleh:1,tersebut:1,sebagai:1,penelitian:1,bertujuan:1};
function langOf(s){
  var w=String(s||'').toLowerCase().split(/[^a-z]+/).filter(Boolean),n=0,i;
  for(i=0;i<w.length;i++){if(ID_WORDS[w[i]])n++;}
  return (n>=4&&n/Math.max(1,w.length)>0.05)?'id':'en';
}

/* Menebak metode dari kata-kata di abstrak. Urutan penting: pola paling spesifik lebih dulu. */
var METHODS=[
  [/meta-?analys/i,'Meta-analisis'],
  [/systematic review|scoping review/i,'Tinjauan sistematis'],
  [/randomi[sz]ed|clinical trial|placebo/i,'Uji klinis atau eksperimen acak'],
  [/cohort|longitudinal|prospective study|retrospective/i,'Studi kohort atau longitudinal'],
  [/case[- ]control/i,'Studi kasus-kontrol'],
  [/cross-sectional|questionnaire|survey|kuesioner|angket|survei/i,'Survei atau studi potong lintang'],
  [/interview|focus group|thematic analysis|qualitative|ethnograph|kualitatif|wawancara/i,'Pendekatan kualitatif (wawancara atau analisis tematik)'],
  [/case study|case studies|studi kasus/i,'Studi kasus'],
  [/experiment|eksperimen/i,'Eksperimen'],
  [/deep learning|neural network|machine learning|transformer|convolutional|algorithm|framework|we propose|novel method/i,'Pengembangan model atau algoritma komputasi dan evaluasi'],
  [/simulation|numerical|monte carlo|model(?:l)?ing/i,'Pemodelan atau simulasi'],
  [/regression|econometric|panel data|time series|empirical|dataset|statistical|regresi|kuantitatif/i,'Analisis kuantitatif data empiris'],
  [/review|overview|perspective|we discuss|this article summari[sz]es|summari[sz]es|studi literatur|kajian pustaka/i,'Tinjauan atau artikel ulasan'],
  [/theor(?:y|etical)|conceptual|we argue|essay/i,'Kajian teoretis atau konseptual']
];
function detectMethod(text){
  var s=String(text||''),hit=[],i;
  for(i=0;i<METHODS.length&&hit.length<2;i++){if(METHODS[i][0].test(s))hit.push(METHODS[i][1]);}
  var n=s.match(/\b(?:n\s*=\s*|of\s+)(\d[\d,]{2,})\s+(?:participants|patients|students|respondents|subjects|studies|articles|papers|adults|children|individuals|samples)/i);
  if(!hit.length)return 'Tidak dinyatakan di abstrak (lihat artikel asli)';
  return hit.join('; ')+(n?' (sekitar '+n[1]+' '+n[0].split(/\s+/).pop()+')':'')+' — ditebak dari abstrak, cek artikel asli';
}

/* ---- Crossref (luar negeri) ---- */
function toArticle(it,bidang){
  var title=clean((it.title||[])[0]);
  var abs=clean(it.abstract);
  var dp=it.issued&&it.issued['date-parts']&&it.issued['date-parts'][0];
  var year=dp&&dp[0];
  if(!it.DOI||!title||title.length<8||abs.length<120||!year)return null;
  var au=(it.author||[]).map(oneAuthor).filter(Boolean);
  var first=(it.author||[])[0]||{};
  var pendek=(first.family||first.name||'Tanpa penulis').trim();
  if(au.length>2)pendek+=' dkk.';else if(au.length===2)pendek+=' & '+((it.author[1].family||it.author[1].name||'').trim());
  var pen=au.length?(au.length>3?au.slice(0,3).join(', ')+', dkk.':au.join(', ')):'Tanpa penulis';
  var rinci=(it.volume?it.volume+(it.issue?'('+it.issue+')':''):'')+(it.page?(it.volume?', ':'')+it.page:'');
  var jr=clean((it['container-title']||[])[0])||'Jurnal tidak tercantum';
  var tags=(it.subject||[]).map(clean).filter(Boolean).slice(0,3);
  return {id:'o'+hash(it.DOI.toLowerCase()),bidang:bidang,pendek:pendek,penulis:pen,tahun:year,judul:title,jurnal:jr,rinci:rinci,
    link:'https://doi.org/'+it.DOI,ringkas:cut(abs,700),metode:detectMethod(abs),tags:tags,temuan:[],ext:true,lang:langOf(abs)};
}

/* ---- DOAJ (jurnal Indonesia) ---- */
function doajAuthor(name){
  var n=clean(name),p,family,given;
  if(!n)return null;
  if(n.indexOf(',')>-1){p=n.split(',');family=p[0].trim();given=p.slice(1).join(' ');}
  else{p=n.split(' ');family=p.length>1?p[p.length-1]:n;given=p.length>1?p.slice(0,-1).join(' '):'';}
  return {family:family,given:given};
}
function toDoaj(it,bidang){
  var b=it.bibjson||{};
  var title=clean(b.title),abs=clean(b.abstract),year=parseInt(b.year,10);
  var doi='',ids=b.identifier||[],i;
  for(i=0;i<ids.length;i++){if(ids[i].type==='doi'&&ids[i].id){doi=String(ids[i].id).trim();break;}}
  var link=doi?'https://doi.org/'+doi:(((b.link||[])[0]||{}).url||'');
  if(!title||title.length<8||abs.length<120||!year||!link)return null;
  var au=(b.author||[]).map(function(a){return doajAuthor(a&&a.name);}).filter(Boolean);
  var pendek=au.length?au[0].family:'Tanpa penulis';
  if(au.length>2)pendek+=' dkk.';else if(au.length===2)pendek+=' & '+au[1].family;
  var pen=au.length?(au.length>3?au.slice(0,3).map(oneAuthor).join(', ')+', dkk.':au.map(oneAuthor).join(', ')):'Tanpa penulis';
  var j=b.journal||{};
  var jr=clean(j.title)||'Jurnal tidak tercantum';
  var rinci=(j.volume?j.volume+(j.number?'('+j.number+')':''):'')+(b.start_page?(j.volume?', ':'')+b.start_page+(b.end_page?'–'+b.end_page:''):'');
  var tags=(b.keywords||[]).map(clean).filter(Boolean).slice(0,3);
  return {id:'o'+hash(doi?doi.toLowerCase():'doaj:'+(it.id||title)),bidang:bidang,pendek:pendek,penulis:pen,tahun:year,judul:title,jurnal:jr,rinci:rinci,
    link:link,ringkas:cut(abs,700),metode:detectMethod(abs),tags:tags,temuan:[],ext:true,asal:'id',lang:langOf(abs)};
}

function fetchJson(url,tries){
  var ctl=new AbortController(),t=setTimeout(function(){ctl.abort();},45000);
  return fetch(url,{signal:ctl.signal,headers:{'Accept':'application/json'}}).then(function(r){
    clearTimeout(t);if(!r.ok)throw new Error('http '+r.status);return r.json();
  }).catch(function(e){
    clearTimeout(t);
    if(tries>0)return new Promise(function(ok){setTimeout(ok,1200);}).then(function(){return fetchJson(url,tries-1);});
    throw e;
  });
}
function fetchField(q){
  var url='https://api.crossref.org/works?query='+encodeURIComponent(q[1])+
    '&filter='+encodeURIComponent('type:journal-article,has-abstract:true,from-pub-date:1985')+
    '&sort=is-referenced-by-count&order=desc&rows='+ROWS+
    '&select='+encodeURIComponent('DOI,title,author,issued,container-title,volume,issue,page,abstract,subject');
  return fetchJson(url,2).then(function(d){return (d&&d.message&&d.message.items)||[];});
}
function fetchDoaj(q){
  var query='bibjson.journal.country:ID AND bibjson.title:('+q[1]+')';
  var url='https://doaj.org/api/search/articles/'+encodeURIComponent(query)+'?pageSize=100&page=1';
  return fetchJson(url,2).then(function(d){return (d&&d.results)||[];});
}

/* Mengembalikan Promise<{list:[], failed:n, total:n}>; onProgress(selesai, total) dipanggil tiap permintaan selesai */
function fetchExtra(onProgress){
  var tasks=[],done=0,failed=0,idx=0,res=[];
  CR_QUERIES.forEach(function(q){tasks.push({q:q,src:'cr'});});
  ID_QUERIES.forEach(function(q){tasks.push({q:q,src:'id'});});
  function worker(){
    if(idx>=tasks.length)return Promise.resolve();
    var i=idx++,t=tasks[i];
    return (t.src==='cr'?fetchField(t.q):fetchDoaj(t.q)).catch(function(){failed++;return [];})
      .then(function(items){res[i]=items;done++;if(onProgress)onProgress(done,tasks.length);return worker();});
  }
  return Promise.all([worker(),worker(),worker()]).then(function(){
    var seen={},seenT={},cr=[],idl=[];
    tasks.forEach(function(t,i){
      var n=0,out=t.src==='cr'?cr:idl;
      (res[i]||[]).forEach(function(it){
        if(n>=PER_FIELD)return;
        var a=t.src==='cr'?toArticle(it,t.q[0]):toDoaj(it,t.q[0]);if(!a)return;
        var tk=a.judul.toLowerCase();
        if(seen[a.id]||seenT[tk])return;
        seen[a.id]=1;seenT[tk]=1;out.push(a);n++;
      });
    });
    return {list:cr.slice(0,LIMIT_EACH).concat(idl.slice(0,LIMIT_EACH)),failed:failed,total:tasks.length};
  });
}
window.PI_FETCH_EXTRA=fetchExtra;
window.PI_TO_ARTICLE=toArticle;
window.PI_DETECT_METHOD=detectMethod;
})();
