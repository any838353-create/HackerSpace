const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const validSessions = new Set();

const layout = (title, body) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
      color: #00ff41;
      min-height: 100vh;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px 0;
      border-bottom: 2px solid #00ff41;
    }
    
    .header h1 {
      font-size: 2.5rem;
      text-shadow: 0 0 10px #00ff41;
      margin-bottom: 10px;
      animation: glow 2s ease-in-out infinite alternate;
    }
    
    @keyframes glow {
      from { text-shadow: 0 0 10px #00ff41, 0 0 20px #00ff41, 0 0 30px #00ff41; }
      to { text-shadow: 0 0 5px #00ff41, 0 0 10px #00ff41, 0 0 15px #00ff41; }
    }
    
    .subtitle {
      color: #00bcd4;
      font-size: 1.1rem;
      opacity: 0.8;
    }
    
    .nav {
      background: rgba(0, 255, 65, 0.1);
      border: 1px solid #00ff41;
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 30px;
      text-align: center;
    }
    
    .nav a {
      color: #00ff41;
      text-decoration: none;
      padding: 8px 16px;
      margin: 0 5px;
      border: 1px solid transparent;
      border-radius: 5px;
      transition: all 0.3s ease;
      display: inline-block;
    }
    
    .nav a:hover {
      background: rgba(0, 255, 65, 0.2);
      border-color: #00ff41;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 255, 65, 0.3);
    }
    
    .content {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid #333;
      border-radius: 10px;
      padding: 30px;
      margin: 20px 0;
      backdrop-filter: blur(10px);
    }
    
    .demo-list {
      list-style: none;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    
    .demo-item {
      background: rgba(0, 255, 65, 0.1);
      border: 1px solid #00ff41;
      border-radius: 8px;
      padding: 20px;
      transition: all 0.3s ease;
    }
    
    .demo-item:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(0, 255, 65, 0.3);
      background: rgba(0, 255, 65, 0.15);
    }
    
    .demo-item a {
      color: #00bcd4;
      text-decoration: none;
      font-size: 1.2rem;
      font-weight: bold;
    }
    
    .demo-item a:hover {
      color: #00ff41;
      text-shadow: 0 0 5px #00ff41;
    }
    
    .form-container {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid #333;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .status-message {
      padding: 10px 15px;
      border-radius: 5px;
      margin: 15px 0;
      border-left: 4px solid;
    }
    
    .status-success {
      background: rgba(0, 255, 65, 0.1);
      border-left-color: #00ff41;
      color: #00ff41;
    }
    
    .status-error {
      background: rgba(255, 0, 0, 0.1);
      border-left-color: #ff0040;
      color: #ff0040;
    }
    
    .status-info {
      background: rgba(0, 188, 212, 0.1);
      border-left-color: #00bcd4;
      color: #00bcd4;
    }
    
    code {
      background: rgba(0, 0, 0, 0.5);
      color: #00ff41;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }
    
    .btn {
      background: linear-gradient(45deg, #00ff41, #00bcd4);
      color: #000;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
      margin: 5px;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 255, 65, 0.4);
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 10px;
      }
      
      .header h1 {
        font-size: 2rem;
      }
      
      .nav a {
        display: block;
        margin: 5px 0;
      }
      
      .demo-list {
        grid-template-columns: 1fr;
      }
    }
    
    .terminal-window {
      background: #000;
      border: 1px solid #333;
      border-radius: 5px;
      padding: 15px;
      margin: 15px 0;
      position: relative;
    }
    
    .terminal-header {
      background: #333;
      margin: -15px -15px 10px -15px;
      padding: 8px 15px;
      border-radius: 5px 5px 0 0;
      font-size: 0.9rem;
      color: #999;
    }
    
    .loading {
      display: inline-block;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      <div class="subtitle">Web Security Training Platform</div>
    </div>
    <nav class="nav">
      <a href="/">🏠 Home</a>
      <a href="/interceptor.html">🔍 Interceptor</a>
      <a href="/conditional.html">🔐 Conditional</a>
      <a href="/session.html">🔑 Session</a>
    </nav>
    <div class="content">
      ${body}
    </div>
  </div>
</body>
</html>`;

app.get('/', (req, res) => {
  res.type('html').send(layout('Web Exploitation Demo',
    `<div class="status-info">
      <strong>🎯 Welcome to the Web Security Training Platform</strong><br>
      Learn web exploitation techniques through hands-on interactive demos.
    </div>
    
    <ul class="demo-list">
      <li class="demo-item">
        <a href="/interceptor.html">🔍 Interceptor Demo</a>
        <p style="color: #999; margin-top: 10px; font-size: 0.9rem;">
          Learn to intercept HTTP requests and responses using proxy tools like Burp Suite. 
          This demo shows auto-posting forms and background fetch requests.
        </p>
      </li>
      <li class="demo-item">
        <a href="/conditional.html">🔐 Conditional Access Demo</a>
        <p style="color: #999; margin-top: 10px; font-size: 0.9rem;">
          Understand how applications use query parameters for access control. 
          Try bypassing the restriction with the correct parameter value.
        </p>
      </li>
      <li class="demo-item">
        <a href="/session.html">🔑 Session Management Demo</a>
        <p style="color: #999; margin-top: 10px; font-size: 0.9rem;">
          Explore session-based authentication and cookie manipulation. 
          Learn how session keys are generated and validated.
        </p>
      </li>
    </ul>
    
    <div class="terminal-window">
      <div class="terminal-header">💡 Pro Tip</div>
      <p style="color: #00ff41;">Use browser developer tools (F12) to inspect network requests, modify parameters, and analyze responses during these demos.</p>
    </div>`
  ));
});

app.get('/interceptor.html', (req, res) => {
  res.type('html').send(layout('Interceptor Demo', `
    <div class="status-info">
      <strong>🔍 HTTP Request Interception Training</strong><br>
      This demo shows how to intercept and analyze HTTP requests using proxy tools.
    </div>
    
    <div class="terminal-window">
      <div class="terminal-header">📋 Instructions</div>
      <ol style="color: #00bcd4; padding-left: 20px;">
        <li>Set up Burp Suite or any HTTP proxy tool</li>
        <li>Configure your browser to use the proxy</li>
        <li>Watch the network traffic when this page loads</li>
        <li>Observe the automatic form submission and background requests</li>
      </ol>
    </div>
    
    <div class="form-container">
      <h3 style="color: #00ff41; margin-bottom: 15px;">🚀 Auto-Posting Form</h3>
      <p>This form will automatically submit after page load:</p>
      <form id="autopost" action="/submit" method="POST" style="margin: 15px 0;">
        <div style="margin: 10px 0;">
          <label style="color: #00bcd4;">Username:</label>
          <input type="hidden" name="username" value="student" />
          <code>student</code>
        </div>
        <div style="margin: 10px 0;">
          <label style="color: #00bcd4;">Password:</label>
          <input type="hidden" name="password" value="hunter2" />
          <code>hunter2</code>
        </div>
      </form>
    </div>
    
    <div class="status-message status-info" id="status">
      <span class="loading">⏳</span> Page loaded. Auto-submission will occur in <span id="countdown">3</span> seconds...
    </div>
    
    <img src="/pixel.gif?rand=${Date.now()}" width="1" height="1" style="border: 1px solid #333;" />
    
    <div class="terminal-window">
      <div class="terminal-header">🔬 What to Look For</div>
      <ul style="color: #999; padding-left: 20px;">
        <li><strong>POST request</strong> to /submit with form data</li>
        <li><strong>Background fetch</strong> to /track with custom headers</li>
        <li><strong>Image request</strong> to /pixel.gif for tracking</li>
        <li><strong>Custom header:</strong> X-Training-Demo: Burp-Should-See-Me</li>
      </ul>
    </div>
    
    <script>
      let countdown = 3;
      const countdownElement = document.getElementById('countdown');
      const statusElement = document.getElementById('status');
      
      const timer = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        if (countdown <= 0) {
          clearInterval(timer);
          statusElement.innerHTML = '<span style="color: #00ff41;">✅</span> Form submitted! Check your proxy logs.';
          statusElement.className = 'status-message status-success';
        }
      }, 1000);
      
      fetch('/track', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded', 
          'X-Training-Demo': 'Burp-Should-See-Me' 
        },
        body: 'event=pageview&path=/interceptor.html'
      }).then(() => {
        console.log('Background tracking request sent');
      });
      
      window.onload = () => {
        setTimeout(() => {
          document.getElementById('autopost').submit();
        }, 3000);
      };
    </script>`));
});

app.post('/track', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Tracking request received',
    timestamp: new Date().toISOString(),
    data: req.body 
  });
});

app.post('/submit', (req, res) => {
  res.send(layout('Form Submission Result', `
    <div class="status-success">
      <strong>✅ Form POST Received</strong><br>
      The intercepted form has been successfully submitted.
    </div>
    
    <div class="terminal-window">
      <div class="terminal-header">📨 Submitted Data</div>
      <pre style="color: #00ff41; background: #000; padding: 15px; border-radius: 5px; overflow-x: auto;">
