// Server kecil untuk Pustaka Ilmiah: menyajikan file statis dan meneruskan permintaan AI ke Gemini.
// Lokal (PowerShell): $env:GEMINI_API_KEY="isi_key_kamu"; node server.js   (butuh Node.js 18+)
// Hosting (Render): atur GEMINI_API_KEY dan ALLOW_ORIGIN di Environment Variables.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.MODEL || 'gemini-2.5-flash';
const ORIGIN = process.env.ALLOW_ORIGIN || 'https://namamu.github.io'; // hanya domain, tanpa path
const MAX_BODY = 200 * 1024;
const LIMIT = 20, WINDOW = 10 * 60 * 1000; // 20 permintaan AI per 10 menit per IP
const hits = new Map();

const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function clientIp(req) {
  const fwd = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.socket.remoteAddress || 'x';
}
function send(res, code, obj) {
  res.writeHead(code, {'Content-Type':'application/json; charset=utf-8'});
  res.end(JSON.stringify(obj));
}
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < WINDOW);
  arr.push(now); hits.set(ip, arr);
  return arr.length > LIMIT;
}

async function handleAI(req, res) {
  if (!KEY) return send(res, 500, {error: 'GEMINI_API_KEY belum diatur di server.'});
  if (limited(clientIp(req))) return send(res, 429, {error: 'Terlalu banyak permintaan.'});
  let body = '', size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) return send(res, 413, {error: 'Permintaan terlalu besar.'});
    body += chunk;
  }
  let prompt;
  try { prompt = JSON.parse(body).prompt; } catch { return send(res, 400, {error: 'JSON tidak valid.'}); }
  if (typeof prompt !== 'string' || !prompt.trim()) return send(res, 400, {error: 'prompt kosong.'});
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(MODEL) + ':generateContent', {
      method: 'POST',
      headers: {'x-goog-api-key': KEY, 'content-type': 'application/json'},
      body: JSON.stringify({
        contents: [{role: 'user', parts: [{text: prompt}]}],
        generationConfig: {maxOutputTokens: 4000}
      })
    });
    const data = await r.json();
    if (!r.ok) return send(res, 502, {error: (data.error && data.error.message) || 'Gagal memanggil API.'});
    const cand = (data.candidates || [])[0];
    const parts = (cand && cand.content && cand.content.parts) || [];
    const text = parts.map(p => p.text || '').join('');
    if (!text) return send(res, 502, {error: 'Jawaban kosong atau diblokir oleh Gemini.'});
    send(res, 200, {text});
  } catch (e) {
    send(res, 502, {error: 'Tidak bisa menghubungi API.'});
  }
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.method === 'POST' && url.pathname === '/api/ai') return handleAI(req, res);
  if (req.method !== 'GET') return send(res, 405, {error: 'Method tidak diizinkan.'});
  let p = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const file = path.join(__dirname, path.normalize(p));
  const allowed = ['index.html', 'Jurnalimkom.html', 'Jurnalimkom.css', 'app.js', 'data.js', 'koleksi.js', 'config.js'];
  if (!file.startsWith(__dirname) || !allowed.includes(path.basename(file))) {
    res.writeHead(404); return res.end('Tidak ditemukan');
  }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Tidak ditemukan'); }
    res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream'});
    res.end(buf);
  });
}).listen(PORT, () => console.log('Pustaka Ilmiah berjalan di http://localhost:' + PORT + (KEY ? '' : '  (GEMINI_API_KEY belum diatur: AI nonaktif)')));
