const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ In-memory data stores
const users = [];
const qrData = {};

// ✅ Middleware: check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.session && req.session.username) {
    return next();
  } else {
    return res.redirect('/login.html');
  }
}

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
}));

// ✅ Redirect root to login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// ✅ Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const existingUser = users.find(user => user.username === username);

  if (existingUser) {
    return res.send(`<p style="color:red; text-align:center; font-family:Poppins">User already exists. <a href="/register.html">Try again</a></p>`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ username, passwordHash });
  qrData[username] = [];
  res.redirect('/login.html');
});

// ✅ Login (admin vs user redirect)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.send('Invalid credentials. <a href="/login.html">Try again</a>');
  }

  req.session.username = username;

  if (username === 'admin') {
    return res.redirect('/admin.html');
  }

  res.redirect('/dashboard.html');
});

// ✅ Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// ✅ Generate QR
app.post('/generate', isLoggedIn, async (req, res) => {
  const { url, color, size } = req.body;
  const username = req.session.username;

  try {
    const qrOptions = {
      color: {
        dark: color || "#000000",
        light: "#FFFFFF"
      },
      width: parseInt(size) || 200
    };

    const qrUrl = await QRCode.toDataURL(url, qrOptions);

    qrData[username].push({ url, color, size, imageUrl: qrUrl });

    res.json({ imageUrl: qrUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send("QR generation failed.");
  }
});

// ✅ Get QR history (block admin here)
app.get('/user/qrs', isLoggedIn, (req, res) => {
  const username = req.session.username;

  if (username === 'admin') {
    return res.status(403).send("Admin does not have personal QR history.");
  }

  res.json(qrData[username] || []);
});

// ✅ Admin panel data
app.get('/admin', isLoggedIn, (req, res) => {
  if (req.session.username !== 'admin') {
    return res.status(403).send('Unauthorized.');
  }

  res.json({ users, qrData });
});

// ✅ Delete a QR (admin only)
app.post('/admin/delete-qr', isLoggedIn, (req, res) => {
  if (req.session.username !== 'admin') return res.status(403).send('Unauthorized');

  const { username, index } = req.body;

  if (qrData[username] && qrData[username][index]) {
    qrData[username].splice(index, 1);
    return res.json({ success: true });
  }

  return res.json({ success: false });
});

// ✅ Delete a user (except admin)
app.post('/admin/delete-user', isLoggedIn, (req, res) => {
  if (req.session.username !== 'admin') return res.status(403).send('Unauthorized');

  const { username } = req.body;
  if (username === 'admin') return res.status(403).send('Cannot delete admin');

  const index = users.findIndex(u => u.username === username);
  if (index !== -1) users.splice(index, 1);
  delete qrData[username];

  return res.json({ success: true });
});

// ✅ Download all logs (admin)
app.get('/admin/download-logs', isLoggedIn, (req, res) => {
  if (req.session.username !== 'admin') return res.status(403).send('Unauthorized');

  const exportData = {
    users,
    qrData
  };

  res.setHeader('Content-Disposition', 'attachment; filename="qr-logs.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(exportData, null, 2));
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
