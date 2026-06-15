import { Request, Response } from 'express';
import { Meeting } from '../models/Meeting';
import { AuthRequest } from '../middleware/auth';
import { generateRoomId } from '../utils/helpers';

export const createMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, scheduledAt, settings, teamId } = req.body;

    const meeting = await Meeting.create({
      title: title || 'Untitled Meeting',
      description,
      host: req.user!._id,
      roomId: generateRoomId(),
      scheduledAt: scheduledAt || new Date(),
      settings,
      teamId,
      participants: [{ user: req.user!._id, role: 'host', joinedAt: new Date() }],
    });

    res.status(201).json({ meeting });
  } catch (error) {
    res.status(500).json({ message: 'Error creating meeting' });
  }
};

export const getMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query: any = {
      $or: [
        { host: req.user!._id },
        { 'participants.user': req.user!._id },
      ],
    };

    if (status) query.status = status;
    if (search) {
      query.$and = [{ $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]}];
    }

    const meetings = await Meeting.find(query)
      .populate('host', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .sort({ scheduledAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Meeting.countDocuments(query);

    res.json({ meetings, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meetings' });
  }
};

export const getMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('host', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .populate('actionItems.assignee', 'name email avatar');

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    res.json({ meeting });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meeting' });
  }
};

export const getMeetingByRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let meeting = await Meeting.findOne({ roomId: req.params.roomId })
      .populate('host', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    res.json({ meeting });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meeting' });
  }
};

export const joinMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId });

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    const alreadyJoined = meeting.participants.some(
      (p) => p.user.toString() === req.user!._id.toString()
    );

    if (!alreadyJoined) {
      meeting.participants.push({
        user: req.user!._id,
        role: 'participant',
        joinedAt: new Date(),
      });
    }

    if (meeting.status === 'scheduled') {
      meeting.status = 'active';
      meeting.startedAt = new Date();
    }

    await meeting.save();

    const populated = await Meeting.findById(meeting._id)
      .populate('host', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    res.json({ meeting: populated });
  } catch (error) {
    res.status(500).json({ message: 'Error joining meeting' });
  }
};

export const endMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    meeting.status = 'ended';
    meeting.endedAt = new Date();
    if (meeting.startedAt) {
      meeting.duration = Math.round((meeting.endedAt.getTime() - meeting.startedAt.getTime()) / 60000);
    }

    await meeting.save();
    res.json({ meeting });
  } catch (error) {
    res.status(500).json({ message: 'Error ending meeting' });
  }
};

export const updateMeetingSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { transcript, summary, actionItems } = req.body;
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      {
        ...(transcript && { transcript }),
        ...(summary && { summary }),
        ...(actionItems && { actionItems }),
      },
      { new: true }
    );
    res.json({ meeting });
  } catch (error) {
    res.status(500).json({ message: 'Error updating meeting' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const totalMeetings = await Meeting.countDocuments({
      $or: [{ host: userId }, { 'participants.user': userId }],
    });

    const activeMeetings = await Meeting.countDocuments({
      $or: [{ host: userId }, { 'participants.user': userId }],
      status: 'active',
    });

    const completedMeetings = await Meeting.countDocuments({
      $or: [{ host: userId }, { 'participants.user': userId }],
      status: 'ended',
    });

    const recentMeetings = await Meeting.find({
      $or: [{ host: userId }, { 'participants.user': userId }],
    })
      .populate('host', 'name email avatar')
      .sort({ updatedAt: -1 })
      .limit(5);

    const upcomingMeetings = await Meeting.find({
      $or: [{ host: userId }, { 'participants.user': userId }],
      status: 'scheduled',
      scheduledAt: { $gte: new Date() },
    })
      .populate('host', 'name email avatar')
      .sort({ scheduledAt: 1 })
      .limit(5);

    // Calculate total meeting hours
    const meetings = await Meeting.find({
      $or: [{ host: userId }, { 'participants.user': userId }],
      status: 'ended',
      duration: { $exists: true },
    });
    const totalHours = Math.round(meetings.reduce((acc, m) => acc + (m.duration || 0), 0) / 60 * 10) / 10;

    // Pending action items
    const meetingsWithActions = await Meeting.find({
      $or: [{ host: userId }, { 'participants.user': userId }],
      'actionItems.0': { $exists: true },
    });
    let pendingActions = 0;
    meetingsWithActions.forEach((m) => {
      pendingActions += m.actionItems.filter((a) => a.status === 'pending').length;
    });

    res.json({
      stats: {
        totalMeetings,
        activeMeetings,
        completedMeetings,
        totalHours,
        pendingActions,
      },
      recentMeetings,
      upcomingMeetings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};
