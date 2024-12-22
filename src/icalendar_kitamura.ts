import {iCalendar as iC} from "./icalendar.js";

export function newCalendar() : iC.Calendar {
    let cal = (new iC.Calendar() as any)
        .prodid('-//Kitamura corp.//ShiftMaker//JP')
        .version('2.0');
    iC.addTokyoTimeZone(cal);
    return cal;
}

function getUIDfor(id:string, day:string | Date) {
    return `${iC.convertToDayString(day)}@${id}/Kitamura`;
}

function addOneTimeEvent(cal:iC.Calendar, id:string, title:string, start:string|Date, end:string|Date, desc?:string): void {
    (cal as any).vevent((e:any) => { e
        .uid(getUIDfor(id, start))
        .dtstamp(iC.convertToUTCString (new Date()))
        .dtstart(iC.convertToUTCString(start))
        .dtend(iC.convertToUTCString(end))
        .summary(title);
        if (desc) { e.description(desc); };
        iC.addAlarm(e, 'AUDIO', '15:00', title);
        iC.addAlarm(e, 'DISPLAY', '01:00', title);
    });
}

function addWholeDayEvent(cal:iC.Calendar, id:string, title:string, day:string|Date, desc?:string) : void {
    (cal as any).vevent((e:any) => { e
        .uid(getUIDfor(id, day))
        .dtstamp(iC.convertToUTCString(new Date()))
        .dtstart(iC.convertToDayString(day), {value:'DATE'})
        .dtend(iC.convertToNextDayString(day), {value:'DATE'})
        .summary(title);
        if (desc) { e.description(desc); }
    });
}

function getStartEnd(day:string|Date, shift:string): [Date, Date] {
    let dd = typeof(day) === 'string' ? new Date(day) : day;
    let start = new Date(`${dd.toLocaleDateString()} ${shift.slice(0, 2)}:${shift.slice(2, 4)}`);
    let end = new Date(`${dd.toLocaleDateString()} ${shift.slice(5, 7)}:${shift.slice(7, 9)}`);
    return [start, end];
}

export function addShiftEvent(cal:iC.Calendar, id:string, day:string|Date, shift:string) :void {
    let idx = -1;
    if (shift == '公休' || shift == '有休') {
        addWholeDayEvent(cal, id, shift, day);
    } else if (0 <= (idx = shift.indexOf('-'))) {
        let [s, e] = getStartEnd(day, shift);
        addOneTimeEvent(cal, id, shift, s, e);
    } else {
        throw 'bad sequence.';
    }
}

