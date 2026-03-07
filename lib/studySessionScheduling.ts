import type { CalendarEvent } from '@/lib/googleCalendar';

export interface StudySession {
    id: string;
    assignment: string;
    course: string;
    suggestedTime: string;
    duration: string;
    date: string;
    score: number;
    priority: 'high' | 'medium' | 'low';

}

//funct ion to help compare study sessions for sort
function compare_study_sessions(a : StudySession, b : StudySession){
    if(Number.isNaN(a.score) && Number.isNaN(b.score)) return 0;
    if(Number.isNaN(a.score)) return 1;
    if(Number.isNaN(b.score)) return -1;
    if(a.score >= 0 && b.score < 0) return -1;
    if(a.score < 0 && b.score >= 0) return 1;
    if(a.score < b.score) return -1;
    if(a.score > b.score) return 1;
    return 0;
}

function priority_score(event : CalendarEvent){
    /*
    in:
        -event: object conforming to CalendarEvent interface
    out:
        -score: score assigned to the input event; higher score = lower priority
    */

    const TIME_MULTIPLICATIVE_WEIGHT : number = 10; //per hour
    const NOT_EXAM_ADDITIVE_WEIGHT : number = TIME_MULTIPLICATIVE_WEIGHT * 2.1 * 24; //proritize exam if 2 there's one two days after another event
    let score = NOT_EXAM_ADDITIVE_WEIGHT;

    //regexp to validate date formatting
    const date_pattern_1 : RegExp = new RegExp("[0-9]{4}-[0-9]{2}-[0-9]{2}") //YYYY-..-..
    const date_pattern_2 : RegExp = new RegExp("[0-9]{2}-[0-9]{2}-[0-9]{4}") //..-..-YYYY
    const date_pattern_3 : RegExp = new RegExp("[0-9]{4}/[0-9]{2}/[0-9]{2}") //YYYY/../..
    const date_pattern_4 : RegExp = new RegExp("[0-9]{2}/[0-9]{2}/[0-9]{4}") //../../YYYY
    let start : Date | undefined;
    let end : Date | undefined;
    if(event.start !== undefined){
        const start_valid = date_pattern_1.test(event.start) || date_pattern_2.test(event.start) || date_pattern_3.test(event.start) || date_pattern_4.test(event.start);
        if(start_valid) start = new Date(event.start);
        else return NaN;
    }
    else return NaN;

    //*note: end is pretty much never defined; probably will not use; not currently using
        if(event.end !== undefined){
            const end_valid = date_pattern_1.test(event.end) || date_pattern_2.test(event.end) || date_pattern_3.test(event.end) || date_pattern_4.test(event.end);
            if(end_valid) end = new Date(event.end);
        }
        // if(end.getTime() < start.getTime()){
        //   throw new Error("End time before start");
        // }
    
    const time_until_start : number = (start.getTime() - (new Date()).getTime()) / 1000 / 60 / 60; //ms -> hours
    if(time_until_start < 0){
        return NaN
    }
    score += time_until_start * TIME_MULTIPLICATIVE_WEIGHT
    const split_title : Array<string> = event.title.trim().split(" ")
    for(let a = 0; a < split_title.length; a++){
        split_title[a] = split_title[a].trim().toLowerCase();
    }
    const EXAM_KEYWORDS : Set<string> = new Set<string>(["final", "midterm", "exam", "test", "project"])
    for(const word of split_title){
        if(EXAM_KEYWORDS.has(word)){
            score -= NOT_EXAM_ADDITIVE_WEIGHT
            break;
        }
    }
    return score;
}

export function schedule_sessions(events : CalendarEvent[]){
    /*
    in:
        -events: list of objects conforming to CalendarEvent interface
    out:
        -study_sessions: list of objects conforming to StudySession interface in decreasing order of priority
    
    behavior:
        -filter out events that don't need study sessions
        -creates study sessions for each event, one sessions for each event, then two, etc until desired num reached or available time is all occupied (in that case, higher priority study sessions will be preserved over lower priority ones)
        -study session durations will be streched/squashed to min/max to fit in other sessions. If all events reach compress limit, lower priority events will be purged
    */
    const HIGH_PRIORITY_THRESHOLD = 480;//~2 days
    const MEDIUM_PRIORITY_THRESHOLD = 1680;//~ 1 week

    const MAX_STUDY_SESSION_DURATION = 0;
    const MIN_STUDY_SESSION_DURATION = 0;

    const DESIRED_NUM_STUDY_SESSIONS = 0;

    const ASSUMED_LECTURE_DURATION = 0;
    const ASSUMED_SECTION_DURATION = 0;
    const ASSUMED_MISC_DURATION = 0;

    const studySessions : StudySession[] = [];
    for(let a=0; a<events.length; a++){
        const event = events[a];
        const score = priority_score(event);
        if(score >= 0 && !Number.isNaN(score) ){
        studySessions.push(
            {
            id: String(a),
            assignment: event.title,
            course: 'course', 
            suggestedTime: 'time', 
            duration: 'duration', 
            date: Number.isNaN(score) ? 'none' : event.start,
            score: score,
            priority: 'high'
            }
        );
        }
    }
    studySessions.sort(compare_study_sessions);

    for(const studySession of studySessions){
        if(Number.isNaN(studySession.score) || studySession.score < 0){
            studySession.priority = 'low';
            continue;
        }
        if(studySession.score < HIGH_PRIORITY_THRESHOLD){
            studySession.priority = 'high';
            continue;
        }
        if(studySession.score < MEDIUM_PRIORITY_THRESHOLD){
            studySession.priority = 'medium';
            continue;
        }
        studySession.priority = 'low';
    }
    return studySessions;

    //todo take the master list of events, filter out stuff that will not need study session, priority score the rest, then create study sessions for them in places that don't
}