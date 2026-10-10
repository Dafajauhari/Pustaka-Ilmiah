/* Akun Pustaka Ilmiah: form Masuk dan Daftar.
   Berdiri sendiri: file ini menambahkan tombol di header, dialog akun, dan gayanya sendiri,
   jadi cukup memasang <script src="akun.js"></script> di index.html (setelah app.js).

   CATATAN PENTING: situs ini statis (GitHub Pages), jadi akun disimpan di browser perangkat ini
   (localStorage), bukan di server. Akun tidak ikut ke perangkat atau browser lain, dan hilang kalau
   data situs dihapus. Kata sandi tidak disimpan apa adanya: diacak dengan PBKDF2-SHA256 plus garam acak.
   Ini cocok sebagai profil lokal, bukan sistem login yang aman untuk data rahasia. */
(function(){
'use strict';

var K_USERS='pi:akun:users',K_SESI='pi:akun:sesi';
var ITER=150000,MAX_GAGAL=5,KUNCI_MS=30000;
var gagal=0,kunciSampai=0,hapusTimer=0;

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
var CSS=
'.brandbar{position:relative}'+
'.akun-btn{margin-left:auto;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:5px 14px 5px 6px;border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:999px;font-weight:600;font-size:14.5px;cursor:pointer}'+
'.akun-btn:hover{border-color:var(--accent)}'+
'.akun-av{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--paper);color:var(--muted);font:600 14px/1 var(--display)}'+
'.akun-av svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'+
'.akun-av.on{background:linear-gradient(135deg,var(--accent),#7A4BC9);color:#fff}'+
'.akun-av.big{width:56px;height:56px;font-size:24px}'+
'.akun-lbl{max-width:11ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
'.akun-dlg{border:0;padding:0;width:min(440px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;border-radius:22px;background:var(--surface);color:var(--ink);box-shadow:0 30px 70px -20px rgba(8,10,40,.65)}'+
'.akun-dlg::backdrop{background:rgba(14,17,38,.58);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}'+
'.akun-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:20px 20px 18px;color:var(--on-indigo);'+
  'background-color:var(--indigo);background-image:radial-gradient(360px 220px at 100% -10%,rgba(255,216,77,.30),transparent 65%),radial-gradient(320px 240px at 0% 120%,rgba(194,37,92,.40),transparent 65%)}'+
'.akun-head h2{font-size:26px;color:inherit}'+
'.akun-sub{margin:4px 0 0;font-size:14.5px;color:var(--on-indigo-muted)}'+
'.akun-x{flex:none;width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:26px;line-height:1;cursor:pointer}'+
'.akun-x:hover{background:rgba(255,255,255,.26)}'+
'.akun-body{padding:18px 20px 22px}'+
'.akun-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;background:var(--paper);border:1px solid var(--line);border-radius:999px}'+
'.akun-tabs button{min-height:40px;border:0;border-radius:999px;background:none;font-weight:600;color:var(--muted);cursor:pointer}'+
'.akun-tabs button[aria-selected=true]{background:var(--hl);color:var(--hl-ink)}'+
'.akun-dlg label.akun-l{display:block;font-size:14px;font-weight:500;margin:14px 0 4px}'+
'.akun-opt{font-weight:400;color:var(--muted)}'+
'.akun-dlg input{width:100%;min-height:46px;padding:11px 12px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:12px}'+
'.akun-dlg input:focus{border-color:var(--accent);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent)}'+
'.akun-dlg input[aria-invalid=true]{border-color:#C8401F}'+
'.akun-pw{position:relative}'+
'.akun-pw input{padding-right:78px}'+
'.akun-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);min-height:34px;padding:0 12px;border:0;border-radius:8px;background:var(--paper);color:var(--ink);font-size:13.5px;font-weight:600;cursor:pointer}'+
'.akun-hint{display:block;margin-top:5px;font-size:13px;color:var(--muted)}'+
'.akun-err{display:block;min-height:0;margin-top:5px;font-size:13.5px;color:#C8401F}'+
'.akun-err:empty{display:none}'+
'.akun-form-err{margin:12px 0 0;font-size:14px;color:#C8401F}'+
'.akun-form-err:empty{display:none}'+
'.akun-dlg .btn.primary{width:100%;min-height:48px;margin-top:18px;font-size:16px}'+
'.akun-dlg .btn.primary:disabled{opacity:.6}'+
'.akun-note{margin:16px 0 0;font-size:13px;line-height:1.5;color:var(--muted)}'+
'.akun-prof{display:flex;align-items:center;gap:14px}'+
'.akun-prof b{display:block;font:600 20px/1.25 var(--display)}'+
'.akun-prof span{display:block;font-size:14px;color:var(--muted);overflow-wrap:anywhere}'+
'.akun-acts{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}'+
'.akun-acts .btn{flex:1 1 auto;min-height:44px}'+
'.akun-danger{color:#C8401F;border-color:color-mix(in srgb,#C8401F 45%,var(--line))}'+
'.akun-danger.sure{background:#C8401F;border-color:#C8401F;color:#fff}'+
'@media (prefers-reduced-motion:no-preference){'+
  '.akun-dlg[open]{animation:akunIn .28s cubic-bezier(.2,.8,.2,1)}'+
  '@keyframes akunIn{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}'+
'}';

/* ---------- Kerangka HTML (hanya teks tetap, tidak ada input pengguna) ---------- */
var ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';
var HTML=
'<div class="akun-head">'+
  '<div><h2 id="akTtl">Akun</h2><p class="akun-sub" id="akSub"></p></div>'+
  '<button class="akun-x" type="button" data-ak="tutup" aria-label="Tutup">&times;</button>'+
'</div>'+
'<div class="akun-body">'+
  '<div id="akAuth">'+
    '<div class="akun-tabs" role="tablist" aria-label="Pilih Masuk atau Daftar">'+
      '<button type="button" role="tab" id="tabMasuk" aria-selected="true" aria-controls="fMasuk" data-ak="tab" data-v="masuk">Masuk</button>'+
      '<button type="button" role="tab" id="tabDaftar" aria-selected="false" aria-controls="fDaftar" data-ak="tab" data-v="daftar">Daftar</button>'+
    '</div>'+

    '<form id="fMasuk" role="tabpanel" aria-labelledby="tabMasuk" novalidate>'+
      '<label class="akun-l" for="mEmail">Email</label>'+
      '<input id="mEmail" name="email" type="email" autocomplete="email" inputmode="email" aria-describedby="mEmailE">'+
      '<small class="akun-err" id="mEmailE" data-err="email"></small>'+
      '<label class="akun-l" for="mPw">Kata sandi</label>'+
      '<div class="akun-pw"><input id="mPw" name="pw" type="password" autocomplete="current-password" aria-describedby="mPwE">'+
        '<button type="button" class="akun-eye" data-ak="eye" aria-label="Tampilkan kata sandi" aria-pressed="false">Lihat</button></div>'+
      '<small class="akun-err" id="mPwE" data-err="pw"></small>'+
      '<p class="akun-form-err" role="alert" data-err="form"></p>'+
      '<button class="btn primary" type="submit">Masuk</button>'+
    '</form>'+

    '<form id="fDaftar" role="tabpanel" aria-labelledby="tabDaftar" novalidate hidden>'+
      '<label class="akun-l" for="dNama">Nama lengkap</label>'+
      '<input id="dNama" name="nama" type="text" autocomplete="name" aria-describedby="dNamaE">'+
      '<small class="akun-err" id="dNamaE" data-err="nama"></small>'+
      '<label class="akun-l" for="dEmail">Email</label>'+
      '<input id="dEmail" name="email" type="email" autocomplete="email" inputmode="email" aria-describedby="dEmailE">'+
      '<small class="akun-err" id="dEmailE" data-err="email"></small>'+
      '<label class="akun-l" for="dKampus">Kampus atau institusi <span class="akun-opt">(opsional)</span></label>'+
      '<input id="dKampus" name="kampus" type="text" autocomplete="organization">'+
      '<label class="akun-l" for="dPw">Kata sandi</label>'+
      '<div class="akun-pw"><input id="dPw" name="pw" type="password" autocomplete="new-password" aria-describedby="dPwH dPwE">'+
        '<button type="button" class="akun-eye" data-ak="eye" aria-label="Tampilkan kata sandi" aria-pressed="false">Lihat</button></div>'+
      '<small class="akun-hint" id="dPwH">Minimal 8 karakter, campuran huruf dan angka.</small>'+
      '<small class="akun-err" id="dPwE" data-err="pw"></small>'+
      '<label class="akun-l" for="dPw2">Ulangi kata sandi</label>'+
      '<input id="dPw2" name="pw2" type="password" autocomplete="new-password" aria-describedby="dPw2E">'+
      '<small class="akun-err" id="dPw2E" data-err="pw2"></small>'+
      '<p class="akun-form-err" role="alert" data-err="form"></p>'+
      '<button class="btn primary" type="submit">Buat akun</button>'+
    '</form>'+

    '<p class="akun-note">Akun ini tersimpan di browser perangkat ini saja dan tidak ikut ke perangkat lain. Kata sandi diacak (hash), tidak disimpan apa adanya.</p>'+
  '</div>'+

  '<div id="akProfil" hidden>'+
    '<div class="akun-prof"><span class="akun-av on big" id="pAv"></span>'+
      '<div><b id="pNama"></b><span id="pEmail"></span><span id="pInfo"></span></div></div>'+
    '<p class="akun-note">Artikel yang kamu simpan dan tambahkan sendiri tetap tersimpan di perangkat ini, baik sedang masuk maupun tidak.</p>'+
    '<div class="akun-acts">'+
      '<button class="btn" type="button" data-ak="keluar">Keluar</button>'+
      '<button class="btn akun-danger" type="button" data-ak="hapus" id="akHapus">Hapus akun</button>'+
    '</div>'+
  '</div>'+
'</div>';

/* ---------- Pasang ke halaman ---------- */
var st=document.createElement('style');st.id='akunStyle';st.textContent=CSS;document.head.appendChild(st);

var bar=document.querySelector('.brandbar')||document.body;
var btn=document.createElement('button');
btn.type='button';btn.className='akun-btn';btn.id='akunBtn';btn.setAttribute('aria-haspopup','dialog');
btn.innerHTML='<span class="akun-av" id="akAv"></span><span class="akun-lbl" id="akLbl"></span>';
bar.appendChild(btn);

var dlg=document.createElement('dialog');
dlg.className='akun-dlg';dlg.id='akunDlg';dlg.setAttribute('aria-labelledby','akTtl');
dlg.innerHTML=HTML;
document.body.appendChild(dlg);

function $(id){return document.getElementById(id);}
var fMasuk=$('fMasuk'),fDaftar=$('fDaftar');

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

/* ---------- Tampilan ---------- */
function renderBtn(){
  var u=cur(),av=$('akAv'),lb=$('akLbl');
  if(u){av.className='akun-av on';av.textContent=initial(u.nama);lb.textContent=firstName(u.nama);btn.setAttribute('aria-label','Akun '+u.nama);}
  else{av.className='akun-av';av.innerHTML=ICON;lb.textContent='Masuk';btn.setAttribute('aria-label','Masuk atau daftar');}
}
function showTab(v){
  var masuk=v!=='daftar';
  $('tabMasuk').setAttribute('aria-selected',masuk?'true':'false');
  $('tabDaftar').setAttribute('aria-selected',masuk?'false':'true');
  fMasuk.hidden=!masuk;fDaftar.hidden=masuk;
  clearErrs(fMasuk);clearErrs(fDaftar);
  $('akSub').textContent=masuk?'Masuk untuk memakai profilmu di perangkat ini.':'Buat akun gratis, selesai dalam setengah menit.';
}
function showProfil(){
  var u=cur();if(!u)return;
  $('akAuth').hidden=true;$('akProfil').hidden=false;
  $('akTtl').textContent='Akunku';$('akSub').textContent='Kamu sedang masuk.';
  $('pAv').textContent=initial(u.nama);
  $('pNama').textContent=u.nama;$('pEmail').textContent=u.email;
  var info=[];
  if(u.kampus)info.push(u.kampus);
  if(u.dibuat)info.push('Bergabung '+new Date(u.dibuat).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}));
  $('pInfo').textContent=info.join(', ');
  resetHapus();
}
function showAuth(v){
  $('akProfil').hidden=true;$('akAuth').hidden=false;$('akTtl').textContent='Akun';showTab(v||'masuk');
}
function resetHapus(){
  clearTimeout(hapusTimer);
  var h=$('akHapus');h.classList.remove('sure');h.textContent='Hapus akun';
}
function openDlg(v){
  if(cur())showProfil();else showAuth(v);
  if(!dlg.open){if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');}
  var first=cur()?dlg.querySelector('[data-ak=keluar]'):(fMasuk.hidden?$('dNama'):$('mEmail'));
  if(first)first.focus();
}
function closeDlg(){resetHapus();if(dlg.close)dlg.close();else dlg.removeAttribute('open');btn.focus();}

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
    f.reset();busy(f,false);renderBtn();showProfil();
    toast('Akun dibuat. Selamat datang, '+firstName(nama)+'!');
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
      gagal=0;save(K_SESI,email);f.reset();renderBtn();showProfil();
      toast('Selamat datang kembali, '+firstName(rec.nama)+'!');
    }else{
      gagal++;
      if(gagal>=MAX_GAGAL){kunciSampai=Date.now()+KUNCI_MS;gagal=0;}
      setErr(f,'form','Email atau kata sandi salah. Periksa lagi, atau daftar bila belum punya akun.');
      f.pw.value='';focusField(f,'pw');
    }
  }).catch(function(){busy(f,false);setErr(f,'form','Terjadi kesalahan saat memeriksa kata sandi. Coba lagi.');});
});

