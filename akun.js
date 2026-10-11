/* Akun Pustaka Ilmiah: halaman login penuh, Guest account, dan halaman Profil.
   Berdiri sendiri: file ini menambahkan halaman login, tombol akun di header, halaman profil,
   dan gayanya sendiri. Cukup pasang <script src="akun.js"></script> di index.html (setelah app.js).

   Perilaku:
   - Saat situs dibuka dan belum masuk, halaman login tampil penuh.
   - Tombol "Guest account" masuk ke web tanpa akun; pilihan ini diingat selama tab browser terbuka.
     Untuk mewajibkan login, ubah BOLEH_TAMU di bawah menjadi false.
   - Setelah masuk (login, daftar, atau guest), halaman login memudar dan isi web muncul dengan animasi masuk.
   - Tombol di header membuka halaman Profil: kartu biru berisi nama, peran, NIM, dan program studi,
     lalu bagian Data akademik, Informasi pribadi, serta Kontak dan akun. Semua kolom bisa diisi lewat "Ubah profil".
   - Foto profil: ketuk ikon kamera di avatar. Foto dipotong persegi, dikecilkan ke 320 px, lalu disimpan
     sebagai JPEG kecil (puluhan KB) di browser perangkat ini.

   CATATAN PENTING: situs ini statis (GitHub Pages), jadi akun dan data profil disimpan di browser perangkat ini
   (localStorage), bukan di server. Tidak ikut ke perangkat lain dan hilang kalau data situs dihapus.
   Kata sandi diacak dengan PBKDF2-SHA256 plus garam acak, tidak disimpan apa adanya, tetapi data profil
   (NIM, tanggal lahir, dan lain-lain) disimpan sebagai teks biasa di browser. Karena semua berjalan di browser,
   ini BUKAN pengaman yang sungguhan. Jangan menaruh data pribadi asli langsung di file kode ini. */
