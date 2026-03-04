import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractEvents, type TextBlock } from '@/lib/extractEvents';
import type { CalendarEvent } from '@/types/events';

/**
 * POST /api/parse-text
 * 
 * Parse a text file (like syllabus.txt) and extract calendar events
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;

    let textContent = '';

    if (file) {
      textContent = await file.text();
    } else if (text) {
      textContent = text;
    } else {
      // Try to read from generator/syllabus.txt for testing
      try {
        const syllabusPath = join(process.cwd(), 'generator', 'syllabus.txt');
        textContent = readFileSync(syllabusPath, 'utf-8');
      } catch (err) {
        return NextResponse.json(
          {
            success: false,
            error: 'No file or text provided, and could not find generator/syllabus.txt',
          },
          { status: 400 }
        );
      }
    }

    // Convert to TextBlock format
    const blocks: TextBlock[] = [
      { text: textContent, page: 1 }
    ];

    // Extract events
    const eventCandidates = extractEvents(blocks);

    // Convert EventCandidate to CalendarEvent format
    const calendarEvents: CalendarEvent[] = eventCandidates.map(candidate => ({
      title: candidate.title,
      start: candidate.start,
      allDay: candidate.allDay,
      description: candidate.description,
      location: undefined,
    }));

    return NextResponse.json({
      success: true,
      events: calendarEvents,
      count: calendarEvents.length,
    });
  } catch (error: any) {
    console.error('Error parsing text:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse text',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/parse-text
 * 
 * Parse generator/syllabus.txt for testing
 */
export async function GET(request: NextRequest) {
  try {
    const syllabusPath = join(process.cwd(), '..', '..', 'generator', 'syllabus.txt');
    const textContent = readFileSync(syllabusPath, 'utf-8');

    const blocks: TextBlock[] = [
      { text: textContent, page: 1 }
    ];

    const eventCandidates = extractEvents(blocks);

    const calendarEvents: CalendarEvent[] = eventCandidates.map(candidate => ({
      title: candidate.title,
      start: candidate.start,
      allDay: candidate.allDay,
      description: candidate.description,
      location: undefined,
    }));

    return NextResponse.json({
      success: true,
      events: calendarEvents,
      count: calendarEvents.length,
    });
  } catch (error: any) {
    console.error('Error parsing syllabus.txt:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse syllabus.txt',
      },
      { status: 500 }
    );
  }
}
