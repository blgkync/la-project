const router = require('express').Router();
const User = require('../models/User');
const { getDB } = require('../db/database');

router.get('/login', (req, res) => {
  if (req.session && req.session.user) return res.redirect('/');
  res.render('login', { error: null, success: null, mode: 'login' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render('login', { error: 'Kullanici adi ve sifre gerekli', success: null, mode: 'login' });
  }
  const user = await User.authenticate(username, password);
  if (!user) {
    return res.render('login', { error: 'Kullanici adi veya sifre hatali', success: null, mode: 'login' });
  }
  req.session.user = user;
  res.redirect('/');
});

router.get('/forgot-password', (req, res) => {
  if (req.session && req.session.user) return res.redirect('/');
  res.render('login', { error: null, success: null, mode: 'reset' });
});

router.post('/forgot-password', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.render('login', { error: 'Kullanici adi gerekli', success: null, mode: 'reset' });
  }
  const user = User.findByUsername(username);
  if (!user) {
    return res.render('login', { error: 'Bu kullanici adi bulunamadi', success: null, mode: 'reset' });
  }
  const db = getDB();
  db.prepare('INSERT INTO password_reset_requests (user_id, username) VALUES (?, ?)').run(user.id, username);
  res.render('login', { error: null, success: 'Sifre sifirlama talebiniz yoneticiye iletildi. Yonetici sifrenizi sifirladiktan sonra giris yapabilirsiniz.', mode: 'reset' });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
