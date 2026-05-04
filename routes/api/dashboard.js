const router = require('express').Router();
const Project = require('../../models/Project');
const Experiment = require('../../models/Experiment');
const CalendarEvent = require('../../models/CalendarEvent');
const WorkPackage = require('../../models/WorkPackage');
const LabEntry = require('../../models/LabEntry');
const Equipment = require('../../models/Equipment');
const Material = require('../../models/Material');

router.get('/summary', (req, res, next) => {
  try {
    const projectId = req.query.project_id || null;
    const filters = projectId ? { project_id: projectId } : {};

    const expByStatus = Experiment.countByStatus(projectId);
    const allExperiments = Experiment.findAll(filters);
    const todayEvents = CalendarEvent.getToday(projectId);
    const upcomingEvents = CalendarEvent.getUpcoming(5, projectId);
    const wpProgress = WorkPackage.getOverallProgress(projectId);
    const wpAll = WorkPackage.findAll(filters);
    const recentEntries = LabEntry.getRecent(5, projectId);
    const equipStatus = Equipment.countByStatus(projectId);
    const lowStock = Material.getLowStock(projectId);
    const maintenanceDue = Equipment.getMaintenanceDue(projectId);

    // Projects overview
    const projects = Project.findAll();
    const projectsWithStats = projects.map(p => ({
      ...p,
      stats: Project.getStats(p.id)
    }));

    res.json({
      success: true,
      data: {
        projects: projectsWithStats,
        experiments: {
          total: allExperiments.length,
          byStatus: expByStatus,
          active: allExperiments.filter(e => e.status === 'in_progress').length
        },
        calendar: { today: todayEvents, upcoming: upcomingEvents },
        workPackages: {
          total: wpAll.length,
          overallProgress: wpProgress,
          totalBudget: WorkPackage.getTotalBudget(projectId),
          items: wpAll
        },
        recentActivity: recentEntries,
        equipment: { byStatus: equipStatus, maintenanceDue },
        materials: { lowStock, lowStockCount: lowStock.length }
      }
    });
  } catch (e) { next(e); }
});

module.exports = router;