(function(){
'use strict';

var BOLEH_TAMU=true;   /* false = wajib masuk (tombol "Guest account" disembunyikan) */

var K_USERS='pi:akun:users',K_SESI='pi:akun:sesi',K_TAMU='pi:akun:tamu';
var ITER=150000,MAX_GAGAL=5,KUNCI_MS=30000;
var gagal=0,kunciSampai=0,hapusTimer=0,tamuMem=false;
var LOCK=['.brandbar','.tabs','main.app'];

/* ---------- Penyimpanan ---------- */
function load(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
function users(){var u=load(K_USERS,{});return (u&&typeof u==='object')?u:{};}
function cur(){
  var em=load(K_SESI,null),u=users(),r=em&&u[em];
  if(r)return {email:em,nama:r.nama,kampus:r.kampus||'',dibuat:r.dibuat,peran:r.peran||'',nim:r.nim||'',prodi:r.prodi||'',gender:r.gender||'',tempat:r.tempat||'',tgl:r.tgl||'',
    foto:(/^data:image\/(jpeg|png|webp);base64,/.test(r.foto||'')?r.foto:'')};
  if(em)try{localStorage.removeItem(K_SESI);}catch(e){}
  return null;
}
function tamu(){try{return sessionStorage.getItem(K_TAMU)==='1'||tamuMem;}catch(e){return tamuMem;}}
function setTamu(on){tamuMem=!!on;try{if(on)sessionStorage.setItem(K_TAMU,'1');else sessionStorage.removeItem(K_TAMU);}catch(e){}}

/* ---------- Kata sandi (PBKDF2) ---------- */
function toB64(buf){var a=new Uint8Array(buf),s='',i;for(i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s);}
function fromB64(s){var b=atob(s),a=new Uint8Array(b.length),i;for(i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
function hashPw(pw,salt){
  return crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']).then(function(k){
    return crypto.subtle.deriveBits({name:'PBKDF2',salt:salt,iterations:ITER,hash:'SHA-256'},k,256);
  }).then(toB64);
}
function cryptoOk(){return !!(window.crypto&&crypto.subtle&&window.TextEncoder);}

/* ---------- Ikon ---------- */
var IC={
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  cap:'<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2.5 9 2.5 12 0v-5"/>',
  idcard:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.5 17c.6-2 2-3 3.5-3s2.9 1 3.5 3M15 9h3M15 13h3"/>',
  briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
  pin:'<path d="M12 21s7-5.6 7-11a7 7 0 0 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  building:'<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6M9 12h.01M15 12h.01"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  pencil:'<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>',
  out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  back:'<path d="M15 5 8 12l7 7"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>'
};
function svg(n){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(IC[n]||'')+'</svg>';}

/* ---------- Gaya ---------- */
var CSS=`
#toast{z-index:130}
.akun-btn{margin-left:auto;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:5px 14px 5px 6px;border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:999px;font-weight:600;font-size:14.5px;cursor:pointer}
.akun-btn:hover{border-color:var(--accent)}
.akun-av{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--paper);color:var(--muted);font:600 14px/1 var(--display)}
.akun-av svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.akun-av.on{background:linear-gradient(135deg,var(--accent),#7A4BC9);color:#fff}
.akun-lbl{max-width:11ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.akun-av{overflow:hidden}
.akun-av img,.pf-av img{width:100%;height:100%;object-fit:cover;display:block}
html.ak-lock,html.ak-lock body{overflow:hidden}

/* Halaman login penuh */
.ak-gate{position:fixed;inset:0;z-index:100;display:grid;grid-template-columns:1fr;grid-template-rows:auto 1fr;overflow-y:auto;background:var(--paper);color:var(--ink)}
.ak-gate.out{opacity:0;transform:scale(1.04);pointer-events:none;transition:opacity .32s ease,transform .32s ease}
@media (min-width:900px){.ak-gate{grid-template-columns:minmax(0,1.08fr) minmax(430px,.92fr);grid-template-rows:1fr}}
.ak-brand{position:relative;overflow:hidden;isolation:isolate;color:var(--on-indigo);padding:22px 20px 20px;display:flex;flex-direction:column;gap:16px;
  background-color:var(--indigo);
  background-image:
    repeating-linear-gradient(to bottom,transparent 0,transparent 33px,rgba(255,255,255,.07) 33px,rgba(255,255,255,.07) 34px),
    radial-gradient(520px 340px at 96% -6%,rgba(255,216,77,.30),transparent 66%),
    radial-gradient(520px 400px at -4% 104%,rgba(194,37,92,.42),transparent 66%),
    radial-gradient(460px 340px at 64% 124%,rgba(11,124,134,.46),transparent 66%)}
.ak-top{display:flex;align-items:center;gap:10px}
.ak-logo{width:34px;height:34px}
.ak-name{font:600 21px/1 var(--display);letter-spacing:-.01em}
.ak-h1{margin:0;font:600 clamp(24px,6vw,30px)/1.15 var(--display);letter-spacing:-.015em;max-width:22ch;text-wrap:balance}
.ak-lead{display:none;margin:0;color:var(--on-indigo-muted);font-size:17px;max-width:44ch}
.ak-shelf{display:none}
.ak-side{display:grid;place-items:start center;padding:22px 16px 40px}
.ak-card{width:min(440px,100%);background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:22px 20px 20px;box-shadow:0 26px 50px -34px rgba(20,23,61,.6)}
.ak-ttl{margin:0;font:600 28px/1.15 var(--display)}
.ak-sub{margin:6px 0 16px;font-size:15px;color:var(--muted)}
.ak-guest{display:block;margin:16px auto 0;border:0;background:none;color:var(--accent);font-weight:600;font-size:15px;padding:8px 12px;border-radius:10px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.ak-guest:hover{background:color-mix(in srgb,var(--accent) 10%,transparent)}
@media (min-width:900px){
  .ak-brand{padding:36px 44px 0;gap:0;justify-content:flex-start}
  .ak-top{margin-bottom:12vh}
  .ak-h1{font-size:clamp(38px,4.2vw,56px);max-width:15ch}
  .ak-lead{display:block;margin-top:18px}
  .ak-shelf{display:flex;align-items:flex-end;gap:8px;margin:auto -44px 0;padding:34px 44px 0;border-bottom:12px solid #0B0E2E}
  .ak-side{place-items:center;padding:36px 32px}
}
.ak-sp{flex:1 1 0;max-width:50px;height:var(--h);background:var(--c);color:#14173D;border-radius:7px 7px 2px 2px;position:relative;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.1),inset -6px 0 8px -6px rgba(0,0,0,.28)}
.ak-sp::before{content:"";position:absolute;left:0;right:0;top:9px;height:4px;background:rgba(255,255,255,.34)}
.ak-sp::after{content:"";position:absolute;left:0;right:0;bottom:30px;height:2px;background:rgba(255,255,255,.34)}
.ak-sp.lean{flex:0 0 40px;transform:rotate(9deg);transform-origin:100% 100%;margin-left:8px}
@media (prefers-reduced-motion:no-preference){
  .ak-sp{animation:akRise .7s calc(var(--i)*80ms + .15s) cubic-bezier(.2,.9,.3,1.15) backwards}
  @keyframes akRise{from{transform:translateY(110%);opacity:0}}
  .ak-h1{animation:akIn .7s .05s cubic-bezier(.2,.8,.2,1) backwards}
  .ak-lead{animation:akIn .7s .17s cubic-bezier(.2,.8,.2,1) backwards}
  .ak-card{animation:akIn .6s .1s cubic-bezier(.2,.8,.2,1) backwards}
  @keyframes akIn{from{opacity:0;transform:translateY(16px)}}
}

/* Formulir (halaman login dan ubah profil) */
.akun-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;background:var(--paper);border:1px solid var(--line);border-radius:999px}
.akun-tabs button{min-height:42px;border:0;border-radius:999px;background:none;font-weight:600;color:var(--muted);cursor:pointer}
.akun-tabs button[aria-selected=true]{background:var(--hl);color:var(--hl-ink)}
.akun-form label.akun-l{display:block;font-size:14px;font-weight:500;margin:14px 0 4px}
.akun-opt{font-weight:400;color:var(--muted)}
.akun-form input,.akun-form select{width:100%;min-height:46px;padding:11px 12px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:12px}
.akun-form input:focus,.akun-form select:focus{border-color:var(--accent);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent)}
.akun-form input[aria-invalid=true]{border-color:#C8401F}
.akun-pw{position:relative}
.akun-pw input{padding-right:78px}
.akun-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);min-height:34px;padding:0 12px;border:0;border-radius:8px;background:var(--paper);color:var(--ink);font-size:13.5px;font-weight:600;cursor:pointer}
.akun-hint{display:block;margin-top:5px;font-size:13px;color:var(--muted)}
.akun-err{display:block;margin-top:5px;font-size:13.5px;color:#C8401F}
.akun-err:empty{display:none}
.akun-form-err{margin:12px 0 0;font-size:14px;color:#C8401F}
.akun-form-err:empty{display:none}
.akun-form .btn.primary{width:100%;min-height:48px;margin-top:18px;font-size:16px}
.akun-form .btn.primary:disabled{opacity:.6}
.akun-note{margin:16px 0 0;font-size:13px;line-height:1.5;color:var(--muted)}

/* Halaman profil */
.pf{position:fixed;inset:0;z-index:90;overflow-y:auto;background:var(--paper);color:var(--ink)}
.pf-in{max-width:640px;margin:0 auto;padding:10px 16px 48px}
.pf-bar{position:sticky;top:0;z-index:2;display:grid;grid-template-columns:44px 1fr 44px;align-items:center;padding:8px 0;background:color-mix(in srgb,var(--paper) 86%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.pf-bar h2{margin:0;text-align:center;font:600 20px/1 var(--sans)}
.pf-back{width:44px;height:44px;border:0;border-radius:50%;background:var(--surface);border:1px solid var(--line);color:var(--ink);display:grid;place-items:center;cursor:pointer}
.pf-back svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pf-hero{position:relative;overflow:hidden;isolation:isolate;color:#fff;border-radius:26px;padding:22px 20px 20px;margin-top:10px;border:1px solid rgba(130,170,255,.5);
  background:radial-gradient(420px 260px at 85% 8%,rgba(120,190,255,.45),transparent 65%),linear-gradient(145deg,#0A2F7A 0%,#1553C7 55%,#2B7BE8 100%);
  box-shadow:0 28px 46px -30px rgba(21,83,199,.85)}
.pf-hero::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(4,22,66,.55),rgba(4,22,66,0) 72%)}
.pf-sky{position:absolute;right:-4px;bottom:0;width:min(64%,340px);height:auto;z-index:-1}
.pf-av{width:84px;height:84px;border-radius:50%;border:3px solid #fff;background:linear-gradient(135deg,#6C9BFF,#7A4BC9);display:grid;place-items:center;font:700 38px/1 var(--sans);box-shadow:0 10px 24px -10px rgba(0,0,0,.5)}
.pf-avwrap{position:relative;width:84px;height:84px}
.pf-av{overflow:hidden}
.pf-cam,.pf-camx{position:absolute;bottom:-2px;width:34px;height:34px;padding:0;border-radius:50%;border:2px solid #fff;display:grid;place-items:center;color:#fff;cursor:pointer;box-shadow:0 6px 14px -6px rgba(0,0,0,.6)}
.pf-cam{right:-6px;background:#2F7BF5}
.pf-cam:hover{background:#4A8EF7}
.pf-camx{left:-6px;background:#C8401F}
.pf-camx:hover{background:#DA5233}
.pf-camx[hidden]{display:none}
.pf-cam svg,.pf-camx svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pf-name{margin:18px 0 0;font:700 clamp(22px,6vw,30px)/1.15 var(--sans);letter-spacing:.01em;text-transform:uppercase;overflow-wrap:anywhere}
.pf-badges{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.pf-pill,.pf-chip{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:10px 18px;font-weight:600;font-size:16px}
.pf-pill{background:#2F7BF5;box-shadow:0 8px 18px -10px rgba(0,0,0,.6)}
.pf-chip{border:1.5px solid rgba(255,255,255,.55);background:rgba(255,255,255,.12);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);letter-spacing:.02em}
.pf-pill svg,.pf-line svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pf-line{display:flex;align-items:center;gap:10px;margin:18px 0 0;font-size:17px;font-weight:500;max-width:62%}
.pf-line[hidden]{display:none}
.pf-lbl{margin:28px 6px 10px;font:600 13px/1 var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.pf-grp{background:var(--surface);border:1px solid var(--line);border-radius:20px;overflow:hidden}
.pf-row{position:relative;display:flex;align-items:center;gap:14px;padding:14px 16px}
.pf-row+.pf-row::before{content:"";position:absolute;left:74px;right:0;top:0;height:1px;background:var(--line)}
.pf-tile{flex:none;width:44px;height:44px;border-radius:13px;display:grid;place-items:center;color:var(--t);background:color-mix(in srgb,var(--t) 16%,var(--surface))}
.pf-tile svg,.pf-copy svg,.pf-acts svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pf-k{color:var(--muted);font-size:16px}
.pf-v{margin-left:auto;text-align:right;font-weight:500;font-size:16px;overflow-wrap:anywhere;min-width:0;max-width:56%}
.pf-v.empty{color:var(--muted);font-weight:400}
.pf-copy{flex:none;width:38px;height:38px;border:0;border-radius:10px;background:none;color:var(--muted);display:grid;place-items:center;cursor:pointer}
.pf-copy:hover{background:var(--paper);color:var(--ink)}
.pf-acts{display:grid;gap:10px;margin-top:26px}
.pf-acts2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pf-acts .btn{min-height:50px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-size:16px}
.pf-acts .btn.primary{width:100%}
.akun-danger{color:#C8401F;border-color:color-mix(in srgb,#C8401F 45%,var(--line))}
.akun-danger.sure{background:#C8401F;border-color:#C8401F;color:#fff}
.pf-edit{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:6px 18px 20px;margin-top:10px}
.pf-edit-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
.pf-edit-acts .btn{min-height:48px;width:100%;margin-top:0}
.pf-edit-acts .btn.primary{margin-top:0}
@media (prefers-reduced-motion:no-preference){
  .pf-in>*{animation:pfIn .55s calc(var(--n,0)*70ms) cubic-bezier(.2,.8,.2,1) backwards}
  @keyframes pfIn{from{opacity:0;transform:translateY(16px)}}
}
`;

/* ---------- Kerangka HTML (hanya teks tetap, tidak ada input pengguna) ---------- */
var ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';

var GATE_HTML=`
<section class="ak-brand">
  <div class="ak-top">
    <svg class="ak-logo" viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="5" width="24" height="6" rx="2" fill="#2F55D4"/><rect x="7" y="13" width="21" height="6" rx="2" fill="#FFD84D"/><rect x="3" y="21" width="23" height="6" rx="2" fill="#C2255C"/></svg>
    <span class="ak-name">Pustaka Ilmiah</span>
  </div>
  <h1 class="ak-h1">Temukan jurnal yang tepat, pahami isinya dengan cepat.</h1>
  <p class="ak-lead">Cari artikel ilmiah per bidang, minta ringkasan, dan bandingkan beberapa jurnal sekaligus.</p>
  <div class="ak-shelf" id="akShelf" aria-hidden="true"></div>
</section>
<section class="ak-side">
  <div class="ak-card akun-form" id="akAuth">
    <h2 class="ak-ttl" id="akGTtl">Masuk</h2>
    <p class="ak-sub" id="akGSub"></p>
    <div class="akun-tabs" role="tablist" aria-label="Pilih Masuk atau Daftar">
      <button type="button" role="tab" id="tabMasuk" aria-selected="true" aria-controls="fMasuk" data-ak="tab" data-v="masuk">Masuk</button>
      <button type="button" role="tab" id="tabDaftar" aria-selected="false" aria-controls="fDaftar" data-ak="tab" data-v="daftar">Daftar</button>
    </div>

    <form id="fMasuk" role="tabpanel" aria-labelledby="tabMasuk" novalidate>
      <label class="akun-l" for="mEmail">Email</label>
      <input id="mEmail" name="email" type="email" autocomplete="email" inputmode="email" aria-describedby="mEmailE">
      <small class="akun-err" id="mEmailE" data-err="email"></small>
      <label class="akun-l" for="mPw">Kata sandi</label>
      <div class="akun-pw"><input id="mPw" name="pw" type="password" autocomplete="current-password" aria-describedby="mPwE">
        <button type="button" class="akun-eye" data-ak="eye" aria-label="Tampilkan kata sandi" aria-pressed="false">Lihat</button></div>
      <small class="akun-err" id="mPwE" data-err="pw"></small>
      <p class="akun-form-err" role="alert" data-err="form"></p>
      <button class="btn primary" type="submit">Masuk</button>
    </form>

    <form id="fDaftar" role="tabpanel" aria-labelledby="tabDaftar" novalidate hidden>
      <label class="akun-l" for="dNama">Nama lengkap</label>
      <input id="dNama" name="nama" type="text" autocomplete="name" aria-describedby="dNamaE">
      <small class="akun-err" id="dNamaE" data-err="nama"></small>
      <label class="akun-l" for="dEmail">Email</label>
      <input id="dEmail" name="email" type="email" autocomplete="email" inputmode="email" aria-describedby="dEmailE">
      <small class="akun-err" id="dEmailE" data-err="email"></small>
      <label class="akun-l" for="dKampus">Kampus atau institusi <span class="akun-opt">(opsional)</span></label>
      <input id="dKampus" name="kampus" type="text" autocomplete="organization">
      <label class="akun-l" for="dPw">Kata sandi</label>
      <div class="akun-pw"><input id="dPw" name="pw" type="password" autocomplete="new-password" aria-describedby="dPwH dPwE">
        <button type="button" class="akun-eye" data-ak="eye" aria-label="Tampilkan kata sandi" aria-pressed="false">Lihat</button></div>
      <small class="akun-hint" id="dPwH">Minimal 8 karakter, campuran huruf dan angka.</small>
      <small class="akun-err" id="dPwE" data-err="pw"></small>
      <label class="akun-l" for="dPw2">Ulangi kata sandi</label>
      <input id="dPw2" name="pw2" type="password" autocomplete="new-password" aria-describedby="dPw2E">
      <small class="akun-err" id="dPw2E" data-err="pw2"></small>
      <p class="akun-form-err" role="alert" data-err="form"></p>
      <button class="btn primary" type="submit">Buat akun</button>
    </form>

    <button type="button" class="ak-guest" id="akTamu" data-ak="tamu">Guest account</button>
  </div>
</section>`;

var SKY=`<svg class="pf-sky" viewBox="0 0 320 240" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
  <defs><pattern id="pfWin" width="12" height="14" patternUnits="userSpaceOnUse"><rect x="2" y="3" width="8" height="8" rx="1" fill="rgba(255,255,255,.6)"/></pattern></defs>
  <rect x="130" y="112" width="42" height="128" fill="rgba(255,255,255,.14)"/>
  <rect x="266" y="92" width="46" height="148" fill="rgba(255,255,255,.12)"/>
  <rect x="170" y="22" width="96" height="218" fill="rgba(255,255,255,.2)"/>
  <rect x="170" y="22" width="96" height="218" fill="url(#pfWin)" opacity=".42"/>
  <rect x="152" y="14" width="132" height="10" fill="rgba(255,255,255,.3)"/>
  <circle cx="218" cy="54" r="9" fill="#FFD84D" opacity=".92"/>
  <rect x="0" y="228" width="320" height="12" fill="rgba(255,255,255,.14)"/>
</svg>`;

var PROF_HTML=`
<div class="pf-in" id="pfIn">
  <div class="pf-bar">
    <button class="pf-back" type="button" data-ak="tutup" aria-label="Kembali ke pustaka">${svg('back')}</button>
    <h2 id="pfTtl">Profil</h2>
    <span></span>
  </div>

  <div id="pfView">
    <section class="pf-hero">
      ${SKY}
      <div class="pf-avwrap">
        <div class="pf-av" id="pAv"></div>
        <button class="pf-cam" type="button" data-ak="foto" aria-label="Pilih atau ganti foto profil">${svg('camera')}</button>
        <button class="pf-camx" type="button" data-ak="fotoHapus" id="pFotoHapus" aria-label="Hapus foto profil" hidden>${svg('x')}</button>
      </div>
      <input type="file" id="pFile" accept="image/*" hidden>
      <h3 class="pf-name" id="pNama"></h3>
      <div class="pf-badges">
        <span class="pf-pill">${svg('cap')}<span id="pPeran"></span></span>
        <span class="pf-chip" id="pNimChip" hidden></span>
      </div>
      <p class="pf-line" id="pLine">${svg('building')}<span id="pLineTxt"></span></p>
    </section>

    <h3 class="pf-lbl">Data akademik</h3>
    <div class="pf-grp" id="gAkad"></div>
    <h3 class="pf-lbl">Informasi pribadi</h3>
    <div class="pf-grp" id="gPribadi"></div>
    <h3 class="pf-lbl">Kontak &amp; akun</h3>
    <div class="pf-grp" id="gKontak"></div>

    <div class="pf-acts">
      <button class="btn primary" type="button" data-ak="ubah">${svg('pencil')}Ubah profil</button>
      <div class="pf-acts2">
        <button class="btn" type="button" data-ak="keluar">${svg('out')}Keluar</button>
        <button class="btn akun-danger" type="button" data-ak="hapus" id="akHapus">${svg('trash')}<span id="akHapusTxt">Hapus akun</span></button>
      </div>
    </div>
  </div>

  <form id="pfEdit" class="pf-edit akun-form" hidden novalidate>
    <label class="akun-l" for="peNama">Nama lengkap</label>
    <input id="peNama" name="nama" type="text" autocomplete="name" aria-describedby="peNamaE">
    <small class="akun-err" id="peNamaE" data-err="nama"></small>
    <label class="akun-l" for="pePeran">Peran pengguna</label>
    <select id="pePeran" name="peran">
      <option value="">Belum diisi</option><option>Mahasiswa</option><option>Dosen</option><option>Peneliti</option><option>Pelajar</option><option>Umum</option>
    </select>
    <label class="akun-l" for="peNim">NIM / NIPD <span class="akun-opt">(opsional)</span></label>
    <input id="peNim" name="nim" type="text" inputmode="numeric" autocomplete="off">
    <label class="akun-l" for="peProdi">Program studi <span class="akun-opt">(opsional)</span></label>
    <input id="peProdi" name="prodi" type="text" autocomplete="off">
    <label class="akun-l" for="peKampus">Kampus atau institusi <span class="akun-opt">(opsional)</span></label>
    <input id="peKampus" name="kampus" type="text" autocomplete="organization">
    <label class="akun-l" for="peGender">Jenis kelamin <span class="akun-opt">(opsional)</span></label>
    <select id="peGender" name="gender">
      <option value="">Belum diisi</option><option>Laki-laki</option><option>Perempuan</option>
    </select>
    <label class="akun-l" for="peTempat">Tempat lahir <span class="akun-opt">(opsional)</span></label>
    <input id="peTempat" name="tempat" type="text" autocomplete="off">
    <label class="akun-l" for="peTgl">Tanggal lahir <span class="akun-opt">(opsional)</span></label>
    <input id="peTgl" name="tgl" type="date" autocomplete="off">
    <p class="akun-note">Semua kolom selain nama boleh dikosongkan. Data profil hanya disimpan di browser perangkat ini dan tidak dikirim ke mana pun.</p>
    <p class="akun-form-err" role="alert" data-err="form"></p>
    <div class="pf-edit-acts">
      <button class="btn" type="button" data-ak="batal">Batal</button>
      <button class="btn primary" type="submit">Simpan</button>
    </div>
  </form>
</div>`;

/* ---------- Pasang ke halaman ---------- */
var st=document.createElement('style');st.id='akunStyle';st.textContent=CSS;document.head.appendChild(st);

var bar=document.querySelector('.brandbar')||document.body;
var btn=document.createElement('button');
btn.type='button';btn.className='akun-btn';btn.id='akunBtn';btn.setAttribute('aria-haspopup','dialog');
btn.innerHTML='<span class="akun-av" id="akAv"></span><span class="akun-lbl" id="akLbl"></span>';
bar.appendChild(btn);

var gate=document.createElement('div');
gate.className='ak-gate';gate.id='akGate';gate.hidden=true;
gate.setAttribute('role','dialog');gate.setAttribute('aria-modal','true');gate.setAttribute('aria-labelledby','akGTtl');
gate.innerHTML=GATE_HTML;
document.body.appendChild(gate);

var prof=document.createElement('div');
prof.className='pf';prof.id='akProf';prof.hidden=true;
prof.setAttribute('role','dialog');prof.setAttribute('aria-modal','true');prof.setAttribute('aria-labelledby','pfTtl');
prof.innerHTML=PROF_HTML;
document.body.appendChild(prof);

function $(id){return document.getElementById(id);}
var fMasuk=$('fMasuk'),fDaftar=$('fDaftar'),fEdit=$('pfEdit');

/* Rak buku hias di sisi kiri halaman login (hanya tampil di layar lebar) */
(function(){
  var cols=['#2F55D4','#0B7C86','#C2255C','#FFD84D','#7A4BC9','#C8401F','#257A37','#2F55D4','#C2255C'];
  var hs=[150,206,128,182,164,214,138,176,120],shelf=$('akShelf'),i,s;
  for(i=0;i<cols.length;i++){
    s=document.createElement('span');s.className='ak-sp'+(i===cols.length-1?' lean':'');
    s.style.setProperty('--c',cols[i]);s.style.setProperty('--h',hs[i]+'px');s.style.setProperty('--i',i);
    shelf.appendChild(s);
  }
})();
if(!BOLEH_TAMU)$('akTamu').hidden=true;

/* ---------- Bantuan ---------- */
function initial(n){return (String(n).trim().charAt(0)||'?').toUpperCase();}
function setAvatar(el,foto,nama){
  el.textContent='';
  if(foto){var im=document.createElement('img');im.alt='';im.src=foto;el.appendChild(im);}
  else el.textContent=initial(nama);
}
function firstName(n){return String(n).trim().split(/\s+/)[0]||'Akun';}
function normEmail(e){return String(e||'').trim().toLowerCase();}
function toast(m){
  var t=$('toast');if(!t)return;
  t.textContent=m;t.hidden=false;clearTimeout(toast.t);
  toast.t=setTimeout(function(){t.hidden=true;},2800);
}
function setErr(form,name,msg){
  var el=form.querySelector('[data-err="'+name+'"]'),inp=form.elements[name];
  if(el)el.textContent=msg||'';
  if(inp&&inp.setAttribute){if(msg)inp.setAttribute('aria-invalid','true');else inp.removeAttribute('aria-invalid');}
}
function clearErrs(form){['nama','email','pw','pw2','form'].forEach(function(n){setErr(form,n,'');});}
function focusField(form,name){var f=form.elements[name];if(f&&f.focus)f.focus();}
function busy(form,on,txt){
  var b=form.querySelector('button[type=submit]');
  if(!b)return;
  if(on){b.dataset.t=b.textContent;b.textContent=txt;b.disabled=true;}
  else{b.textContent=b.dataset.t||b.textContent;b.disabled=false;}
}
function canHover(){return !!(window.matchMedia&&matchMedia('(hover:hover)').matches);}
function reducedMotion(){return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches);}
function fmtTgl(s){
  var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||''),d;
  if(!m)return '';
  d=new Date(+m[1],+m[2]-1,+m[3]);
  return isNaN(d.getTime())?'':d.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
}
function salin(teks){
  function ok(){toast('Disalin: '+teks);}
  function cadangan(){
    var ta=document.createElement('textarea');
    ta.value=teks;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta);ta.select();
    try{if(document.execCommand('copy'))ok();else toast('Tidak bisa menyalin. Salin manual ya.');}catch(e){toast('Tidak bisa menyalin. Salin manual ya.');}
    document.body.removeChild(ta);
  }
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(teks).then(ok,cadangan);else cadangan();
}