/* ---------- Klik di dialog ---------- */
dlg.addEventListener('click',function(e){
  if(e.target===dlg){closeDlg();return;}
  var t=e.target.closest?e.target.closest('[data-ak]'):null;
  if(!t)return;
  var a=t.getAttribute('data-ak');
  if(a==='tutup')closeDlg();
  else if(a==='tab'){showTab(t.getAttribute('data-v'));var n=fMasuk.hidden?$('dNama'):$('mEmail');if(n)n.focus();}
  else if(a==='eye'){
    var inp=t.parentNode.querySelector('input'),show=inp.type==='password';
    inp.type=show?'text':'password';
    t.textContent=show?'Sembunyi':'Lihat';
    t.setAttribute('aria-pressed',show?'true':'false');
    t.setAttribute('aria-label',show?'Sembunyikan kata sandi':'Tampilkan kata sandi');
  }
  else if(a==='keluar'){
    try{localStorage.removeItem(K_SESI);}catch(err){}
    renderBtn();showAuth('masuk');toast('Kamu sudah keluar.');
    $('mEmail').focus();
  }
  else if(a==='hapus'){
    if(!t.classList.contains('sure')){
      t.classList.add('sure');t.textContent='Yakin? Ketuk lagi untuk hapus';
      clearTimeout(hapusTimer);hapusTimer=setTimeout(resetHapus,4000);
    }else{
      var u=cur(),all=users();
      if(u){delete all[u.email];save(K_USERS,all);}
      try{localStorage.removeItem(K_SESI);}catch(err){}
      resetHapus();renderBtn();showAuth('daftar');toast('Akun dihapus dari perangkat ini.');
    }
  }
});
dlg.addEventListener('close',resetHapus);
btn.addEventListener('click',function(){openDlg('masuk');});

/* Sinkron bila akun berubah di tab browser lain */
window.addEventListener('storage',function(e){
  if(e.key===K_SESI||e.key===K_USERS){renderBtn();if(dlg.open){if(cur())showProfil();else showAuth('masuk');}}
});

renderBtn();
})();
