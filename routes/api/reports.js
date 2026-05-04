const router = require('express').Router();
const Experiment = require('../../models/Experiment');
const WorkPackage = require('../../models/WorkPackage');
const LabEntry = require('../../models/LabEntry');
const CalendarEvent = require('../../models/CalendarEvent');
const Equipment = require('../../models/Equipment');
const Material = require('../../models/Material');
const { filterByProject } = require('../../middleware/auth');

router.get('/generate', (req, res, next) => {
  try {
    const { start_date, end_date, project_id } = req.query;
    const filters = {};
    if (project_id) filters.project_id = project_id;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    let experiments = Experiment.findAll(filters);
    experiments = filterByProject(experiments, req.projectScope);
    let workPackages = WorkPackage.findAll(project_id ? { project_id } : {});
    workPackages = filterByProject(workPackages, req.projectScope);
    let entries = LabEntry.findAll(filters);
    entries = filterByProject(entries, req.projectScope);

    const calFilters = {};
    if (project_id) calFilters.project_id = project_id;
    if (start_date) calFilters.start = start_date;
    if (end_date) calFilters.end = end_date;
    let events = CalendarEvent.findAll(calFilters);
    events = filterByProject(events, req.projectScope);

    const eqFilters = project_id ? { project_id } : {};
    let equipmentAll = Equipment.findAll(eqFilters);
    equipmentAll = filterByProject(equipmentAll, req.projectScope);
    let lowStock = Material.getLowStock(project_id || null);
    lowStock = filterByProject(lowStock, req.projectScope);

    const expByStatus = {};
    experiments.forEach(e => { expByStatus[e.status] = (expByStatus[e.status] || 0) + 1; });

    const expByPriority = {};
    experiments.forEach(e => { expByPriority[e.priority] = (expByPriority[e.priority] || 0) + 1; });

    const eventsByType = {};
    events.forEach(e => { eventsByType[e.event_type] = (eventsByType[e.event_type] || 0) + 1; });

    const entriesByCategory = {};
    entries.forEach(e => { entriesByCategory[e.category] = (entriesByCategory[e.category] || 0) + 1; });

    res.json({
      success: true,
      data: {
        period: { start_date: start_date || 'tumu', end_date: end_date || 'tumu' },
        experiments: { total: experiments.length, byStatus: expByStatus, byPriority: expByPriority, items: experiments },
        workPackages: {
          total: workPackages.length,
          overallProgress: WorkPackage.getOverallProgress(project_id || null),
          totalBudget: WorkPackage.getTotalBudget(project_id || null),
          items: workPackages
        },
        labEntries: { total: entries.length, byCategory: entriesByCategory },
        events: { total: events.length, byType: eventsByType },
        equipment: { total: equipmentAll.length, byStatus: Equipment.countByStatus(project_id || null) },
        materials: { lowStock: lowStock.length, lowStockItems: lowStock }
      }
    });
  } catch (e) { next(e); }
});

module.exports = router;
