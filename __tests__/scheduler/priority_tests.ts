function priority_test(
    test_name: string, //will be printed
    start1 : Date,
    end1 : Date,
    title1 : string,
    start2 : Date,
    end2 : Date,
    title2 : string,
    expected : number //-1 if scores 1 < 2, 0 if 1 == 2, 1 if 1 > 2
){
    const score1 = priority_score(start1, end1, title1);
    const score2 = priority_score(start2, end2, title2);
    let pass : boolean = false;
    switch(expected){
        case -1:
            pass = score1 < score2;
            break;
        case 0:
            pass = score1 == score2;
            break;
        case 1:
            pass = score1 > score2;
            break;
        default:
            throw new Error("invalid expectation value");
    }
    if(pass){
        console.log("Test Passed: " + test_name)
    }
    else{
        console.log("Test Failed: " + test_name)
    }
    return pass;
}

function run_priority_tests(){
    priority_test(
        "Same date; no keywords",
        new Date(2027, 5, 10), 
        new Date(2027, 5, 10), 
        "chemistry class", 
        new Date(2027, 5, 10), 
        new Date(2027, 5, 10), 
        "math lecture", 
        0
    )
    priority_test(
        "1st date earlier; no keywords",
        new Date(2027, 5, 8), 
        new Date(2027, 5, 8), 
        "chemistry class", 
        new Date(2027, 5, 10), 
        new Date(2027, 5, 10), 
        "math lecture", 
        -1
    )
    priority_test(
        "2nd date earlier; no keywords",
        new Date(2027, 5, 8), 
        new Date(2027, 5, 8), 
        "chemistry class", 
        new Date(2027, 4, 7), 
        new Date(2027, 4, 7), 
        "math lecture", 
        1
    )
    priority_test(
        "same date; 1st with keywords",
        new Date(2027, 5, 8), 
        new Date(2027, 5, 8), 
        "chemistry exam", 
        new Date(2027, 5, 8), 
        new Date(2027, 5, 8), 
        "math class", 
        -1
    )
    priority_test(
        "dates within 2 days, 1st earlier; 1st with keywords",
        new Date(2027, 5, 8), 
        new Date(2027, 5, 8), 
        "chemistry exam", 
        new Date(2027, 5, 10), 
        new Date(2027, 5, 10), 
        "math class", 
        -1
    )
    priority_test(
        "dates within 2 days, 2nd earlier; 1st with keywords",
        new Date(2027, 5, 8), 
        new Date(2027, 5, 8), 
        "chemistry exam", 
        new Date(2027, 5, 6), 
        new Date(2027, 5, 6), 
        "math class", 
        -1
    )
    priority_test(
        "dates more than 2 days apart, 2nd earlier; 1st with keywords",
        new Date(2027, 5, 8), 
        new Date(2027, 5, 8), 
        "chemistry exam", 
        new Date(2027, 5, 6), 
        new Date(2027, 5, 6), 
        "math class", 
        1
    )
    priority_test(
        "dates same; both with keywords",
        new Date(2027, 5, 8), 
        new Date(2027, 5, 8), 
        "chemistry exam", 
        new Date(2027, 5, 8), 
        new Date(2027, 5, 8), 
        "math project", 
        0
    )
    priority_test(
        "1st date earlier; both with keywords",
        new Date(2027, 5, 7), 
        new Date(2027, 5, 7), 
        "chemistry exam", 
        new Date(2027, 5, 8), 
        new Date(2027, 5, 8), 
        "math project", 
        -1
    )
    priority_test(
        "2nd date earlier; both with keywords",
        new Date(2027, 5, 8), 
        new Date(2027, 5, 8), 
        "chemistry exam", 
        new Date(2027, 5, 7), 
        new Date(2027, 5, 7), 
        "math project", 
        1
    )
}
