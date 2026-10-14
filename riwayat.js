/* riwayat.js — Riwayat pencarian untuk Pustaka Ilmiah (versi tersambung ke app.js)
 *
 * Pasang di index.html SETELAH app.js:
 *     <script src="riwayat.js?v=2"></script>
 *
 * - Disimpan di localStorage dengan kunci "pi:riwayat" (maks. 8 pencarian terakhir).
 * - Klik riwayat memakai aksi data-act="q" milik app.js, jadi perilakunya sama
 *   dengan chip contoh: kotak terisi, hasil disaring, halaman bergulir ke hasil.
 */
(function () {
  var KEY = "pi:riwayat";
  var MAKS = 8;
  var input = null;
  var panel = null;
  var timer = null;

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
  function catat(teks) {
    teks = (teks || "").trim();
    if (teks.length < 2) return;
    var k = teks.toLowerCase();
    var d = baca().filter(function (x) { return x.toLowerCase() !== k; });
    d.unshift(teks);
    tulis(d.slice(0, MAKS));
    setTimeout(gambar, 0);
  }
  function hapusSatu(teks) {
    tulis(baca().filter(function (x) { return x !== teks; }));
    gambar();
  }
  function hapusSemua() {
    tulis([]);
    gambar();
  }

  /* ---------- tampilan ---------- */
  function pasangGaya() {
    if (document.getElementById("riwayat-gaya")) return;
    var s = document.createElement("style");
    s.id = "riwayat-gaya";
    s.textContent =
      ".riwayat{margin-top:14px;display:flex;flex-wrap:wrap;align-items:center;gap:8px}" +
      ".riwayat[hidden]{display:none}" +
      ".riwayat-judul{font-size:13px;color:rgba(255,255,255,.72);margin-right:4px}" +
      ".riwayat-item{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.28);" +
      "border-radius:999px;background:rgba(255,255,255,.06);color:#fff;font-size:14px}" +
      ".riwayat-item button{all:unset;cursor:pointer;color:inherit;font-size:14px}" +
      ".riwayat-cari{padding:7px 6px 7px 14px}" +
      ".riwayat-x{padding:7px 12px 7px 6px;opacity:.6;line-height:1}" +
      ".riwayat-cari:hover,.riwayat-x:hover{opacity:1}" +
      ".riwayat-item button:focus-visible,.riwayat-bersih:focus-visible{outline:2px solid #ffd84d;outline-offset:2px;border-radius:999px}" +
      ".riwayat-bersih{all:unset;cursor:pointer;font-size:13px;color:#ffd84d;margin-left:4px;text-decoration:underline}";
    document.head.appendChild(s);
  }

  function gambar() {
    if (!panel) return;
    var d = baca();
    panel.innerHTML = "";
    panel.hidden = d.length === 0;
    if (!d.length) return;

    var judul = document.createElement("span");
    judul.className = "riwayat-judul";
    judul.textContent = "Terakhir dicari";
    panel.appendChild(judul);

    d.forEach(function (teks) {
      var item = document.createElement("span");
      item.className = "riwayat-item";

      var cari = document.createElement("button");
      cari.type = "button";
      cari.className = "riwayat-cari";
      cari.textContent = teks;
      cari.setAttribute("data-act", "q");   /* ditangani oleh app.js */
      cari.setAttribute("data-v", teks);
      cari.setAttribute("aria-label", "Cari lagi: " + teks);

      var x = document.createElement("button");
      x.type = "button";
      x.className = "riwayat-x";
      x.textContent = "\u00d7";
      x.setAttribute("aria-label", "Hapus dari riwayat: " + teks);
      x.addEventListener("click", function () { hapusSatu(teks); });

      item.appendChild(cari);
      item.appendChild(x);
      panel.appendChild(item);
    });

    var bersih = document.createElement("button");
    bersih.type = "button";
    bersih.className = "riwayat-bersih";
    bersih.textContent = "Hapus semua";
    bersih.addEventListener("click", hapusSemua);
    panel.appendChild(bersih);
  }

  /* ---------- pemasangan ---------- */
  function mulai() {
    input = document.getElementById("q");
    var chips = document.querySelector(".hchips");
    if (!input || !chips) return;

    pasangGaya();
    panel = document.createElement("div");
    panel.className = "riwayat";
    panel.setAttribute("role", "group");
    panel.setAttribute("aria-label", "Riwayat pencarian");
    chips.parentNode.insertBefore(panel, chips.nextSibling);

    /* Enter di kotak pencarian */
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") catat(input.value);
    });
    /* Berhenti mengetik 1,5 detik */
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { catat(input.value); }, 1500);
    });
    /* Klik chip contoh atau item riwayat (data-act="q") */
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest('[data-act="q"]');
      if (t && t.dataset.v) catat(t.dataset.v);
    });

    gambar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mulai);
  } else {
    mulai();
  }

  window.catatRiwayat = catat;
})();
