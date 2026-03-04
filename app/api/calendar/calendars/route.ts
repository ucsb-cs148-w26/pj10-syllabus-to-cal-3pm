import  { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { access } from 'fs';

export async function GET(req: NextRequest) {
    const accessToken = req.headers.get('authorization')?.replace('Bearer', '');

    if (!accessToken) {
        return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }

    try {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.calendarList.list({
            minAccessRole: 'writer',
        });

        const calendars = (response.data.items ?? []).map((cal) => ({
            id: cal.id!,
            summary: cal.summary ?? 'Unnamed Calendar',
            primary: cal.primary ?? false,
            backgroundColor: cal.backgroundColor ?? '#4285f4',
        }));

        return NextResponse.json({ calendars });
    } catch (error: any) {
        console.error('[calendar/calendars] Error fetching calendars:', error);
        const status = error?.code === 401 ? 401 : 500;
        return NextResponse.json(
            { error: error?.message ?? 'Failed to fetch calendars' },
            { status },
        );
    }
}

export async function POST(req: NextRequest) {
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!accessToken) {
        return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { summary, description } = body;

        if (!summary) {
            return NextResponse.json(
                { error: 'Calendar name (summary) is required' },
                { status: 400 }
            );
        }

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.calendars.insert({
            requestBody: {
                summary: summary.trim(),
                description: description?.trim() || undefined,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        });

        const newCalendar = {
            id: response.data.id!,
            summary: response.data.summary ?? 'Unnamed Calendar',
            primary: false,
            // backgroundColor: response.data.backgroundColor ?? '#4285f4',
        };

        return NextResponse.json({ calendar: newCalendar }, { status: 201 });
    } catch (error: any) {
        console.error('[calendar/calendars POST] Error creating calendar:', error);
        const status = error?.code === 401 ? 401 : 500;
        return NextResponse.json(
            { error: error?.message ?? 'Failed to create calendar' },
            { status },
        );
    }
}