/* ---------- Tombol header ---------- */
function renderBtn(){
  var u=cur(),av=$('akAv'),lb=$('akLbl');
  if(u){av.className='akun-av on';setAvatar(av,u.foto,u.nama);lb.textContent=firstName(u.nama);btn.setAttribute('aria-label','Profil '+u.nama);btn.setAttribute('aria-haspopup','dialog');}
  else{av.className='akun-av';av.innerHTML=ICON;lb.textContent='Masuk';btn.setAttribute('aria-label','Masuk atau daftar');btn.removeAttribute('aria-haspopup');}
}

/* ---------- Halaman login ---------- */
function showTab(v){
  var masuk=v!=='daftar';
  $('tabMasuk').setAttribute('aria-selected',masuk?'true':'false');
  $('tabDaftar').setAttribute('aria-selected',masuk?'false':'true');
  fMasuk.hidden=!masuk;fDaftar.hidden=masuk;
  clearErrs(fMasuk);clearErrs(fDaftar);
  $('akGTtl').textContent=masuk?'Masuk':'Buat akun';
  $('akGSub').textContent=masuk?'Masuk untuk memakai profilmu di perangkat ini.':'Gratis, selesai dalam setengah menit.';
}
function lockPage(on){
  LOCK.forEach(function(sel){
    var el=document.querySelector(sel);
    if(!el)return;
    if(on)el.setAttribute('inert','');else el.removeAttribute('inert');
  });
  document.documentElement.classList.toggle('ak-lock',on);
}
function gateOpen(){return !gate.hidden&&!gate.classList.contains('out');}
function profOpen(){return !prof.hidden;}
function openGate(v){
  hideProfil();
  showTab(v||'masuk');
  gate.classList.remove('out');gate.hidden=false;gate.scrollTop=0;
  lockPage(true);
  if(canHover()){var f=fMasuk.hidden?$('dNama'):$('mEmail');if(f)f.focus();}
}

