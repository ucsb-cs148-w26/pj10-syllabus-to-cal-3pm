function priority_score(
    start : Date,
    end : Date,
    title : string
){
    //higher score: lower priority
    const TIME_MULTIPLICATIVE_WEIGHT : number = 10; //per hour
    const NOT_EXAM_ADDITIVE_WEIGHT : number = TIME_MULTIPLICATIVE_WEIGHT * 2.1 * 24; //proritize exam if 2 there's one two days after another event
    let score = NOT_EXAM_ADDITIVE_WEIGHT;

    if(end.getTime() < start.getTime()){
        throw new Error("End time before start");
    }

    let time_until_start : number = (start.getTime() - (new Date()).getTime()) / 1000 / 60 / 60; //hours
    score += time_until_start * TIME_MULTIPLICATIVE_WEIGHT

    let split_title : Array<string> = title.trim().split(" ")
    for(let a = 0; a < split_title.length; a++){
        split_title[a] = split_title[a].trim()
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
