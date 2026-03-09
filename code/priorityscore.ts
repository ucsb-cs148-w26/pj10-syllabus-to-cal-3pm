export function priority_score(
    start : Date,
    end : Date,
    event_type : 'exam' | 'assignment'
){
    //higher score: lower priority
    const TIME_MULTIPLICATIVE_WEIGHT : number = 10; //per hour
    const NOT_EXAM_ADDITIVE_WEIGHT : number = TIME_MULTIPLICATIVE_WEIGHT * 2.1 * 24; //proritize exam if 2 there's one two days after another event
    let score = NOT_EXAM_ADDITIVE_WEIGHT;

    if(isNaN(start.getTime()) || isNaN(end.getTime())) return NaN;
    if(end.getTime() < start.getTime()) return NaN;

    let time_until_start : number = (start.getTime() - (new Date()).getTime()) / 1000 / 60 / 60; //hours
    score += time_until_start * TIME_MULTIPLICATIVE_WEIGHT

    if(event_type === 'exam'){
        score -= NOT_EXAM_ADDITIVE_WEIGHT
    }
    return score;
}