${JSON.stringify(req.body, null, 2)}
      </pre>
    </div>
    
    <div class="form-container">
      <h3 style="color: #00ff41; margin-bottom: 15px;">🔍 Analysis</h3>
      <ul style="color: #00bcd4; padding-left: 20px;">
        <li><strong>Method:</strong> POST</li>
        <li><strong>Content-Type:</strong> ${req.headers['content-type'] || 'Not specified'}</li>
        <li><strong>Data Format:</strong> ${req.body ? 'Form URL-encoded' : 'No data'}</li>
        <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
      </ul>
    </div>
    
    <div class="terminal-window">
      <div class="terminal-header">🎯 Interception Success</div>
      <p style="color: #00ff41;">
        If you were using a proxy tool like Burp Suite, you should have been able to:
      </p>
      <ol style="color: #999; padding-left: 20px; margin-top: 10px;">
        <li>See this POST request in your proxy history</li>
        <li>Intercept and modify the form data</li>
        <li>Analyze the request headers and body</li>
        <li>Observe the automatic submission timing</li>
      </ol>
    </div>
    
    <a href="/interceptor.html" class="btn">🔄 Try Again</a>
    <a href="/" class="btn">🏠 Back to Home</a>
  `));
});

app.get('/pixel.gif', (req, res) => {
  const gif = Buffer.from('47494638396101000100800000FFFFFF00FFFFFF21F90401000001002C00000000010001000002024401003B', 'hex');
  res.set('Content-Type', 'image/gif');
  res.send(gif);
});

app.get('/conditional.html', (req, res) => {
  if (req.query.value === '24') {
    res.send(layout('Conditional Success', `
      <div class="status-success">
        <strong>✅ Access Granted!</strong><br>
        You successfully provided the correct parameter: <code>value=24</code>
      </div>
      
      <div class="terminal-window">
        <div class="terminal-header">🎉 Congratulations!</div>
        <p style="color: #00ff41;">You've successfully bypassed the conditional access control by providing the correct query parameter.</p>
      </div>
      
      <div class="form-container">
        <h3 style="color: #00ff41; margin-bottom: 15px;">🔬 What You Learned</h3>
        <ul style="color: #00bcd4; padding-left: 20px;">
          <li>How query parameters can control access</li>
          <li>The importance of proper authorization checks</li>
          <li>How to test different parameter values</li>
          <li>Client-side vs server-side validation</li>
        </ul>
      </div>
      
      <a href="/conditional.html" class="btn">🔄 Try Again</a>
      <a href="/" class="btn">🏠 Back to Home</a>
    `));
  } else {
    res.status(403).send(layout('Access Denied', `
      <div class="status-error">
        <strong>❌ Access Denied</strong><br>
        Invalid or missing parameter value.
      </div>
      
      <div class="terminal-window">
        <div class="terminal-header">🎯 Challenge</div>
        <p style="color: #00bcd4;">
          This page requires a specific query parameter to grant access. 
          Can you figure out what value is needed?
        </p>
      </div>
      
      <div class="form-container">
        <h3 style="color: #00ff41; margin-bottom: 15px;">💡 Hints</h3>
        <ul style="color: #999; padding-left: 20px;">
          <li>Try adding <code>?value=</code> to the URL</li>
          <li>The required value is a two-digit number</li>
          <li>It's the number of hours in a day</li>
          <li>Inspect the page source or try: <code>?value=24</code></li>
        </ul>
      </div>
      
      <div class="terminal-window">
        <div class="terminal-header">🔍 Testing Methods</div>
        <ol style="color: #00bcd4; padding-left: 20px;">
          <li>Manual URL modification</li>
          <li>Browser developer tools</li>
          <li>Burp Suite parameter fuzzing</li>
          <li>Automated parameter discovery tools</li>
        </ol>
      </div>
      
      <a href="/conditional.html?value=24" class="btn">🔑 Try the Hint</a>
      <a href="/" class="btn">🏠 Back to Home</a>
    `));
  }
});

app.get('/session.html', (req, res) => {
  const key = crypto.randomBytes(16).toString('hex');
  validSessions.add(key);
  res.cookie('session', key, { httpOnly: false });
  res.send(layout('Session Management Demo', `
    <div class="status-success">
      <strong>🔑 Session Created Successfully</strong><br>
      A new session key has been generated and stored in your browser cookies.
    </div>
    
    <div class="terminal-window">
      <div class="terminal-header">📋 Session Information</div>
      <p><strong>Your Session Key:</strong></p>
      <div style="background: #000; padding: 10px; border-radius: 5px; margin: 10px 0; word-break: break-all;">
        <code style="color: #00ff41; font-size: 1.1rem;" id="sessionKey">${key}</code>
        <button onclick="copyToClipboard('${key}')" class="btn" style="margin-left: 10px; padding: 5px 10px; font-size: 0.8rem;">📋 Copy</button>
      </div>
    </div>
    
    <div class="form-container">
      <h3 style="color: #00ff41; margin-bottom: 15px;">🔬 Session Testing</h3>
      <p style="color: #00bcd4;">Try accessing the protected page using different methods:</p>
      
      <div style="margin: 20px 0;">
        <a href="/protected.html?session=${key}" class="btn">🔗 Via URL Parameter</a>
        <a href="/protected.html" class="btn">🍪 Via Cookie Only</a>
      </div>
    </div>
    
    <div class="terminal-window">
      <div class="terminal-header">🎯 Learning Objectives</div>
      <ul style="color: #999; padding-left: 20px;">
        <li><strong>Session Generation:</strong> How random session keys are created</li>
        <li><strong>Cookie Storage:</strong> How sessions are stored in browser cookies</li>
        <li><strong>Authorization:</strong> How servers validate session keys</li>
        <li><strong>Security:</strong> Risks of exposing session keys in URLs</li>
      </ul>
    </div>
    
    <div class="terminal-window">
      <div class="terminal-header">🛠️ Testing Ideas</div>
      <ol style="color: #00bcd4; padding-left: 20px;">
        <li>Inspect cookies in browser developer tools</li>
        <li>Try modifying the session key value</li>
        <li>Test with invalid/expired session keys</li>
        <li>Compare URL vs cookie-based authentication</li>
        <li>Try accessing protected page without any session</li>
      </ol>
    </div>
    
    <script>
      function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
          const btn = event.target;
          const original = btn.textContent;
          btn.textContent = '✅ Copied!';
          btn.style.background = '#00ff41';
          setTimeout(() => {
            btn.textContent = original;
            btn.style.background = '';
          }, 2000);
        }).catch(() => {
          alert('Session key: ' + text);
        });
      }
      
      console.log('Session created:', '${key}');
      console.log('Cookie set:', document.cookie);
    </script>
  `));
});

app.get('/protected.html', (req, res) => {
  const key = (req.query.session || req.cookies.session || '').toString();
  if (!validSessions.has(key)) {
    return res.status(401).send(layout('Unauthorized Access', `
      <div class="status-error">
        <strong>❌ Unauthorized Access</strong><br>
        No valid session key found. Please obtain a session key first.
      </div>
      
      <div class="terminal-window">
        <div class="terminal-header">🔍 Authentication Failed</div>
        <p style="color: #ff0040;">
          This protected resource requires a valid session key for access.
        </p>
      </div>
      
      <div class="form-container">
        <h3 style="color: #00ff41; margin-bottom: 15px;">🛠️ Debugging Information</h3>
        <ul style="color: #999; padding-left: 20px;">
          <li><strong>URL Parameter:</strong> <code>${req.query.session || 'Not provided'}</code></li>
          <li><strong>Cookie Value:</strong> <code>${req.cookies.session || 'Not set'}</code></li>
          <li><strong>Session Valid:</strong> <code style="color: #ff0040;">false</code></li>
        </ul>
      </div>
      
      <div class="terminal-window">
        <div class="terminal-header">💡 What to Try</div>
        <ol style="color: #00bcd4; padding-left: 20px;">
          <li>Go back and generate a new session key</li>
          <li>Check if cookies are enabled in your browser</li>
          <li>Inspect the session parameter in the URL</li>
          <li>Try accessing with a different session key</li>
        </ol>
      </div>
      
      <a href="/session.html" class="btn">🔑 Get Session Key</a>
      <a href="/" class="btn">🏠 Back to Home</a>
    `));
  }
  
  res.send(layout('Protected Resource', `
    <div class="status-success">
      <strong>✅ Access Granted</strong><br>
      Welcome to the protected area! Your session is valid.
    </div>
    
    <div class="terminal-window">
      <div class="terminal-header">🔐 Session Details</div>
      <p><strong>Valid Session Key:</strong></p>
      <div style="background: #000; padding: 10px; border-radius: 5px; margin: 10px 0; word-break: break-all;">
        <code style="color: #00ff41; font-size: 1.1rem;">${key}</code>
      </div>
    </div>
    
    <div class="form-container">
      <h3 style="color: #00ff41; margin-bottom: 15px;">🔬 Authentication Analysis</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 10px; color: #00bcd4;"><strong>Method</strong></td>
          <td style="padding: 10px; color: #00bcd4;"><strong>Value</strong></td>
          <td style="padding: 10px; color: #00bcd4;"><strong>Status</strong></td>
        </tr>
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 10px;">URL Parameter</td>
          <td style="padding: 10px;"><code>${req.query.session || 'Not provided'}</code></td>
          <td style="padding: 10px; color: ${req.query.session === key ? '#00ff41' : '#999'};">
            ${req.query.session === key ? '✅ Valid' : '❌ Invalid/Missing'}
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 10px;">Cookie</td>
          <td style="padding: 10px;"><code>${req.cookies.session || 'Not set'}</code></td>
          <td style="padding: 10px; color: ${req.cookies.session === key ? '#00ff41' : '#999'};">
            ${req.cookies.session === key ? '✅ Valid' : '❌ Invalid/Missing'}
          </td>
        </tr>
      </table>
    </div>
    
    <div class="terminal-window">
      <div class="terminal-header">🎯 Security Insights</div>
      <ul style="color: #999; padding-left: 20px;">
        <li><strong>Session Exposure:</strong> ${req.query.session ? 'Session key visible in URL (security risk!)' : 'Session transmitted via secure cookie'}</li>
        <li><strong>Authentication Method:</strong> ${req.query.session === key ? 'URL Parameter' : 'HTTP Cookie'}</li>
        <li><strong>Session Storage:</strong> Server-side validation with in-memory store</li>
        <li><strong>Best Practice:</strong> Use HttpOnly cookies and HTTPS in production</li>
      </ul>
    </div>
    
    <div class="terminal-window">
      <div class="terminal-header">🛠️ Advanced Testing</div>
      <ol style="color: #00bcd4; padding-left: 20px;">
        <li>Try modifying the session key in the URL or cookie</li>
        <li>Test with expired or invalid session keys</li>
        <li>Compare security between URL and cookie methods</li>
        <li>Analyze session fixation vulnerabilities</li>
        <li>Test session hijacking scenarios</li>
      </ol>
    </div>
    
    <a href="/session.html" class="btn">🔑 Generate New Session</a>
    <a href="/" class="btn">🏠 Back to Home</a>
    
    <script>
      console.log('Protected page accessed with session:', '${key}');
      console.log('Authentication method:', '${req.query.session === key ? 'URL Parameter' : 'Cookie'}');
    </script>
  `));
});

if (require.main === module) {
  app.listen(PORT, () => console.log("Running on http://localhost:"+PORT));
} else {
  module.exports = app;
}
