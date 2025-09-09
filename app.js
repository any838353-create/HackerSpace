/**
 * Web Exploitation Teaching Mini‑Site
 *
 * Includes 3 demo webpages:
 *  1) /interceptor.html  → silently makes background requests you can catch in Burp (XHR, form POST, image beacon)
 *  2) /conditional.html  → only shows real content if value=24 (server‑side gate)
 *  3) /session.html      → issues a session key which can unlock /protected.html
 *
 * Quick start:
 *   1) npm init -y && npm i express cookie-parser
 *   2) node app.js
 *   3) Browse to http://localhost:3000/
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// In‑memory store for demo session keys (ephemeral; resets on restart)
const validSessions = new Set();

// --- Helpers ---
const layout = (title, body) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial,sans-serif;margin:2rem;line-height:1.45}
    header{margin-bottom:1.5rem}
    .card{border:1px solid #ddd;border-radius:12px;padding:1rem;margin:1rem 0;box-shadow:0 1px 3px rgba(0,0,0,.05)}
    code,kbd,pre{background:#f7f7f7;border-radius:8px;padding:.15rem .4rem}
    a{color:#0a60ff;text-decoration:none}
    a:hover{text-decoration:underline}
    .muted{opacity:.7}
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <nav class="muted">[ <a href="/">home</a> | <a href="/interceptor.html">interceptor</a> | <a href="/conditional.html">conditional</a> | <a href="/session.html">session</a> ]</nav>
  </header>
  ${body}
</body>
</html>`;

// --- Index ---
app.get('/', (req, res) => {
  res.type('html').send(layout('Web Exploitation Demo', `
    <div class="card">
      <h2>Pages</h2>
      <ul>
        <li><a href="/interceptor.html">/interceptor.html</a> — background requests appear in your proxy (Burp/ZAP).</li>
        <li><a href="/conditional.html">/conditional.html</a> — only shows real content when <code>?value=24</code> is present.</li>
        <li><a href="/session.html">/session.html</a> — get a session key that unlocks <code>/protected.html</code>.</li>
      </ul>
    </div>
    <div class="card">
      <h3>Tip</h3>
      <p>Run your browser through Burp and visit <code>/interceptor.html</code>; you should see a POST to <code>/track</code>, an auto‑submitted form to <code>/submit</code>, and a beacon to <code>/pixel.gif</code>.</p>
    </div>
  `));
});

// --- Page 1: Interceptor demo ---
app.get('/interceptor.html', (req, res) => {
  const body = `
    <div class="card">
      <p>This page performs a few background requests so you can intercept them:</p>
      <ol>
        <li>Fetch POST → <code>/track</code> with a custom header</li>
        <li>Silent image beacon → <code>/pixel.gif</code></li>
        <li>Auto‑submitted form POST → <code>/submit</code></li>
      </ol>
      <p>Open Burp’s Proxy → HTTP history to observe these.</p>
    </div>
    <form id="autopost" class="card" action="/submit" method="POST">
      <input type="hidden" name="username" value="student" />
      <input type="hidden" name="password" value="hunter2" />
      <p class="muted">Auto‑posting demo credentials…</p>
    </form>
    <img alt="" src="/pixel.gif?rand=${Date.now()}" width="1" height="1" style="position:absolute;left:-9999px;top:-9999px" />
    <script>
      // 1) XHR/Fetch with custom header
      fetch('/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Training-Demo': 'Burp-Should-See-Me'
        },
        body: 'event=pageview&path=/interceptor.html'
      }).catch(()=>{});

      // 2) Auto-submit form
      window.addEventListener('load', () => {
        setTimeout(() => document.getElementById('autopost').submit(), 400);
      });
    </script>
  `;
  res.type('html').send(layout('Page 1 — Interceptor Demo', body));
});

// Endpoints to catch the background traffic
app.post('/track', (req, res) => {
  res.type('text').send('ok');
});
app.post('/submit', (req, res) => {
  res.type('html').send(layout('Submit Received', `
    <p>Form POST received. Burp should have recorded this request.</p>
    <pre>${escapeHtml(JSON.stringify(req.body, null, 2))}</pre>
    <p><a href="/interceptor.html">Back</a></p>
  `));
});
app.get('/pixel.gif', (req, res) => {
  // 1x1 transparent GIF
  const gif = Buffer.from(
    '47494638396101000100800000FFFFFF00FFFFFF21F90401000001002C00000000010001000002024401003B',
    'hex'
  );
  res.set('Content-Type', 'image/gif');
  res.send(gif);
});

// --- Page 2: Conditional page requiring value=24 ---
app.get('/conditional.html', (req, res) => {
  const ok = req.query.value === '24';
  if (!ok) {
    res.status(403).type('html').send(layout('Page 2 — Access Denied', `
      <p><strong>Access denied.</strong> Provide the correct query parameter.</p>
      <p>Try: <code>/conditional.html?value=24</code></p>
    `));
    return;
  }
  res.type('html').send(layout('Page 2 — Conditional Content', `
    <div class="card">
      <h2>Welcome!</h2>
      <p>You provided <code>value=24</code>, so the hidden content is revealed.</p>
    </div>
  `));
});

// --- Page 3: Session issuance + gated target page ---
app.get('/session.html', (req, res) => {
  const key = crypto.randomBytes(16).toString('hex');
  validSessions.add(key);

  // For demo purposes, we intentionally set a readable cookie (not HttpOnly) so students can copy it.
  res.cookie('session', key, { httpOnly: false, sameSite: 'Lax' });

  res.type('html').send(layout('Page 3 — Get Session Key', `
    <div class="card">
      <p>Here is your session key (also set as a cookie named <code>session</code>):</p>
      <pre><code>${key}</code></pre>
      <p>Use it to access the protected page:</p>
      <ul>
        <li><a href="/protected.html?session=${key}">/protected.html?session=${key}</a></li>
        <li>or visit <code>/protected.html</code> and rely on the <code>session</code> cookie</li>
      </ul>
    </div>
  `));
});

app.get('/protected.html', (req, res) => {
  const key = (req.query.session || req.cookies.session || '').toString();
  if (!key || !validSessions.has(key)) {
    res.status(401).type('html').send(layout('Protected — Unauthorized', `
      <p><strong>Unauthorized.</strong> You need a valid session key.</p>
      <p>Get one from <a href="/session.html">/session.html</a>, then retry.</p>
    `));
    return;
  }
  res.type('html').send(layout('Protected — Success', `
    <div class="card">
      <h2>Access Granted ✅</h2>
      <p>Your key <code>${key}</code> is valid.</p>
      <p class="muted">(In real apps, keys would be stored server‑side with expiry, user binding, and HttpOnly cookies.)</p>
    </div>
  `));
});

// --- Utilities ---
function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

app.listen(PORT, () => {
  console.log(`\nWeb Exploitation Demo running → http://localhost:${PORT}/`);
});
