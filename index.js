const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const PORT = 3000;

// Temporary in-memory storage
const users = []; // { username, passwordHash }
const qrData = {}; // { username: [ { url, color, size, imageUrl } ] }

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: false,
}));

// Helper middleware
function isLoggedIn(req, res, next) {
  if (req.session.username) {
    return next();
  }
  res.redirect('/login.html');
}

// Routes
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

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

// Handle Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.send('Invalid credentials. <a href="/login.html">Try again</a>');
  }
  req.session.username = username;
  res.redirect('/dashboard.html');
});

// Handle Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// Generate QR Code (POST)
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

// Serve QR history for dashboard
app.get('/user/qrs', isLoggedIn, (req, res) => {
  const username = req.session.username;
  res.json(qrData[username] || []);
});

// Admin panel (hardcoded user)
app.get('/admin', isLoggedIn, (req, res) => {
  if (req.session.username !== 'admin') {
    return res.send('Unauthorized.');
  }

  res.json({
    users,
    qrData
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
