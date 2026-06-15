import { Router } from 'express';
import {
  createTeam, getTeams, getTeam, joinTeamByCode,
  createProject, getProjects,
  createTask, getTasks, updateTask, deleteTask
} from '../controllers/team.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Teams
router.post('/teams', createTeam);
router.get('/teams', getTeams);
router.get('/teams/:id', getTeam);
router.post('/teams/join', joinTeamByCode);

// Projects
router.post('/projects', createProject);
router.get('/projects', getProjects);

// Tasks
router.post('/tasks', createTask);
router.get('/tasks', getTasks);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

export default router;
