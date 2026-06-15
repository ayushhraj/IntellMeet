import { Response } from 'express';
import { Meeting } from '../models/Meeting';
import { Task } from '../models/Project';
import { AuthRequest } from '../middleware/auth';

export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(period));

    // Meetings over time
    const meetings = await Meeting.find({
      $or: [{ host: userId }, { 'participants.user': userId }],
      createdAt: { $gte: daysAgo },
    }).sort({ createdAt: 1 });

    // Group meetings by day
    const meetingsByDay: Record<string, number> = {};
    const hoursByDay: Record<string, number> = {};
    meetings.forEach((m) => {
      const day = m.createdAt.toISOString().split('T')[0];
      meetingsByDay[day] = (meetingsByDay[day] || 0) + 1;
      hoursByDay[day] = (hoursByDay[day] || 0) + (m.duration || 30) / 60;
    });

    const meetingTrend = Object.entries(meetingsByDay).map(([date, count]) => ({
      date,
      meetings: count,
      hours: Math.round((hoursByDay[date] || 0) * 10) / 10,
    }));

    // Average meeting duration
    const endedMeetings = meetings.filter((m) => m.status === 'ended' && m.duration);
    const avgDuration = endedMeetings.length
      ? Math.round(endedMeetings.reduce((a, m) => a + (m.duration || 0), 0) / endedMeetings.length)
      : 0;

    // Participant counts
    const avgParticipants = meetings.length
      ? Math.round(meetings.reduce((a, m) => a + m.participants.length, 0) / meetings.length * 10) / 10
      : 0;

    // Action items stats
    let totalActionItems = 0;
    let completedActionItems = 0;
    meetings.forEach((m) => {
      totalActionItems += m.actionItems.length;
      completedActionItems += m.actionItems.filter((a) => a.status === 'completed').length;
    });
    const actionItemCompletion = totalActionItems ? Math.round((completedActionItems / totalActionItems) * 100) : 0;

    // Task stats
    const tasks = await Task.find({ reporter: userId });
    const tasksByStatus = {
      todo: tasks.filter((t) => t.status === 'todo').length,
      'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
      review: tasks.filter((t) => t.status === 'review').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };

    // Meeting status distribution
    const statusDistribution = {
      scheduled: meetings.filter((m) => m.status === 'scheduled').length,
      active: meetings.filter((m) => m.status === 'active').length,
      ended: meetings.filter((m) => m.status === 'ended').length,
      cancelled: meetings.filter((m) => m.status === 'cancelled').length,
    };

    res.json({
      analytics: {
        meetingTrend,
        avgDuration,
        avgParticipants,
        totalMeetings: meetings.length,
        actionItemCompletion,
        totalActionItems,
        completedActionItems,
        tasksByStatus,
        statusDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};
