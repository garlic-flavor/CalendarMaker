import { assertEq } from './unittest';
import {iCalendar as iC} from './icalendar';

let s = new iC.WriteStream();
s.writeValue(`DESCRIPTION:Born February 12, 1809\nSixteenth President (1861-1865)\n\n\n\nhttp://AmericanHistoryCalendar.com`);
assertEq(s.toString(), "DESCRIPTION:Born February 12\\, 1809\\nSixteenth President (1861-1865)\\n\\n\\n\r\n \\nhttp://AmericanHistoryCalendar.com");

assertEq((new iC.Calendar() as any)
    .version('2.0')
    .prodid('-//ZContent.net//Zap Calendar 1.0//EN')
    .calscale('GREGORIAN')
    .method('PUBLISH')
    .vevent((e:any)=>{ e
        .dtstamp('20150421T141403')
        .uid('c7614cff-3549-4a00-9152-d25cc1fe077d')
        .summary('Abraham Lincoln')
        .sequence('0')
        .status('CONFIRMED')
        .transp('TRANSPARENT')
        .rrule({
            freq:'YEARLY',
            interval:1,
            bymonth:2,
            bymonthday:12
        })
        .dtstart('20080212')
        .dtend('20080213')
        .categories(['U.S. presidents','Civil War People'])
        .location('Hodgenville, Kentucky')
        .geo('37.5739497;-85.7399606')
        .description('Born February 12, 1809\nSixteenth President (1861-1865)\n\n\n\nhttp://AmericanHistoryCalendar.com')
        .url(['http://americanhistorycalendar.com/peoplecalendar/1','328-abraham-lincoln']);
    })
    .toString(), 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ZContent.net//Zap Calendar 1.0//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nBEGIN:VEVENT\r\nDTSTAMP:20150421T141403\r\nUID:c7614cff-3549-4a00-9152-d25cc1fe077d\r\nSUMMARY:Abraham Lincoln\r\nSEQUENCE:0\r\nSTATUS:CONFIRMED\r\nTRANSP:TRANSPARENT\r\nRRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=2;BYMONTHDAY=12\r\nDTSTART:20080212\r\nDTEND:20080213\r\nCATEGORIES:U.S. presidents,Civil War People\r\nLOCATION:Hodgenville\\, Kentucky\r\nGEO:37.5739497;-85.7399606\r\nDESCRIPTION:Born February 12\\, 1809\\nSixteenth President (1861-1865)\\n\\n\\n\r\n \\nhttp://AmericanHistoryCalendar.com\r\nURL:http://americanhistorycalendar.com/peoplecalendar/1,328-abraham-lincol\r\n n\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n');

assertEq((new iC.Calendar() as any)
    .prodid('-//RDU Software//NONSGML HandCal//EN')
    .version('2.0')
    .vtimezone((tz:any, d?:any)=>{tz
        .tzid('America/New_York')
        .standard((st:any)=>{st
            .dtstart('10091025T020000Z')
            .tzoffsetfrom('-0400')
            .tzoffsetto('-0500')
            .tzname('EST');
        })
        .daylight((dl:any)=>{ dl
            .dtstart('19990404T020000Z')
            .tzoffsetfrom('-0500')
            .tzoffsetto('-0400')
            .tzname('EDT')
        });
    })
    .vevent((e:any)=>{e
        .dtstamp('19980309T231000Z')
        .uid('guid-1.example.com')
        .organizer('mailto:mrbig@example.com')
        .attendee({mailto:'employee-A@example.com'}, {rsvp:'TRUE', role:'REQ-PARTICIPANT', cutype:'GROUP'})
        .description('Project XYZ Review Meeting')
        .categories('MEETING')
        .class('PUBLIC')
        .created('19980309T130000Z')
        .summary('XYZ Project Review')
        .dtstart('19980312T083000', {tzid:'America/New_York'})
        .dtend('19980312T093000', {tzid:'America/New_York'})
        .location('1CP Conference Room 4350');
    })
    .toString(), 'BEGIN:VCALENDAR\r\nPRODID:-//RDU Software//NONSGML HandCal//EN\r\nVERSION:2.0\r\nBEGIN:VTIMEZONE\r\nTZID:America/New_York\r\nBEGIN:STANDARD\r\nDTSTART:10091025T020000Z\r\nTZOFFSETFROM:-0400\r\nTZOFFSETTO:-0500\r\nTZNAME:EST\r\nEND:STANDARD\r\nBEGIN:DAYLIGHT\r\nDTSTART:19990404T020000Z\r\nTZOFFSETFROM:-0500\r\nTZOFFSETTO:-0400\r\nTZNAME:EDT\r\nEND:DAYLIGHT\r\nEND:VTIMEZONE\r\nBEGIN:VEVENT\r\nDTSTAMP:19980309T231000Z\r\nUID:guid-1.example.com\r\nORGANIZER:mailto:mrbig@example.com\r\nATTENDEE;RSVP=TRUE;ROLE=REQ-PARTICIPANT;CUTYPE=GROUP:MAILTO=employee-A@exa\r\n mple.com\r\nDESCRIPTION:Project XYZ Review Meeting\r\nCATEGORIES:MEETING\r\nCLASS:PUBLIC\r\nCREATED:19980309T130000Z\r\nSUMMARY:XYZ Project Review\r\nDTSTART;TZID=America/New_York:19980312T083000\r\nDTEND;TZID=America/New_York:19980312T093000\r\nLOCATION:1CP Conference Room 4350\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n');
