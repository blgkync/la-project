const router = require('express').Router();
const User = require('../../models/User');
const ProjectAssignment = require('../../models/ProjectAssignment');
const { getDB } = require('../../db/database');
const { requireAdmin } = require('../../middleware/auth');

router.get('/', requireAdmin, (req, res, next) => {
  try {
    const users = User.findAll();
    const enriched = users.map(u => ({
      ...u,
      projects: ProjectAssignment.getByUser(u.id)
    }));
    res.json({ success: true, data: enriched });
  } catch (e) { next(e); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { username, password, display_name, role } = req.body;
    if (!username || !password || !display_name) {
      return res.status(400).json({ success: false, message: 'Tum alanlar zorunludur' });
    }
    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Sifre en az 4 karakter olmalidir' });
    }
    const existing = User.findByUsername(username);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bu kullanici adi zaten kullaniliyor' });
    }
    await User.create({ username, password, display_name, role: role || 'user' });
    res.status(201).json({ success: true, message: 'Kullanici olusturuldu' });
  } catch (e) { next(e); }
});

router.delete('/:id', requireAdmin, (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const user = User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Kullanici bulunamadi' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Admin kullanici silinemez' });
    getDB().prepare('DELETE FROM project_assignments WHERE user_id = ?').run(userId);
    getDB().prepare('DELETE FROM password_reset_requests WHERE user_id = ?').run(userId);
    getDB().prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ success: true, message: 'Kullanici silindi' });
  } catch (e) { next(e); }
});

router.post('/:id/reset-password', requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { password } = req.body;
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: 'Sifre en az 4 karakter olmalidir' });
    }
    const user = User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Kullanici bulunamadi' });
    await User.changePassword(userId, password);
    res.json({ success: true, message: 'Sifre sifirlandi' });
  } catch (e) { next(e); }
});

// Password reset requests
router.get('/reset-requests', requireAdmin, (req, res, next) => {
  try {
    const data = getDB().prepare("SELECT * FROM password_reset_requests WHERE status = 'pending' ORDER BY created_at DESC").all();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/reset-requests/:id/done', requireAdmin, (req, res, next) => {
  try {
    getDB().prepare("UPDATE password_reset_requests SET status = 'done' WHERE id = ?").run(parseInt(req.params.id));
    res.json({ success: true });
  } catch (e) { next(e); }
});

// Project assignments
router.get('/:id/projects', requireAdmin, (req, res, next) => {
  try {
    const data = ProjectAssignment.getByUser(parseInt(req.params.id));
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/:id/projects', requireAdmin, (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const projectId = parseInt(req.body.project_id);
    if (!projectId) return res.status(400).json({ success: false, message: 'Proje ID zorunludur' });
    ProjectAssignment.assign(userId, projectId);
    const data = ProjectAssignment.getByUser(userId);
    res.json({ success: true, data, message: 'Proje atandi' });
  } catch (e) { next(e); }
});

router.delete('/:id/projects/:projectId', requireAdmin, (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const projectId = parseInt(req.params.projectId);
    ProjectAssignment.unassign(userId, projectId);
    const data = ProjectAssignment.getByUser(userId);
    res.json({ success: true, data, message: 'Proje atamasi kaldirildi' });
  } catch (e) { next(e); }
});

module.exports = router;
