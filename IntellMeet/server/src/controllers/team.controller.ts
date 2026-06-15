import { Response } from 'express';
import { Team } from '../models/Team';
import { Project, Task } from '../models/Project';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { generateInviteCode } from '../utils/helpers';

// ===== Team Controllers =====
export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const team = await Team.create({
      name,
      description,
      owner: req.user!._id,
      inviteCode: generateInviteCode(),
      members: [{ user: req.user!._id, role: 'owner' }],
    });

    await User.findByIdAndUpdate(req.user!._id, { $push: { teams: team._id } });

    const populated = await Team.findById(team._id).populate('members.user', 'name email avatar');
    res.status(201).json({ team: populated });
  } catch (error) {
    res.status(500).json({ message: 'Error creating team' });
  }
};

export const getTeams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teams = await Team.find({ 'members.user': req.user!._id })
      .populate('members.user', 'name email avatar')
      .populate('owner', 'name email avatar');
    res.json({ teams });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teams' });
  }
};

export const getTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate('owner', 'name email avatar');
    if (!team) { res.status(404).json({ message: 'Team not found' }); return; }
    res.json({ team });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team' });
  }
};

export const joinTeamByCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inviteCode } = req.body;
    const team = await Team.findOne({ inviteCode });
    if (!team) { res.status(404).json({ message: 'Invalid invite code' }); return; }

    const isMember = team.members.some((m) => m.user.toString() === req.user!._id.toString());
    if (isMember) { res.status(400).json({ message: 'Already a member' }); return; }

    team.members.push({ user: req.user!._id, role: 'member', joinedAt: new Date() });
    await team.save();
    await User.findByIdAndUpdate(req.user!._id, { $push: { teams: team._id } });

    const populated = await Team.findById(team._id).populate('members.user', 'name email avatar');
    res.json({ team: populated });
  } catch (error) {
    res.status(500).json({ message: 'Error joining team' });
  }
};

// ===== Project Controllers =====
export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, teamId, color } = req.body;
    const project = await Project.create({
      name, description, teamId, color, owner: req.user!._id,
    });
    res.status(201).json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Error creating project' });
  }
};

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.query;
    const query: any = {};
    if (teamId) query.teamId = teamId;

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects' });
  }
};

// ===== Task Controllers =====
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, projectId, assignee, priority, dueDate, tags } = req.body;
    const maxOrder = await Task.findOne({ projectId, status: 'todo' }).sort({ order: -1 });
    const task = await Task.create({
      title, description, projectId, assignee, priority, dueDate, tags,
      reporter: req.user!._id,
      order: (maxOrder?.order || 0) + 1,
    });
    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');
    res.status(201).json({ task: populated });
  } catch (error) {
    res.status(500).json({ message: 'Error creating task' });
  }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, status } = req.query;
    const query: any = {};
    if (projectId) query.projectId = projectId;
    if (status) query.status = status;

    const tasks = await Task.find(query)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .sort({ order: 1 });
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, status, priority, assignee, dueDate, order } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, status, priority, assignee, dueDate, order },
      { new: true, runValidators: true }
    )
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task' });
  }
};
