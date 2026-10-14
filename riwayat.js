/* riwayat.js — Riwayat pencarian untuk Pustaka Ilmiah
 *
 * Cara pasang: taruh file ini di folder yang sama dengan index.html, lalu
 * tambahkan baris ini di index.html, SETELAH <script src="app.js"> :
 *
 *     <script src="riwayat.js"></script>
 *
 * Riwayat disimpan di browser (localStorage), maksimal 8 pencarian terakhir.
 */
(function () {
  var KEY = "pustaka_riwayat_v1";
  var MAKS = 8;
  var input = null;
  var panel = null;
  var timer = null;

  /* ---------- penyimpanan ---------- */
  function baca() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function tulis(daftar) {
    try {
      localStorage.setItem(KEY, JSON.stringify(daftar));
    } catch (e) {
      /* penyimpanan penuh atau diblokir: abaikan */
    }
  }

  function catat(teks) {
    teks = (teks || "").trim();
    if (teks.length < 2) return;
    var kunci = teks.toLowerCase();
    var daftar = baca().filter(function (x) {
      return x.toLowerCase() !== kunci;
    });
    daftar.unshift(teks);
    tulis(daftar.slice(0, MAKS));
    gambar();
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
      ".riwayat-judul{font-size:13px;color:rgba(255,255,255,.7);margin-right:4px}" +
      ".riwayat-item{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.28);" +
      "border-radius:999px;background:rgba(255,255,255,.06);color:#fff;font:inherit;font-size:14px}" +
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
    var daftar = baca();
    panel.innerHTML = "";
    panel.hidden = daftar.length === 0;
    if (!daftar.length) return;

    var judul = document.createElement("span");
    judul.className = "riwayat-judul";
    judul.textContent = "Terakhir dicari";
    panel.appendChild(judul);

    daftar.forEach(function (teks) {
      var item = document.createElement("span");
      item.className = "riwayat-item";

      var cari = document.createElement("button");
      cari.type = "button";
      cari.className = "riwayat-cari";
      cari.textContent = teks;
      cari.setAttribute("aria-label", "Cari lagi: " + teks);
      cari.addEventListener("click", function () {
        input.value = teks;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
        catat(teks);
      });

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

  /* ---------- pemasangan ke halaman ---------- */
  function cariBarisChip() {
    var kandidat = document.querySelectorAll("button, a, span, div");
    for (var i = 0; i < kandidat.length; i++) {
      var el = kandidat[i];
      if (el.children.length === 0 && /^\s*umpan balik\s*$/i.test(el.textContent)) {
        return el.parentElement;
      }
    }
    return null;
  }

  function pasang() {
    input = document.querySelector('input[placeholder^="Cari judul"]');
    if (!input) return false;
    if (document.querySelector(".riwayat")) return true;

    pasangGaya();
    panel = document.createElement("div");
    panel.className = "riwayat";
    panel.setAttribute("aria-label", "Riwayat pencarian");

    var baris = cariBarisChip();
    if (baris && baris.parentElement) {
      baris.parentElement.insertBefore(panel, baris.nextSibling);
    } else {
      var kotak = input.parentElement || input;
      kotak.parentElement.insertBefore(panel, kotak.nextSibling);
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") catat(input.value);
    });
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { catat(input.value); }, 1500);
    });

    gambar();
    return true;
  }

  /* Halaman bisa digambar ulang (mis. setelah login), jadi dipantau terus. */
  function mulai() {
    pasang();
    new MutationObserver(function () {
      if (!document.querySelector(".riwayat")) pasang();
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mulai);
  } else {
    mulai();
  }

  /* Opsional: panggil dari app.js bila ingin mencatat pencarian secara manual */
  window.catatRiwayat = catat;
})();
