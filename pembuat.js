/* pembuat.js — Isi tab "Pembuat".
 * Edit data di bawah ini saja. Kolom yang dikosongkan tampil sebagai "Belum diisi". */
(function () {
  var PEMBUAT = {
    nama: "Dafa Jauhari Masnun",
    sub: "Mahasiswa S1 Teknik Informatika, Universitas Negeri Surabaya",
    gmail: "dafajm9@gmail.com",
    linkedin: "https://www.linkedin.com/in/fairuz-febrian-putra-widodo-8490a9441",
    instagram: "@dafajhry"
  };

  var IKON = {
    gmail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    linkedin: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 11v5M8 8v.01M12 16v-5M12 13a2.5 2.5 0 0 1 5 0v3"/>',
    instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><path d="M17 7v.01"/>'
  };
  var PANAH = '<svg class="me-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  function bersih(s) { return String(s || "").trim(); }

  function baris(kunci, label, nilai, href, tampil) {
    var li = document.createElement("li");
    var ada = !!nilai;
    var el = document.createElement(ada && href ? "a" : "div");
    el.className = "me-row";
    if (ada && href) {
      el.href = href;
      if (href.indexOf("http") === 0) { el.target = "_blank"; el.rel = "noopener noreferrer"; }
    }
    el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + IKON[kunci] + "</svg>";

    var txt = document.createElement("span");
    txt.className = "me-txt";
    var l = document.createElement("span");
    l.className = "me-lbl";
    l.textContent = label;
    var v = document.createElement("span");
    v.className = "me-val" + (ada ? "" : " me-empty");
    v.textContent = ada ? (tampil || nilai) : "Belum diisi";
    txt.appendChild(l);
    txt.appendChild(v);
    el.appendChild(txt);
    if (ada && href) el.insertAdjacentHTML("beforeend", PANAH);

    li.appendChild(el);
    return li;
  }

  function mulai() {
    var list = document.getElementById("meList");
    if (!list) return;

    var nama = bersih(PEMBUAT.nama);
    document.getElementById("meNama").textContent = nama;
    document.getElementById("meSub").textContent = bersih(PEMBUAT.sub);
    document.getElementById("meAv").textContent = nama ? nama.charAt(0).toUpperCase() : "?";

    var gmail = bersih(PEMBUAT.gmail);
    var li = bersih(PEMBUAT.linkedin);
    var ig = bersih(PEMBUAT.instagram).replace(/^@/, "");

    var liUrl = li ? (/^https?:\/\//i.test(li) ? li : "https://" + li) : "";

    list.appendChild(baris("gmail", "Gmail", gmail, gmail ? "mailto:" + gmail : ""));
    list.appendChild(baris("linkedin", "LinkedIn", li, liUrl, li.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")));
    list.appendChild(baris("instagram", "Instagram", ig, ig ? "https://instagram.com/" + encodeURIComponent(ig) : "", ig ? "@" + ig : ""));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mulai);
  } else {
    mulai();
  }
})();

/* Cadangan: pastikan halaman tab "me" tampil walau app.js belum versi terbaru */
(function () {
  document.addEventListener("click", function (e) {
    var tb = e.target.closest && e.target.closest("[data-tab]");
    var me = document.getElementById("v-me");
    if (!tb || !me) return;
    if (tb.dataset.tab === "me") {
      ["lib", "idea", "cmp", "sv"].forEach(function (n) {
        var v = document.getElementById("v-" + n);
        if (v) v.hidden = true;
      });
      me.hidden = false;
    } else {
      me.hidden = true;
    }
  });
})();
