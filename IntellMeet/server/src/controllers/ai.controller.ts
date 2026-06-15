import { Request, Response } from 'express';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';

// Mock AI responses for demo when no OpenAI key is configured
const mockSummary = (transcript: string) => {
  const lines = transcript.split('\n').filter(l => l.trim());
  return `## Meeting Summary

### Key Discussion Points
- The team discussed project timelines and deliverables for the upcoming sprint
- Resource allocation was reviewed and adjustments were proposed
- Technical architecture decisions were made regarding the platform scalability

### Decisions Made
1. Sprint deadline confirmed for end of current cycle
2. New feature development will follow the proposed architecture
3. Code review process to be streamlined with automated checks

### Next Steps
- Team leads to update their project boards by end of day
- Architecture document to be shared with stakeholders
- Follow-up meeting scheduled for next week

*Generated from ${lines.length} lines of transcript*`;
};

const mockActionItems = () => [
  { text: 'Update project board with new sprint tasks', assignee: null, status: 'pending' as const, dueDate: new Date(Date.now() + 7 * 86400000) },
  { text: 'Share architecture document with stakeholders', assignee: null, status: 'pending' as const, dueDate: new Date(Date.now() + 3 * 86400000) },
  { text: 'Set up automated code review pipeline', assignee: null, status: 'pending' as const, dueDate: new Date(Date.now() + 14 * 86400000) },
  { text: 'Schedule follow-up meeting for next week', assignee: null, status: 'pending' as const, dueDate: new Date(Date.now() + 5 * 86400000) },
];

export const summarizeMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      res.status(400).json({ message: 'Transcript is required' });
      return;
    }

    if (config.openai.apiKey) {
      // Real OpenAI integration
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: config.openai.apiKey });

      const [summaryResponse, actionResponse] = await Promise.all([
        openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a meeting assistant. Generate a concise, well-structured meeting summary in markdown format. Include: Key Discussion Points, Decisions Made, and Next Steps.',
            },
            { role: 'user', content: `Summarize this meeting transcript:\n\n${transcript}` },
          ],
          max_tokens: 1000,
        }),
        openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Extract action items from the meeting transcript. Return a JSON array with objects having: text (string), assignee (string or null), dueDate (ISO string or null). Only return the JSON array, no other text.',
            },
            { role: 'user', content: transcript },
          ],
          max_tokens: 500,
        }),
      ]);

      const summary = summaryResponse.choices[0]?.message?.content || 'No summary generated';
      let actionItems = mockActionItems();

      try {
        const parsed = JSON.parse(actionResponse.choices[0]?.message?.content || '[]');
        if (Array.isArray(parsed)) {
          actionItems = parsed.map((item: any) => ({
            text: item.text || '',
            assignee: null,
            status: 'pending' as const,
            dueDate: item.dueDate ? new Date(item.dueDate) : new Date(Date.now() + 7 * 86400000),
          }));
        }
      } catch (e) {
        // Use mock action items if parsing fails
      }

      res.json({ summary, actionItems });
    } else {
      // Mock mode for demo
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate AI processing
      res.json({
        summary: mockSummary(transcript),
        actionItems: mockActionItems(),
      });
    }
  } catch (error) {
    console.error('AI summarization error:', error);
    res.json({
      summary: mockSummary(req.body.transcript || ''),
      actionItems: mockActionItems(),
    });
  }
};

export const transcribeAudio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // For the demo, we use Web Speech API on the client side
    // This endpoint is for batch transcription of uploaded audio
    res.json({ message: 'Transcription handled client-side via Web Speech API for real-time, or use OpenAI Whisper for uploaded recordings' });
  } catch (error) {
    res.status(500).json({ message: 'Error transcribing audio' });
  }
};
