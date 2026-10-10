/* Akun Pustaka Ilmiah: halaman login penuh (Masuk dan Daftar).
   Berdiri sendiri: file ini menambahkan halaman login, tombol akun di header, dialog profil,
   dan gayanya sendiri. Cukup pasang <script src="akun.js"></script> di index.html (setelah app.js).

   Perilaku:
   - Saat situs dibuka dan belum masuk, halaman login tampil penuh.
   - Setelah masuk atau daftar, halaman login menutup dan tombol di header menjadi profil.
   - Tombol "Guest account" masuk ke web tanpa akun; pilihan ini diingat selama tab browser terbuka.
     Untuk mewajibkan login, ubah BOLEH_TAMU di bawah menjadi false.
   - Setelah masuk (login, daftar, atau guest), halaman login memudar dan isi web muncul dengan animasi masuk.

   CATATAN PENTING: situs ini statis (GitHub Pages), jadi akun disimpan di browser perangkat ini
   (localStorage), bukan di server. Akun tidak ikut ke perangkat lain dan hilang kalau data situs dihapus.
   Kata sandi diacak dengan PBKDF2-SHA256 plus garam acak, tidak disimpan apa adanya.
   Karena semua berjalan di browser, ini BUKAN pengaman yang sungguhan: orang yang paham bisa melewatinya
   lewat DevTools. Cocok sebagai profil lokal, bukan untuk melindungi data rahasia. */
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
  var em=load(K_SESI,null),u=users();
  if(em&&u[em])return {email:em,nama:u[em].nama,kampus:u[em].kampus||'',dibuat:u[em].dibuat};
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

/* ---------- Gaya ---------- */
var CSS=`
.akun-btn{margin-left:auto;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:5px 14px 5px 6px;border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:999px;font-weight:600;font-size:14.5px;cursor:pointer}
.akun-btn:hover{border-color:var(--accent)}
.akun-av{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--paper);color:var(--muted);font:600 14px/1 var(--display)}
.akun-av svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.akun-av.on{background:linear-gradient(135deg,var(--accent),#7A4BC9);color:#fff}
.akun-av.big{width:56px;height:56px;font-size:24px}
.akun-lbl{max-width:11ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* Halaman login penuh */
html.ak-lock,html.ak-lock body{overflow:hidden}
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

/* Formulir (dipakai di halaman login) */
.akun-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;background:var(--paper);border:1px solid var(--line);border-radius:999px}
.akun-tabs button{min-height:42px;border:0;border-radius:999px;background:none;font-weight:600;color:var(--muted);cursor:pointer}
.akun-tabs button[aria-selected=true]{background:var(--hl);color:var(--hl-ink)}
.akun-form label.akun-l{display:block;font-size:14px;font-weight:500;margin:14px 0 4px}
.akun-opt{font-weight:400;color:var(--muted)}
.akun-form input{width:100%;min-height:46px;padding:11px 12px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:12px}
.akun-form input:focus{border-color:var(--accent);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent)}
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

/* Dialog profil */
.akun-dlg{border:0;padding:0;width:min(420px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;border-radius:22px;background:var(--surface);color:var(--ink);box-shadow:0 30px 70px -20px rgba(8,10,40,.65)}
.akun-dlg::backdrop{background:rgba(14,17,38,.58);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}
.akun-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:20px 20px 18px;color:var(--on-indigo);
  background-color:var(--indigo);background-image:radial-gradient(360px 220px at 100% -10%,rgba(255,216,77,.30),transparent 65%),radial-gradient(320px 240px at 0% 120%,rgba(194,37,92,.40),transparent 65%)}
.akun-head h2{font-size:26px;color:inherit}
.akun-sub{margin:4px 0 0;font-size:14.5px;color:var(--on-indigo-muted)}
.akun-x{flex:none;width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:26px;line-height:1;cursor:pointer}
.akun-x:hover{background:rgba(255,255,255,.26)}
.akun-body{padding:18px 20px 22px}
.akun-prof{display:flex;align-items:center;gap:14px}
.akun-prof b{display:block;font:600 20px/1.25 var(--display)}
.akun-prof span{display:block;font-size:14px;color:var(--muted);overflow-wrap:anywhere}
.akun-acts{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.akun-acts .btn{flex:1 1 auto;min-height:44px}
.akun-danger{color:#C8401F;border-color:color-mix(in srgb,#C8401F 45%,var(--line))}
.akun-danger.sure{background:#C8401F;border-color:#C8401F;color:#fff}
@media (prefers-reduced-motion:no-preference){
  .akun-dlg[open]{animation:akunIn .28s cubic-bezier(.2,.8,.2,1)}
  @keyframes akunIn{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}
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

var DLG_HTML=`
<div class="akun-head">
  <div><h2 id="akTtl">Akunku</h2><p class="akun-sub">Kamu sedang masuk.</p></div>
  <button class="akun-x" type="button" data-ak="tutup" aria-label="Tutup">&times;</button>
