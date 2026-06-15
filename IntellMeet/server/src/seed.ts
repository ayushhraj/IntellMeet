import mongoose from 'mongoose';
import { config } from './config';
import { User } from './models/User';
import { Meeting } from './models/Meeting';
import { Team } from './models/Team';
import { Project, Task } from './models/Project';
import { Message } from './models/Message';
import { generateRoomId, generateInviteCode } from './utils/helpers';

const seed = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Meeting.deleteMany({}),
      Team.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Message.deleteMany({}),
    ]);

    // Create demo users
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@intellmeet.com',
      password: 'Demo@123',
      avatar: '',
      role: 'admin',
    });

    const alice = await User.create({
      name: 'Alice Johnson',
      email: 'alice@intellmeet.com',
      password: 'Demo@123',
      role: 'member',
    });

    const bob = await User.create({
      name: 'Bob Williams',
      email: 'bob@intellmeet.com',
      password: 'Demo@123',
      role: 'member',
    });

    const carol = await User.create({
      name: 'Carol Davis',
      email: 'carol@intellmeet.com',
      password: 'Demo@123',
      role: 'member',
    });

    console.log('✅ Users created');

    // Create a team
    const team = await Team.create({
      name: 'IntellMeet Core Team',
      description: 'The core product development team',
      owner: demoUser._id,
      inviteCode: generateInviteCode(),
      members: [
        { user: demoUser._id, role: 'owner' },
        { user: alice._id, role: 'admin' },
        { user: bob._id, role: 'member' },
        { user: carol._id, role: 'member' },
      ],
    });

    // Update user team refs
    await User.updateMany(
      { _id: { $in: [demoUser._id, alice._id, bob._id, carol._id] } },
      { $push: { teams: team._id } }
    );

    console.log('✅ Team created');

    // Create a project
    const project = await Project.create({
      name: 'Platform Launch v2.0',
      description: 'Major platform update with AI features',
      teamId: team._id,
      owner: demoUser._id,
      color: '#6366f1',
    });

    // Create tasks
    const taskData = [
      { title: 'Design new dashboard layout', status: 'done', priority: 'high', assignee: alice._id, order: 1 },
      { title: 'Implement WebRTC video grid', status: 'done', priority: 'urgent', assignee: bob._id, order: 2 },
      { title: 'Build AI summarization pipeline', status: 'in-progress', priority: 'high', assignee: demoUser._id, order: 3 },
      { title: 'Add real-time chat with Socket.io', status: 'in-progress', priority: 'medium', assignee: carol._id, order: 4 },
      { title: 'Create analytics dashboard', status: 'todo', priority: 'medium', assignee: alice._id, order: 5 },
      { title: 'Set up CI/CD pipeline', status: 'review', priority: 'low', assignee: bob._id, order: 6 },
      { title: 'Write API documentation', status: 'todo', priority: 'low', assignee: carol._id, order: 7 },
      { title: 'Performance optimization audit', status: 'todo', priority: 'high', assignee: demoUser._id, order: 8 },
    ];

    for (const t of taskData) {
      await Task.create({
        ...t,
        projectId: project._id,
        reporter: demoUser._id,
        dueDate: new Date(Date.now() + Math.random() * 14 * 86400000),
      });
    }

    console.log('✅ Project & tasks created');

    // Create past meetings
    const meetingData = [
      {
        title: 'Sprint Planning - Week 24',
        description: 'Plan sprint tasks and assign priorities',
        daysAgo: 1,
        duration: 45,
        status: 'ended' as const,
        summary: '## Sprint Planning Summary\n\n### Key Points\n- Reviewed backlog and prioritized 12 items\n- AI summarization feature is top priority\n- Video grid optimization needed before launch\n\n### Decisions\n1. Move launch date to next Friday\n2. Allocate 2 developers to AI features\n3. Schedule daily standups at 10 AM',
      },
      {
        title: 'Design Review - Dashboard v2',
        description: 'Review new dashboard mockups',
        daysAgo: 3,
        duration: 30,
        status: 'ended' as const,
        summary: '## Design Review Summary\n\n### Feedback\n- Dashboard layout approved with minor tweaks\n- Color scheme updated to match brand guidelines\n- Mobile responsive design needs work\n\n### Action Items\n1. Update color palette\n2. Fix mobile nav\n3. Add loading skeletons',
      },
      {
        title: 'Architecture Discussion',
        description: 'Discuss WebRTC and Socket.io architecture',
        daysAgo: 5,
        duration: 60,
        status: 'ended' as const,
        summary: '## Architecture Discussion\n\n### Topics\n- WebRTC mesh vs SFU for video calls\n- Socket.io namespace organization\n- Redis pub/sub for scaling\n\n### Decisions\n- Use mesh for MVP (up to 6 participants)\n- Plan SFU migration for v2.1\n- Implement Redis for session management',
      },
      {
        title: 'Weekly Team Standup',
        description: 'Regular weekly sync',
        daysAgo: 7,
        duration: 20,
        status: 'ended' as const,
        summary: '## Weekly Standup\n\n### Updates\n- Frontend: Dashboard 80% complete\n- Backend: API endpoints ready\n- DevOps: Docker setup complete\n\n### Blockers\n- Need API keys for AI integration\n- Waiting for design assets',
      },
      {
        title: 'Product Roadmap Review',
        description: 'Q3 roadmap planning',
        daysAgo: 10,
        duration: 55,
        status: 'ended' as const,
        summary: '## Roadmap Review\n\n### Q3 Goals\n1. Launch IntellMeet v2.0\n2. Reach 1000 active users\n3. Implement enterprise SSO\n4. Add meeting recording storage',
      },
      {
        title: 'Client Demo Preparation',
        description: 'Prepare demo for stakeholders',
        daysAgo: 0,
        duration: 0,
        status: 'scheduled' as const,
        summary: '',
      },
    ];

    for (const m of meetingData) {
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() - m.daysAgo);
      if (m.status === 'scheduled') {
        scheduledAt.setDate(scheduledAt.getDate() + 2);
        scheduledAt.setHours(14, 0, 0, 0);
      }

      const meeting = await Meeting.create({
        title: m.title,
        description: m.description,
        host: demoUser._id,
        roomId: generateRoomId(),
        status: m.status,
        scheduledAt,
        startedAt: m.status === 'ended' ? scheduledAt : undefined,
        endedAt: m.status === 'ended' ? new Date(scheduledAt.getTime() + m.duration * 60000) : undefined,
        duration: m.duration || undefined,
        summary: m.summary,
        transcript: m.summary ? `Transcript of "${m.title}" meeting with ${2 + Math.floor(Math.random() * 3)} participants discussing key topics...` : '',
        participants: [
          { user: demoUser._id, role: 'host' as const, joinedAt: scheduledAt },
          { user: alice._id, role: 'participant' as const, joinedAt: scheduledAt },
          { user: bob._id, role: 'participant' as const, joinedAt: scheduledAt },
        ],
        actionItems: m.summary
          ? [
              { text: `Review ${m.title} follow-ups`, assignee: alice._id, status: Math.random() > 0.5 ? 'completed' as const : 'pending' as const },
              { text: `Prepare materials for next session`, assignee: bob._id, status: 'pending' as const },
            ]
          : [],
      });
    }

    console.log('✅ Meetings created');
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📧 Demo Login Credentials:');
    console.log('   Email: demo@intellmeet.com');
    console.log('   Password: Demo@123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
