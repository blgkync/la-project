const router = require('express').Router();
const Project = require('../../models/Project');
const Experiment = require('../../models/Experiment');
const WorkPackage = require('../../models/WorkPackage');
const CalendarEvent = require('../../models/CalendarEvent');
const LabEntry = require('../../models/LabEntry');
const { filterByProject } = require('../../middleware/auth');

router.get('/', (req, res, next) => {
  try {
    let data = Project.findAll(req.query);
    if (req.projectScope) {
      data = data.filter(p => req.projectScope.includes(p.id));
    }
    const enriched = data.map(p => ({
      ...p,
      stats: Project.getStats(p.id)
    }));
    res.json({ success: true, data: enriched, count: enriched.length });
  } catch (e) { next(e); }
});

router.get('/active', (req, res, next) => {
  try {
    let data = Project.getActiveProjects();
    if (req.projectScope) {
      data = data.filter(p => req.projectScope.includes(p.id));
    }
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/stats', (req, res, next) => {
  try {
    const byType = Project.countByType();
    const byStatus = Project.countByStatus();
    let all = Project.findAll();
    if (req.projectScope) {
      all = all.filter(p => req.projectScope.includes(p.id));
    }
    const totalBudget = all.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = all.reduce((sum, p) => sum + (p.spent || 0), 0);
    res.json({ success: true, data: { byType, byStatus, totalBudget, totalSpent, totalProjects: all.length } });
  } catch (e) { next(e); }
});

router.get('/:id', (req, res, next) => {
  try {
    const data = Project.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Proje bulunamadi' });
    if (req.projectScope && !req.projectScope.includes(data.id)) {
      return res.status(403).json({ success: false, message: 'Bu projeye erisim yetkiniz yok' });
    }
    const stats = Project.getStats(data.id);
    const experiments = Experiment.findAll({ project_id: data.id });
    const workPackages = WorkPackage.findAll({ project_id: data.id });
    const recentEntries = LabEntry.getRecent(5, data.id);
    const upcomingEvents = CalendarEvent.getUpcoming(5, data.id);
    res.json({ success: true, data: { ...data, stats, experiments, workPackages, recentEntries, upcomingEvents } });
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    if (!req.body.name || !req.body.code) return res.status(400).json({ success: false, message: 'Proje adi ve kodu zorunludur' });
    const existing = Project.findByCode(req.body.code);
    if (existing) return res.status(400).json({ success: false, message: 'Bu proje kodu zaten kullaniliyor' });
    const data = Project.create(req.body);
    const ProjectAssignment = require('../../models/ProjectAssignment');
    ProjectAssignment.assign(req.session.user.id, data.id);
    res.status(201).json({ success: true, data, message: 'Proje olusturuldu' });
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = Project.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Proje bulunamadi' });
    if (req.projectScope && !req.projectScope.includes(existing.id)) {
      return res.status(403).json({ success: false, message: 'Bu projeye erisim yetkiniz yok' });
    }
    const data = Project.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Proje guncellendi' });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = Project.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Proje bulunamadi' });
    if (req.projectScope && !req.projectScope.includes(existing.id)) {
      return res.status(403).json({ success: false, message: 'Bu projeye erisim yetkiniz yok' });
    }
    Project.delete(req.params.id);
    res.json({ success: true, message: 'Proje silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
