const router = require('express').Router();
const Project = require('../../models/Project');
const Experiment = require('../../models/Experiment');
const CalendarEvent = require('../../models/CalendarEvent');
const WorkPackage = require('../../models/WorkPackage');
const LabEntry = require('../../models/LabEntry');
const Equipment = require('../../models/Equipment');
const Material = require('../../models/Material');
const { filterByProject } = require('../../middleware/auth');

router.get('/summary', (req, res, next) => {
  try {
    const projectId = req.query.project_id || null;
    const filters = projectId ? { project_id: projectId } : {};

    const expByStatus = Experiment.countByStatus(projectId);
    let allExperiments = Experiment.findAll(filters);
    allExperiments = filterByProject(allExperiments, req.projectScope);
    let todayEvents = CalendarEvent.getToday(projectId);
    todayEvents = filterByProject(todayEvents, req.projectScope);
    let upcomingEvents = CalendarEvent.getUpcoming(5, projectId);
    upcomingEvents = filterByProject(upcomingEvents, req.projectScope);
    const wpProgress = WorkPackage.getOverallProgress(projectId);
    let wpAll = WorkPackage.findAll(filters);
    wpAll = filterByProject(wpAll, req.projectScope);
    let recentEntries = LabEntry.getRecent(5, projectId);
    recentEntries = filterByProject(recentEntries, req.projectScope);
    const equipStatus = Equipment.countByStatus(projectId);
    let lowStock = Material.getLowStock(projectId || null);
    lowStock = filterByProject(lowStock, req.projectScope);
    const maintenanceDue = Equipment.getMaintenanceDue(projectId);

    let projects = Project.findAll();
    if (req.projectScope) {
      projects = projects.filter(p => req.projectScope.includes(p.id));
    }
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
