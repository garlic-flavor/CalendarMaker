import {iCalendar as iC} from './icalendar.js';
import * as ICK from './icalendar_kitamura.js';

export class DayShift {
    day: Date;
    id: string;
    shift: string;
    constructor(day: Date, id: string, shift: string) {
        this.day = day;
        this.id = id;
        this.shift = shift;
    }
    toString() : string {
        return `${this.id}@${this.day.toLocaleString()}: ${this.shift}`;
    }
    addAsVEventTo(cal: iC.Calendar) {
        let d = `${this.day.getFullYear()}/${this.day.getMonth()+1}/${this.day.getDate()}`;
        ICK.addShiftEvent(cal, this.id, d, this.shift);
    }
}

export class ShiftDays {
    days: number[];
    constructor() {
        this.days = [];
    }
    write(token:number) {
        this.days.push(token);
    }
    at(idx: number) : number {
        return this.days[idx];
    }
    reset() {
        this.days = [];
    }
    toString() : string {
        return `days: ${this.days.toString()}`;
    }
}


export class ShiftPage {
    private static readonly targetMonthMatch = /^(\d{4})年(\d{2})月\d{2}日$/;
    private static readonly daysMatch = /^(\d{2})\([月火水木金土日]\)$/;
    private static readonly memberIDMatch = /^\d{5}$/;
    private static readonly shiftMatch = /^(有休|公休|\d{4}-\d{4})$/;

    targetMonth?: Date;
    days: ShiftDays;
    shift: DayShift[];
    currentId?: string;
    currentDay: number;
    targetId?: string;

    constructor(id?: string) {
        this.shift = [];
        this.days = new ShiftDays();
        this.targetId = id;
        this.currentDay = 0;
        this.targetMonth = undefined;
    }

    write(token:string) {
        if (ShiftPage.targetMonthMatch.test(token)) {
            if (this.targetMonth === undefined) {
                this.targetMonth = new Date(token.replace(ShiftPage.targetMonthMatch, "$1/$2/1"));
            }
        } else if (ShiftPage.daysMatch.test(token)) {
            this.days.write(parseInt(token.replace(ShiftPage.daysMatch, "$1")));
        } else if (ShiftPage.memberIDMatch.test(token)) {
            if (this.targetId === undefined || token == this.targetId) {
                this.currentId = token;
            } else {
                this.currentId = undefined;
            }
            this.currentDay = 0;
        }  else if (ShiftPage.shiftMatch.test(token)) {
            if (this.currentId !== undefined && this.targetMonth !== undefined) {
                let day = new Date(this.targetMonth.getFullYear(), this.targetMonth.getMonth(), this.days.at(this.currentDay));
                this.shift.push(new DayShift(day, this.currentId, token));
                this.currentDay++;
            }
        }
    }

    // nextPage() {
    //     this.days.reset();
    //     this.currentId = undefined;
    //     this.currentDay = 0;
    // }

    toString() : string {
        let res = "";
        if (this.targetMonth !== undefined) {
            res += "対象月: " + this.targetMonth.getFullYear() + "/" + (this.targetMonth.getMonth() + 1);
        }
        res += "\n" + this.days.toString();
        for (let i = 0; i < this.shift.length; i++) {
            res = res + '\n' + this.shift[i].toString();
        }
        return res;
    }

    enumAllMemberIds(): string[] {
        return this.shift.map((s)=>s.id).filter((v, i, arr)=>arr.indexOf(v)===i);
    }

    filterById(id: string): DayShift[] {
        return this.shift.filter((v, i, arr)=>v.id===id);
    }
    addTo(cal: iC.Calendar, id?: string) {
        if (id !== undefined) {
            this.filterById(id).forEach((s)=>s.addAsVEventTo(cal));
        } else {
            this.shift.forEach((s)=>s.addAsVEventTo(cal));
        }

    }
}