/* Animasi masuk web: dijalankan setelah halaman login mulai memudar */
function restart(sel,max){
  var els=document.querySelectorAll(sel),n=Math.min(els.length,max||els.length),i,el;
  for(i=0;i<n;i++){
    el=els[i];
    if(!el.getClientRects().length)continue;
    el.style.animation='none';void el.offsetWidth;el.style.animation='';
  }
}
function rise(sel,delay,dy){
  var els=document.querySelectorAll(sel),i,el;
  for(i=0;i<els.length;i++){
    el=els[i];
    if(!el.animate||!el.getClientRects().length)continue;
    el.animate([{opacity:0,transform:'translateY('+dy+'px) scale(.985)'},{opacity:1,transform:'none'}],
      {duration:650,delay:delay+i*70,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});
  }
}
function animateEntry(){
  if(reducedMotion())return;
  var wide=window.matchMedia&&matchMedia('(min-width:860px)').matches;
  rise('.brandbar',0,-18);
  rise('.tabs',70,wide?-18:44);
  rise('.hero',110,26);
  rise('.shelf-head',300,18);
  rise('.shelf',340,26);
  rise('.bar',460,18);
  /* Putar ulang animasi pembuka milik web: logo, judul, chip, punggung buku, kartu */
  restart('.logo rect');
  restart('.hero h1, .hero .lead, .hero .searchbox, .hchip');
  restart('.spine.spine-in');
  restart('#list .rv.in',6);
  if(btn.animate)btn.animate([{transform:'scale(.6)',opacity:0},{transform:'scale(1)',opacity:1}],
    {duration:520,delay:420,easing:'cubic-bezier(.2,.9,.3,1.5)',fill:'backwards'});
}
function closeGate(){
  if(gate.hidden)return;
  lockPage(false);
  if(reducedMotion()){gate.hidden=true;btn.focus();return;}
  gate.classList.add('out');
  setTimeout(animateEntry,120);
  setTimeout(function(){if(gate.classList.contains('out')){gate.hidden=true;gate.classList.remove('out');}},360);
  btn.focus();
}
function lanjutTamu(){if(!BOLEH_TAMU)return;setTamu(true);closeGate();toast('Masuk sebagai guest.');}
function afterAuth(msg){setTamu(false);renderBtn();closeGate();toast(msg);}

