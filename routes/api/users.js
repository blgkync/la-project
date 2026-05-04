const router = require('express').Router();
const User = require('../../models/User');
const ProjectAssignment = require('../../models/ProjectAssignment');
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
