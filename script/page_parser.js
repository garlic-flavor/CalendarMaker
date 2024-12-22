import * as ICK from './icalendar_kitamura.js';
export class DayShift {
    day;
    id;
    shift;
    constructor(day, id, shift) {
        this.day = day;
        this.id = id;
        this.shift = shift;
    }
    toString() {
        return `${this.id}@${this.day.toLocaleString()}: ${this.shift}`;
    }
    addAsVEventTo(cal) {
        let d = `${this.day.getFullYear()}/${this.day.getMonth() + 1}/${this.day.getDate()}`;
        ICK.addShiftEvent(cal, this.id, d, this.shift);
    }
}
export class ShiftDays {
    days;
    constructor() {
        this.days = [];
    }
    write(token) {
        this.days.push(token);
    }
    at(idx) {
        return this.days[idx];
    }
    reset() {
        this.days = [];
    }
    toString() {
        return `days: ${this.days.toString()}`;
    }
}
export class ShiftPage {
    static targetMonthMatch = /^(\d{4})年(\d{2})月\d{2}日$/;
    static daysMatch = /^(\d{2})\([月火水木金土日]\)$/;
    static memberIDMatch = /^\d{5}$/;
    static shiftMatch = /^(有休|公休|\d{4}-\d{4})$/;
    targetMonth;
    days;
    shift;
    currentId;
    currentDay;
    targetId;
    constructor(id) {
        this.shift = [];
        this.days = new ShiftDays();
        this.targetId = id;
        this.currentDay = 0;
        this.targetMonth = undefined;
    }
    write(token) {
        if (ShiftPage.targetMonthMatch.test(token)) {
            if (this.targetMonth === undefined) {
                this.targetMonth = new Date(token.replace(ShiftPage.targetMonthMatch, "$1/$2/1"));
            }
        }
        else if (ShiftPage.daysMatch.test(token)) {
            this.days.write(parseInt(token.replace(ShiftPage.daysMatch, "$1")));
        }
        else if (ShiftPage.memberIDMatch.test(token)) {
            if (this.targetId === undefined || token == this.targetId) {
                this.currentId = token;
            }
            else {
                this.currentId = undefined;
            }
            this.currentDay = 0;
        }
        else if (ShiftPage.shiftMatch.test(token)) {
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
    toString() {
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
    enumAllMemberIds() {
        return this.shift.map((s) => s.id).filter((v, i, arr) => arr.indexOf(v) === i);
    }
    filterById(id) {
        return this.shift.filter((v, i, arr) => v.id === id);
    }
    addTo(cal, id) {
        if (id !== undefined) {
            this.filterById(id).forEach((s) => s.addAsVEventTo(cal));
        }
        else {
            this.shift.forEach((s) => s.addAsVEventTo(cal));
        }
    }
}