/* ---------- Halaman profil ---------- */
function addRow(grp,o){
  var r=document.createElement('div'),tile=document.createElement('span'),k=document.createElement('span'),v=document.createElement('span');
  r.className='pf-row';r.style.setProperty('--t',o.t);
  tile.className='pf-tile';tile.innerHTML=svg(o.icon);
  k.className='pf-k';k.textContent=o.k;
  v.className='pf-v'+(o.v?'':' empty');v.textContent=o.v||'Belum diisi';
  r.appendChild(tile);r.appendChild(k);r.appendChild(v);
  if(o.copy&&o.v){
    var b=document.createElement('button');
    b.type='button';b.className='pf-copy';b.setAttribute('aria-label','Salin '+o.k);
    b.setAttribute('data-ak','salin');b.setAttribute('data-v',o.v);b.innerHTML=svg('copy');
    r.appendChild(b);
  }
  grp.appendChild(r);
}
function fillProfil(u){
  var gA=$('gAkad'),gP=$('gPribadi'),gK=$('gKontak'),sisi=u.prodi||u.kampus;
  setAvatar($('pAv'),u.foto,u.nama);
  $('pFotoHapus').hidden=!u.foto;
  $('pNama').textContent=u.nama;
  $('pPeran').textContent=u.peran||'Pengguna';
  var chip=$('pNimChip');
  if(u.nim){chip.textContent=u.nim;chip.hidden=false;}else{chip.textContent='';chip.hidden=true;}
  $('pLineTxt').textContent=sisi||'Lengkapi profilmu lewat Ubah profil';
  gA.textContent='';gP.textContent='';gK.textContent='';
  addRow(gA,{k:'NIM / NIPD',icon:'idcard',t:'#2F7BF5',v:u.nim,copy:true});
  addRow(gA,{k:'Program studi',icon:'cap',t:'#6366F1',v:u.prodi});
  addRow(gA,{k:'Peran pengguna',icon:'briefcase',t:'#14A3A8',v:u.peran});
  addRow(gP,{k:'Jenis kelamin',icon:'user',t:'#2E9BD6',v:u.gender});
  addRow(gP,{k:'Tempat lahir',icon:'pin',t:'#F59E0B',v:u.tempat});
  addRow(gP,{k:'Tanggal lahir',icon:'calendar',t:'#E5436B',v:fmtTgl(u.tgl)});
  addRow(gK,{k:'Email',icon:'mail',t:'#3B82F6',v:u.email,copy:true});
  addRow(gK,{k:'Kampus',icon:'building',t:'#8B5CF6',v:u.kampus});
  addRow(gK,{k:'Bergabung',icon:'clock',t:'#22A06B',v:u.dibuat?new Date(u.dibuat).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):''});
}
function showView(){
  fEdit.hidden=true;$('pfView').hidden=false;$('pfTtl').textContent='Profil';
}
function showEdit(){
  var u=cur();if(!u)return;
  clearErrs(fEdit);
  fEdit.nama.value=u.nama;fEdit.peran.value=u.peran;fEdit.nim.value=u.nim;fEdit.prodi.value=u.prodi;
  fEdit.kampus.value=u.kampus;fEdit.gender.value=u.gender;fEdit.tempat.value=u.tempat;fEdit.tgl.value=u.tgl;
  var t=new Date(),p=function(n){return (n<10?'0':'')+n;};
  fEdit.tgl.max=t.getFullYear()+'-'+p(t.getMonth()+1)+'-'+p(t.getDate());
  $('pfView').hidden=true;fEdit.hidden=false;$('pfTtl').textContent='Ubah profil';
  prof.scrollTop=0;
  if(canHover())fEdit.nama.focus();
}
function resetHapus(){
  clearTimeout(hapusTimer);
  var h=$('akHapus');if(!h)return;
  h.classList.remove('sure');$('akHapusTxt').textContent='Hapus akun';
}
function openProfil(){
  var u=cur();if(!u){openGate('masuk');return;}
  fillProfil(u);showView();resetHapus();
  var kids=$('pfIn').children,i;
  for(i=0;i<kids.length;i++)kids[i].style.setProperty('--n',i);
  prof.hidden=false;prof.scrollTop=0;lockPage(true);
}
function hideProfil(){if(prof.hidden)return;resetHapus();prof.hidden=true;lockPage(false);}
function closeProfil(){if(prof.hidden)return;hideProfil();btn.focus();}

