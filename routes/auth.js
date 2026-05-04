const router = require('express').Router();
const User = require('../models/User');

router.get('/login', (req, res) => {
  if (req.session && req.session.user) return res.redirect('/');
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render('login', { error: 'Kullanici adi ve sifre gerekli' });
  }
  const user = await User.authenticate(username, password);
  if (!user) {
    return res.render('login', { error: 'Kullanici adi veya sifre hatali' });
  }
  req.session.user = user;
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
