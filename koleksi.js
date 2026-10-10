/* Koleksi tambahan: ±1000 artikel ilmiah asli dari Crossref (https://api.crossref.org).
   Data bibliografi dan abstrak berasal dari penerbit, jadi berbahasa asli artikel (umumnya Inggris).
   Dimuat sekali lalu disimpan di browser (localStorage) agar pembukaan berikutnya instan. */
(function(){
'use strict';
var PER_FIELD=143;
var ROWS=150;
var QUERIES=[
  ['Pendidikan','education learning students teaching school'],
  ['Kesehatan','health disease clinical patients medicine'],
  ['Sosial','society social inequality community culture'],
  ['Psikologi','psychology cognition behavior emotion mental'],
  ['Teknologi','machine learning computing technology software'],
  ['Ekonomi','economics market finance economy trade'],
  ['Lingkungan','environment climate ecology sustainability biodiversity']
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
    link:'https://doi.org/'+it.DOI,ringkas:cut(abs,700),metode:'Tidak dinyatakan di data (lihat artikel asli)',tags:tags,temuan:[],ext:true};
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

/* Mengembalikan Promise<{list:[], failed:n}>; onProgress(selesai, total) dipanggil tiap bidang selesai */
function fetchExtra(onProgress){
  var done=0,failed=0,seen={},seenT={};
  var idx=0,res=[];
  function worker(){
    if(idx>=QUERIES.length)return Promise.resolve();
    var q=QUERIES[idx++];
    return fetchField(q).then(function(items){return {q:q,items:items};}).catch(function(){failed++;return {q:q,items:[]};})
      .then(function(r){res[QUERIES.indexOf(q)]=r;done++;if(onProgress)onProgress(done,QUERIES.length);return worker();});
  }
  return Promise.all([worker(),worker(),worker()]).then(function(){
    var list=[];
    res.forEach(function(r){
      var n=0;
      r.items.forEach(function(it){
        if(n>=PER_FIELD)return;
        var a=toArticle(it,r.q[0]);if(!a)return;
        var tk=a.judul.toLowerCase();
        if(seen[a.id]||seenT[tk])return;
        seen[a.id]=1;seenT[tk]=1;list.push(a);n++;
      });
    });
    return {list:list.slice(0,1000),failed:failed};
  });
}
window.PI_FETCH_EXTRA=fetchExtra;
window.PI_TO_ARTICLE=toArticle;
})();