</div>
<div class="akun-body">
  <div class="akun-prof"><span class="akun-av on big" id="pAv"></span>
    <div><b id="pNama"></b><span id="pEmail"></span><span id="pInfo"></span></div></div>
  <p class="akun-note">Artikel yang kamu simpan dan tambahkan sendiri tetap tersimpan di perangkat ini, baik sedang masuk maupun tidak.</p>
  <div class="akun-acts">
    <button class="btn" type="button" data-ak="keluar">Keluar</button>
    <button class="btn akun-danger" type="button" data-ak="hapus" id="akHapus">Hapus akun</button>
  </div>
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

var dlg=document.createElement('dialog');
dlg.className='akun-dlg';dlg.id='akunDlg';dlg.setAttribute('aria-labelledby','akTtl');
dlg.innerHTML=DLG_HTML;
document.body.appendChild(dlg);

function $(id){return document.getElementById(id);}
var fMasuk=$('fMasuk'),fDaftar=$('fDaftar');

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

/* ---------- Tombol header ---------- */
function renderBtn(){
  var u=cur(),av=$('akAv'),lb=$('akLbl');
  if(u){av.className='akun-av on';av.textContent=initial(u.nama);lb.textContent=firstName(u.nama);btn.setAttribute('aria-label','Akun '+u.nama);btn.setAttribute('aria-haspopup','dialog');}
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
function openGate(v){
  if(dlg.open&&dlg.close)dlg.close();
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
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)return;
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
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  lockPage(false);
  if(reduce){gate.hidden=true;btn.focus();return;}
  gate.classList.add('out');
  setTimeout(animateEntry,120);
  setTimeout(function(){if(gate.classList.contains('out')){gate.hidden=true;gate.classList.remove('out');}},360);
  btn.focus();
}
function lanjutTamu(){if(!BOLEH_TAMU)return;setTamu(true);closeGate();toast('Masuk sebagai guest.');}
function afterAuth(msg){setTamu(false);renderBtn();closeGate();toast(msg);}

/* ---------- Dialog profil ---------- */
function resetHapus(){
  clearTimeout(hapusTimer);
  var h=$('akHapus');h.classList.remove('sure');h.textContent='Hapus akun';
}
function openProfil(){
  var u=cur();if(!u){openGate('masuk');return;}
  $('pAv').textContent=initial(u.nama);
  $('pNama').textContent=u.nama;$('pEmail').textContent=u.email;
  var info=[];
  if(u.kampus)info.push(u.kampus);
  if(u.dibuat)info.push('Bergabung '+new Date(u.dibuat).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}));
  $('pInfo').textContent=info.join(', ');
  resetHapus();
  if(!dlg.open){if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');}
}
function closeProfil(){resetHapus();if(dlg.close)dlg.close();else dlg.removeAttribute('open');btn.focus();}

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
  else if(a==='keluar'){
    try{localStorage.removeItem(K_SESI);}catch(err){}
    setTamu(false);resetHapus();renderBtn();openGate('masuk');
  }
  else if(a==='hapus'){
    if(!t.classList.contains('sure')){
      t.classList.add('sure');t.textContent='Yakin? Ketuk lagi untuk hapus';
      clearTimeout(hapusTimer);hapusTimer=setTimeout(resetHapus,4000);
    }else{
      var u=cur(),all=users();
      if(u){delete all[u.email];save(K_USERS,all);}
      try{localStorage.removeItem(K_SESI);}catch(err){}
      setTamu(false);resetHapus();renderBtn();openGate('daftar');
    }
  }
}
gate.addEventListener('click',onClick);
dlg.addEventListener('click',function(e){if(e.target===dlg){closeProfil();return;}onClick(e);});
dlg.addEventListener('close',resetHapus);
btn.addEventListener('click',function(){if(cur())openProfil();else openGate('masuk');});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&gateOpen()&&BOLEH_TAMU){e.preventDefault();lanjutTamu();}});

/* Sinkron bila akun berubah di tab browser lain */
window.addEventListener('storage',function(e){
  if(e.key!==K_SESI&&e.key!==K_USERS)return;
  renderBtn();
  if(cur()){if(gateOpen())closeGate();}
  else if(dlg.open&&dlg.close){dlg.close();if(!tamu())openGate('masuk');}
});

/* ---------- Mulai ---------- */
renderBtn();
if(!cur()&&!tamu())openGate('masuk');
})();
