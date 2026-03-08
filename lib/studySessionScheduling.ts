import type { CalendarEvent } from '@/lib/googleCalendar';
import { convertServerPatchToFullTree } from 'next/dist/client/components/segment-cache/navigation';

export interface StudySession {
    id: string;
    assignment: string;
    course: string;
    suggestedTime: string;
    duration: string;
    date: string;
    score: number;
    priority: 'high' | 'medium' | 'low';
    type: 'assignment' | 'exam';
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

    const EXAM_OVER_NON_EXAM_DAYS : number = 6 //if there is an event that is x days away, an exam will be given the same priority as that event even if it is this many days after it.
    const TIME_MULTIPLICATIVE_WEIGHT : number = 10; //per hour
    const EXAM_SUBTRACTIVE_WEIGHT : number = TIME_MULTIPLICATIVE_WEIGHT * (EXAM_OVER_NON_EXAM_DAYS + 0.1) * 24; //proritize exam if there's one 7 days after another event
    let score = 0;

    //regexp to validate date formatting
    const date_pattern_dashes_year_first : RegExp = new RegExp("[0-9]{4}-[0-9]{2}-[0-9]{2}") //YYYY-..-..
    const date_pattern_dashes_year_last : RegExp = new RegExp("[0-9]{2}-[0-9]{2}-[0-9]{4}") //..-..-YYYY
    const date_pattern_slashes_year_first : RegExp = new RegExp("[0-9]{4}/[0-9]{2}/[0-9]{2}") //YYYY/../..
    const date_pattern_slashes_year_last : RegExp = new RegExp("[0-9]{2}/[0-9]{2}/[0-9]{4}") //../../YYYY
    const date_pattern_periods_year_first : RegExp = new RegExp("[0-9]{4}.[0-9]{2}.[0-9]{2}") //YYYY.~~.~~
    const date_pattern_periods_year_last : RegExp = new RegExp("[0-9]{2}.[0-9]{2}.[0-9]{4}") //~~.~~.YYYY
    let start : Date | undefined;
    if(event.start !== undefined){
        const start_valid = date_pattern_dashes_year_first.test(event.start) || date_pattern_dashes_year_last.test(event.start) 
                        || date_pattern_slashes_year_first.test(event.start) || date_pattern_slashes_year_last.test(event.start)
                        || date_pattern_periods_year_first.test(event.start) || date_pattern_periods_year_last.test(event.start);
        if(start_valid){
            start = new Date(event.start);
        } 
        else return NaN; // if date doesn't match reges formats
            
    }
    else return NaN; // if start date is undefined

    const time_until_start : number = (start.getTime() - (new Date()).getTime()) / 1000 / 60 / 60; //ms -> hours
    if(time_until_start < 0) return NaN;
    score += time_until_start * TIME_MULTIPLICATIVE_WEIGHT
    const split_title : Array<string> = event.title.trim().split(" ")
    for(let a = 0; a < split_title.length; a++){
        split_title[a] = split_title[a].trim().toLowerCase();
    }
    const EXAM_KEYWORDS : Set<string> = new Set<string>(["final", "midterm", "exam", "test", "project"])
    if(event.description === undefined) return NaN;

    for(const word of split_title){
        if(EXAM_KEYWORDS.has(word) || event.description.includes("EXAM")){
            score = Math.max(0, score - EXAM_SUBTRACTIVE_WEIGHT);
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
    */

    const HIGH_PRIORITY_THRESHOLD = 480;//~2 days
    const MEDIUM_PRIORITY_THRESHOLD = 1680;//~ 1 week

    const studySessions : StudySession[] = [];
    for(let a=0; a<events.length; a++){
        const event = events[a];
        if(event.description != "ASSIGNMENT" && event.description != "EXAM") continue;
        const score = priority_score(event);
        if(Number.isNaN(score)) continue;
        if(score < 0) continue; //events in past
        if(score >= 0){
            const start_date : Date = new Date(event.start);
            studySessions.push(
                {
                    id: String(a),
                    assignment: event.title,
                    course: (event.class === undefined) ? "No Course" : event.class, 
                    suggestedTime: `${start_date.getHours()}:${(start_date.getMinutes() < 10) ? "0" + String(start_date.getMinutes()) : start_date.getMinutes()}`, 
                    duration: 'duration', 
                    date: Number.isNaN(score) ? 'none' : `${start_date.getFullYear()}-${String(start_date.getMonth() + 1).padStart(2, '0')}-${String(start_date.getDate()).padStart(2, '0')}`,
                    score: score,
                    priority: 'high', //gets re-assigned later
                    type: event.description === 'EXAM' ? 'exam' : 'assignment',
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
}
