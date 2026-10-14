/* riwayat.js — Riwayat pencarian untuk Pustaka Ilmiah (tampilan seperti saran Google)
 *
 * Pasang di index.html SETELAH app.js:
 *     <script src="riwayat.js?v=4"></script>
 *
 * Daftar muncul di bawah kotak pencarian saat diklik atau diketik, tersusun ke bawah,
 * dan menyempit mengikuti huruf yang diketik. Disimpan di localStorage ("pi:riwayat"),
 * maksimal 8 pencarian. Memilih item memakai aksi data-act="q" milik app.js.
 */
(function () {
  var KEY = "pi:riwayat";
  var MAKS = 8;
  var input, box, dd;
  var timer = null;
  var aktif = -1;
  var terbuka = false;

  var IKON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>';

  /* ---------- penyimpanan ---------- */
  function baca() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(d) ? d : [];
    } catch (e) { return []; }
  }
  function tulis(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
  }
  /* sambung=true: dari ketikan yang berhenti, buang awalan lama ("mot" -> "motivasi") */
  function catat(teks, sambung) {
    teks = (teks || "").trim();
    if (teks.length < 2) return;
    var k = teks.toLowerCase();
    var d = baca().filter(function (x) {
      var xl = x.toLowerCase();
      if (xl === k) return false;
      if (sambung && k.indexOf(xl) === 0) return false;
      return true;
    });
    d.unshift(teks);
    tulis(d.slice(0, MAKS));
  }
  function hapusSatu(teks) {
    tulis(baca().filter(function (x) { return x !== teks; }));
    tampil();
  }
  function hapusSemua() {
    tulis([]);
    tutup();
  }

  /* ---------- tampilan ---------- */
  function pasangGaya() {
    var s = document.createElement("style");
    s.textContent =
      ".rdd{position:fixed;z-index:1000;box-sizing:border-box;background:#fff;color:#202124;" +
      "border-radius:20px;box-shadow:0 4px 12px rgba(32,33,36,.28);" +
      "padding:8px 0 6px;max-height:min(65vh,420px);overflow-y:auto;font-family:inherit}" +
      ".rdd[hidden]{display:none}" +
      ".rdd-row{display:flex;align-items:center}" +
      ".rdd-row.on,.rdd-row:hover{background:#f1f3f4}" +
      ".rdd-pick{all:unset;box-sizing:border-box;flex:1;min-width:0;display:flex;align-items:center;gap:18px;" +
      "padding:12px 8px 12px 18px;cursor:pointer;font-size:16px;line-height:1.3}" +
      ".rdd-pick svg{flex:none;width:20px;height:20px;fill:#5f6368}" +
      ".rdd-pick span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".rdd-x{all:unset;cursor:pointer;flex:none;padding:8px 18px;font-size:20px;line-height:1;" +
      "color:#70757a;opacity:0}" +
      ".rdd-row:hover .rdd-x,.rdd-row.on .rdd-x,.rdd-x:focus-visible{opacity:1}" +
      "@media (hover:none){.rdd-x{opacity:.7}}" +
      ".rdd-x:hover{color:#c2255c}" +
      ".rdd-foot{display:flex;justify-content:flex-end;padding:4px 18px 2px}" +
      ".rdd-clear{all:unset;cursor:pointer;font-size:13px;color:#70757a}" +
      ".rdd-clear:hover{text-decoration:underline}" +
      ".rdd-pick:focus-visible,.rdd-x:focus-visible,.rdd-clear:focus-visible{outline:2px solid #2f55d4;outline-offset:-2px;border-radius:8px}";
    document.head.appendChild(s);
  }

  function posisi() {
    var r = box.getBoundingClientRect();
    dd.style.top = (r.bottom + 6) + "px";
    dd.style.left = r.left + "px";
    dd.style.width = r.width + "px";
  }

  function tampil() {
    var q = input.value.trim().toLowerCase();
    var d = baca().filter(function (x) {
      return !q || x.toLowerCase().indexOf(q) > -1;
    });
    if (!d.length || (d.length === 1 && d[0].toLowerCase() === q)) { tutup(); return; }

    dd.innerHTML = "";
    aktif = -1;

    d.forEach(function (teks) {
      var baris = document.createElement("div");
      baris.className = "rdd-row";

      var pilih = document.createElement("button");
      pilih.type = "button";
      pilih.className = "rdd-pick";
      pilih.setAttribute("data-act", "q");      /* ditangani app.js */
      pilih.setAttribute("data-v", teks);
      pilih.innerHTML = IKON;
      var label = document.createElement("span");
      label.textContent = teks;
      pilih.appendChild(label);

      var x = document.createElement("button");
      x.type = "button";
      x.className = "rdd-x";
      x.textContent = "\u00d7";
      x.setAttribute("aria-label", "Hapus dari riwayat: " + teks);
      x.addEventListener("click", function () { hapusSatu(teks); });

      baris.appendChild(pilih);
      baris.appendChild(x);
      dd.appendChild(baris);
    });

    var foot = document.createElement("div");
    foot.className = "rdd-foot";
    var bersih = document.createElement("button");
    bersih.type = "button";
    bersih.className = "rdd-clear";
    bersih.textContent = "Hapus semua riwayat";
    bersih.addEventListener("click", hapusSemua);
    foot.appendChild(bersih);
    dd.appendChild(foot);

    dd.hidden = false;
    terbuka = true;
    posisi();
  }

  function tutup() {
    if (!dd) return;
    dd.hidden = true;
    terbuka = false;
    aktif = -1;
  }

  function geser(arah) {
    var baris = dd.querySelectorAll(".rdd-row");
    if (!baris.length) return;
    if (aktif > -1) baris[aktif].classList.remove("on");
    aktif = (aktif + arah + baris.length) % baris.length;
    baris[aktif].classList.add("on");
    baris[aktif].scrollIntoView({ block: "nearest" });
  }

  /* ---------- pemasangan ---------- */
  function mulai() {
    input = document.getElementById("q");
    if (!input) return;
    box = input.closest(".searchbox") || input.parentElement;

    pasangGaya();
    dd = document.createElement("div");
    dd.className = "rdd";
    dd.setAttribute("role", "group");
    dd.setAttribute("aria-label", "Riwayat pencarian");
    dd.hidden = true;
    /* jangan biarkan klik di daftar mencabut fokus dari kotak pencarian */
    dd.addEventListener("mousedown", function (e) { e.preventDefault(); });
    document.body.appendChild(dd);

    input.addEventListener("focus", tampil);
    input.addEventListener("click", function () { if (!terbuka) tampil(); });
    input.addEventListener("blur", function () { setTimeout(tutup, 180); });

    input.addEventListener("input", function () {
      tampil();
      clearTimeout(timer);
      timer = setTimeout(function () { catat(input.value, true); }, 2000);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); if (!terbuka) tampil(); else geser(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (terbuka) geser(-1); }
      else if (e.key === "Escape") { tutup(); }
      else if (e.key === "Enter") {
        var baris = dd.querySelectorAll(".rdd-pick");
        if (terbuka && aktif > -1 && baris[aktif]) baris[aktif].click();
        else { clearTimeout(timer); catat(input.value); }
        tutup();
      }
    });

    /* Chip contoh dan item riwayat sama-sama memakai data-act="q" */
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest('[data-act="q"]');
      if (t && t.dataset.v) { catat(t.dataset.v); tutup(); }
    });

    window.addEventListener("resize", function () { if (terbuka) posisi(); });
    window.addEventListener("scroll", function () { if (terbuka) posisi(); }, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mulai);
  } else {
    mulai();
  }

  window.catatRiwayat = catat;
})();