/* ---------- Foto profil ---------- */
var FOTO_PX=320,FOTO_MAX=10*1024*1024;
function olahFoto(file){
  return new Promise(function(ok,tolak){
    if(!file||!/^image\//.test(file.type))return tolak(new Error('tipe'));
    if(file.size>FOTO_MAX)return tolak(new Error('besar'));
    function gambar(src,w,h,selesai){
      var sisi=Math.min(w,h),c=document.createElement('canvas'),g;
      c.width=c.height=FOTO_PX;
      g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,FOTO_PX,FOTO_PX);
      g.drawImage(src,(w-sisi)/2,(h-sisi)/2,sisi,sisi,0,0,FOTO_PX,FOTO_PX);
      if(selesai)selesai();
      ok(c.toDataURL('image/jpeg',0.86));
    }
    function lewatImg(){
      var url=URL.createObjectURL(file),im=new Image();
      im.onload=function(){gambar(im,im.naturalWidth,im.naturalHeight,function(){URL.revokeObjectURL(url);});};
      im.onerror=function(){URL.revokeObjectURL(url);tolak(new Error('baca'));};
      im.src=url;
    }
    if(window.createImageBitmap){
      createImageBitmap(file,{imageOrientation:'from-image'}).then(function(bm){
        gambar(bm,bm.width,bm.height,function(){if(bm.close)bm.close();});
      },lewatImg);
    }else lewatImg();
  });
}
$('pFile').addEventListener('change',function(e){
  var f=e.target.files&&e.target.files[0],u=cur();
  e.target.value='';
  if(!f||!u)return;
  olahFoto(f).then(function(data){
    var all=users(),rec=all[u.email];
    if(!rec)throw new Error('akun');
    rec.foto=data;
    if(!save(K_USERS,all))throw new Error('simpan');
    renderBtn();fillProfil(cur());toast('Foto profil diperbarui.');
  }).catch(function(err){
    var m=err&&err.message;
    toast(m==='besar'?'Foto terlalu besar. Pilih foto di bawah 10 MB.':
          m==='simpan'?'Foto belum bisa disimpan. Penyimpanan browser penuh atau diblokir.':
          'Foto tidak bisa dibaca. Coba format JPG atau PNG.');
  });
});

/* ---------- Ubah profil ---------- */
fEdit.addEventListener('submit',function(e){
  e.preventDefault();
  var f=fEdit,u=cur(),nama=f.nama.value.trim();
  clearErrs(f);
  if(!u){hideProfil();openGate('masuk');return;}
  if(nama.length<2){setErr(f,'nama','Tulis nama lengkapmu, minimal 2 huruf.');f.nama.focus();return;}
  var all=users(),rec=all[u.email];
  if(!rec){setErr(f,'form','Akun tidak ditemukan. Coba masuk lagi.');return;}
  rec.nama=nama;rec.peran=f.peran.value;rec.nim=f.nim.value.trim();rec.prodi=f.prodi.value.trim();
  rec.kampus=f.kampus.value.trim();rec.gender=f.gender.value;rec.tempat=f.tempat.value.trim();rec.tgl=f.tgl.value;
  if(!save(K_USERS,all)){setErr(f,'form','Profil belum bisa disimpan. Pastikan browser mengizinkan penyimpanan situs.');return;}
  renderBtn();fillProfil(cur());showView();prof.scrollTop=0;
  toast('Profil disimpan.');
});

/* ---------- Daftar ---------- */
fDaftar.addEventListener('submit',function(e){
  e.preventDefault();
  var f=fDaftar,nama=f.nama.value.trim(),email=normEmail(f.email.value),kampus=f.kampus.value.trim(),pw=f.pw.value,pw2=f.pw2.value,first=null;
  clearErrs(f);
  function bad(n,m){setErr(f,n,m);if(!first)first=n;}
  if(nama.length<2)bad('nama','Tulis nama lengkapmu, minimal 2 huruf.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))bad('email','Tulis alamat email yang valid, contoh: nama@kampus.ac.id.');
  if(pw.length<8||!/[A-Za-z]/.test(pw)||!/\d/.test(pw))bad('pw','Kata sandi minimal 8 karakter, campuran huruf dan angka.');
  if(pw2!==pw)bad('pw2','Kata sandi belum sama. Ketik ulang.');
  if(first){focusField(f,first);return;}
  if(!cryptoOk()){setErr(f,'form','Pendaftaran butuh koneksi aman (https). Buka situs lewat alamat https atau localhost.');return;}
  var all=users();
  if(all[email]){bad('email','Email ini sudah terdaftar. Coba masuk.');focusField(f,'email');return;}
  busy(f,true,'Membuat akun…');
  var salt=crypto.getRandomValues(new Uint8Array(16));
  hashPw(pw,salt).then(function(hash){
    var u=users();
    u[email]={nama:nama,kampus:kampus,salt:toB64(salt),hash:hash,iter:ITER,dibuat:Date.now()};
    if(!save(K_USERS,u)||!save(K_SESI,email))throw new Error('simpan');
    f.reset();busy(f,false);
    afterAuth('Akun dibuat. Selamat datang, '+firstName(nama)+'!');
  }).catch(function(){
    busy(f,false);
    setErr(f,'form','Akun belum bisa disimpan. Pastikan browser mengizinkan penyimpanan situs, lalu coba lagi.');
  });
});

/* ---------- Masuk ---------- */
fMasuk.addEventListener('submit',function(e){
  e.preventDefault();
  var f=fMasuk,email=normEmail(f.email.value),pw=f.pw.value,first=null;
  clearErrs(f);
  function bad(n,m){setErr(f,n,m);if(!first)first=n;}
  if(!email)bad('email','Tulis email yang kamu pakai saat mendaftar.');
  if(!pw)bad('pw','Tulis kata sandimu.');
  if(first){focusField(f,first);return;}
  if(Date.now()<kunciSampai){
    setErr(f,'form','Terlalu banyak percobaan. Coba lagi dalam '+Math.ceil((kunciSampai-Date.now())/1000)+' detik.');return;
  }
  if(!cryptoOk()){setErr(f,'form','Masuk butuh koneksi aman (https). Buka situs lewat alamat https atau localhost.');return;}
  var rec=users()[email];
  busy(f,true,'Memeriksa…');
  /* Selalu hitung hash, juga saat email tidak ada, supaya waktunya sama */
  var salt=rec?fromB64(rec.salt):crypto.getRandomValues(new Uint8Array(16));
  hashPw(pw,salt).then(function(hash){
    busy(f,false);
    if(rec&&hash===rec.hash){
      gagal=0;save(K_SESI,email);f.reset();
      afterAuth('Selamat datang kembali, '+firstName(rec.nama)+'!');
    }else{
      gagal++;
      if(gagal>=MAX_GAGAL){kunciSampai=Date.now()+KUNCI_MS;gagal=0;}
      setErr(f,'form','Email atau kata sandi salah. Periksa lagi, atau daftar bila belum punya akun.');
      f.pw.value='';focusField(f,'pw');
    }
  }).catch(function(){busy(f,false);setErr(f,'form','Terjadi kesalahan saat memeriksa kata sandi. Coba lagi.');});
});

/* ---------- Klik ---------- */
function onClick(e){
  var t=e.target.closest?e.target.closest('[data-ak]'):null;
  if(!t)return;
  var a=t.getAttribute('data-ak');
  if(a==='tutup')closeProfil();
  else if(a==='tamu')lanjutTamu();
  else if(a==='tab'){showTab(t.getAttribute('data-v'));var n=fMasuk.hidden?$('dNama'):$('mEmail');if(n&&canHover())n.focus();}
  else if(a==='eye'){
    var inp=t.parentNode.querySelector('input'),show=inp.type==='password';
    inp.type=show?'text':'password';
    t.textContent=show?'Sembunyi':'Lihat';
    t.setAttribute('aria-pressed',show?'true':'false');
    t.setAttribute('aria-label',show?'Sembunyikan kata sandi':'Tampilkan kata sandi');
  }
  else if(a==='salin')salin(t.getAttribute('data-v'));
  else if(a==='foto')$('pFile').click();
  else if(a==='fotoHapus'){
    var uu=cur(),semua=users();
    if(uu&&semua[uu.email]){delete semua[uu.email].foto;save(K_USERS,semua);renderBtn();fillProfil(cur());toast('Foto profil dihapus.');}
  }
  else if(a==='ubah')showEdit();
  else if(a==='batal'){showView();prof.scrollTop=0;}
  else if(a==='keluar'){
    try{localStorage.removeItem(K_SESI);}catch(err){}
    setTamu(false);renderBtn();openGate('masuk');
  }
  else if(a==='hapus'){
    if(!t.classList.contains('sure')){
      t.classList.add('sure');$('akHapusTxt').textContent='Yakin? Ketuk lagi';
      clearTimeout(hapusTimer);hapusTimer=setTimeout(resetHapus,4000);
    }else{
      var u=cur(),all=users();
      if(u){delete all[u.email];save(K_USERS,all);}
      try{localStorage.removeItem(K_SESI);}catch(err){}
      setTamu(false);renderBtn();openGate('daftar');
    }
  }
}
gate.addEventListener('click',onClick);
prof.addEventListener('click',onClick);
btn.addEventListener('click',function(){if(cur())openProfil();else openGate('masuk');});
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  if(gateOpen()&&BOLEH_TAMU){e.preventDefault();lanjutTamu();}
  else if(profOpen()){e.preventDefault();if(!fEdit.hidden){showView();prof.scrollTop=0;}else closeProfil();}
});

/* Sinkron bila akun berubah di tab browser lain */
window.addEventListener('storage',function(e){
  if(e.key!==K_SESI&&e.key!==K_USERS)return;
  renderBtn();
  if(cur()){
    if(gateOpen())closeGate();
    else if(profOpen()&&fEdit.hidden)fillProfil(cur());
  }else if(profOpen()){hideProfil();if(!tamu())openGate('masuk');}
});

/* ---------- Mulai ---------- */
renderBtn();
if(!cur()&&!tamu())openGate('masuk');
})();
