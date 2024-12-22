// icalendar.ts written by 市川宏規, 2024. some rights reserved under MIT license.
export var iCalendar;
(function (iCalendar) {
    // icsファイルを作成する。
    // メインインターフェイスは Put / toString
    class WriteStream {
        static MAX_COLUMN = 75;
        buf;
        col;
        upperName;
        constructor() {
            this.buf = '';
            this.col = 0;
            this.upperName = true;
        }
        toString() {
            return this.buf;
        }
        write(str) {
            if (this.col + str.length < WriteStream.MAX_COLUMN) {
                this.buf += str;
                this.col += str.length;
            }
            else {
                let chomp = WriteStream.MAX_COLUMN - this.col - 1;
                this.write(str.substring(0, chomp));
                this.writeLine();
                this.writeIndent();
                this.write(str.substring(chomp));
            }
        }
        writeOnSameLine(str) {
            if (this.col + str.length <= WriteStream.MAX_COLUMN) {
                this.buf += str;
                this.col += str.length;
            }
            else if (WriteStream.MAX_COLUMN < str.length) {
                throw 'the input is too long to one line.';
            }
            else {
                this.writeLine();
                this.writeIndent();
                this.writeOnSameLine(str);
            }
        }
        writeName(name) {
            if (this.upperName) {
                this.write(name.toUpperCase());
            }
            else {
                this.write(name);
            }
        }
        writeLine() {
            this.buf += "\r\n";
            this.col = 0;
        }
        writeIndent() {
            this.write(' ');
        }
        writePreValue() {
            this.write(':');
        }
        writeValueSeparator() {
            this.write(',');
        }
        writeParameterSeparator() {
            this.write(';');
        }
        writeParameterEqual() {
            this.write('=');
        }
        writeParameterValue(value) {
            if (0 <= value.indexOf(' ')) {
                this.write('"');
                this.write(value);
                this.write('"');
            }
            else {
                this.write(value);
            }
        }
        writeParameters(props) {
            let keys = Object.keys(props);
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                this.writeName(key.toUpperCase());
                this.writeParameterEqual();
                this.writeParameterValue(props[key].toString());
                if ((i + 1) < keys.length) {
                    this.writeParameterSeparator();
                }
            }
        }
        writeValue(value) {
            for (let i = 0; i < value.length; i++) {
                let c = value[i];
                if (c == "\r") {
                    this.writeOnSameLine('\\r');
                }
                else if (c == "\n") {
                    this.writeOnSameLine('\\n');
                }
                else if (c == ',') {
                    this.writeOnSameLine('\\,');
                }
                else {
                    this.write(c);
                }
            }
        }
        writeContentLine(name, props, value) {
            this.writeName(name);
            if (props && 0 < Object.keys(props).length) {
                this.writeParameterSeparator();
                this.writeParameters(props);
            }
            if (value !== undefined && value !== null && value !== '') {
                this.writePreValue();
                if (typeof (value) == 'string') {
                    this.writeValue(value);
                }
                else if (Array.isArray(value)) {
                    for (let i = 0; i < value.length; i++) {
                        this.writeValue(value[i]);
                        if (i + 1 < value.length) {
                            this.writeValueSeparator();
                        }
                    }
                }
                else {
                    this.writeParameters(value);
                }
            }
            this.writeLine();
        }
        writeComponent(name, block, data) {
            this.writeContentLine('BEGIN', null, name);
            block(this, data);
            this.writeContentLine('END', null, name);
        }
        // オブジェクトをストリームに書き込む。
        //    name
        //    properties
        //    value
        //    children
        //    をそれぞれ使用する。
        put(h) {
            if (h.children) {
                this.writeComponent(h.name, (stream, data) => {
                    for (let i = 0; i < data.children.length; i++) {
                        stream.put(data.children[i]);
                    }
                }, h);
            }
            else {
                this.writeContentLine(h.name, h.properties, h.value);
            }
        }
    }
    iCalendar.WriteStream = WriteStream;
    // カレンダーの各要素を表現する。
    class Base {
        name;
        value;
        properties;
        required;
        children;
        constructor(name, properties, value, required) {
            this.name = name;
            this.value = value;
            this.properties = properties;
            this.required = required;
            this.children = [];
        }
        contains(name) {
            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i].name == name) {
                    return true;
                }
            }
            return false;
        }
        assertNoChildOf(name) {
            if (this.contains(name)) {
                throw `${name} is duplicated`;
            }
        }
        assertHasChildOf(name) {
            if (!this.contains(name)) {
                throw `${name} is required`;
            }
        }
        addChild(name, props, value) {
            this.children.push({ name: name, properties: props, value: value });
            return this;
        }
        addOnlyChild(name, props, value) {
            this.assertNoChildOf(name);
            this.addChild(name, props, value);
            return this;
        }
        addComponent(name, cont) {
            let comp = new iCalendar[name]();
            cont(comp);
            comp.verify && comp.verify();
            this.children.push(comp);
            return this;
        }
        verify() {
            for (let i = 0; i < this.required.length; i++) {
                this.assertHasChildOf(this.required[i]);
            }
        }
        toString() {
            this.verify();
            let stream = new WriteStream();
            stream.put(this);
            return stream.toString();
        }
        registChildren(names) {
            for (let i = 0; i < names.length; i++) {
                let name = names[i];
                let lname = name.toLowerCase();
                if (lname in this.constructor.prototype) {
                    continue;
                }
                this.constructor.prototype[lname] = function (v, p) {
                    return this.addChild(name, p ?? null, v);
                };
            }
        }
        registOnlyChildren(names) {
            for (let i = 0; i < names.length; i++) {
                let name = names[i];
                let lname = name.toLowerCase();
                if (lname in this.constructor.prototype) {
                    continue;
                }
                this.constructor.prototype[lname] = function (v, p) {
                    return this.addOnlyChild(name, p ?? null, v);
                };
            }
        }
        registComponents(names) {
            for (let i = 0; i < names.length; i++) {
                let name = names[i];
                let lname = name.toLowerCase();
                if (lname in this.constructor.prototype) {
                    continue;
                }
                this.constructor.prototype[lname] = function (c) {
                    return this.addComponent(name, c);
                };
            }
        }
    }
    iCalendar.Base = Base;
    // VCALENDAR要素を表現する。
    class Calendar extends Base {
        constructor() {
            super('VCALENDAR', null, '', ['VERSION', 'PRODID']);
            this.registOnlyChildren(['VERSION', 'PRODID', 'CALSCALE', 'METHOD']);
            this.registComponents(['VEvent', 'VTimeZone']);
        }
    }
    iCalendar.Calendar = Calendar;
    // VEVENT要素を表現する。
    class VEvent extends Base {
        constructor() {
            super('VEVENT', null, '', ['DTSTAMP', 'UID']);
            this.registOnlyChildren([
                'DTEND', 'DURATION', 'DTSTAMP', 'UID', 'DTSTART', 'CLASS', 'CREATED', 'DESCRIPTION', 'GEO',
                'LAST-MODIFIED', 'LOCATION', 'ORGANIZER', 'PRIORITY', 'SEQ', 'SEQUENCE',
                'STATUS', 'SUMMARY', 'TRANSP', 'URL', 'RECURID', 'RRULE'
            ]);
            this.registChildren([
                'ATTACH', 'ATTENDEE', 'CATEGORIES', 'COMMENT', 'CONTACT', 'EXDATE',
                'RSTATUS', 'RELATED', 'RESOURCES', 'RDATA'
            ]);
            this.registComponents(['VAlarm']);
        }
        verify() {
            if (this.contains('DURATION')) {
                this.assertNoChildOf('DTEND');
            }
            if (this.contains('DTEND')) {
                this.assertNoChildOf('DURATION');
            }
            super.verify();
        }
    }
    iCalendar.VEvent = VEvent;
    // VTIMEZONE要素を表現する。
    class VTimeZone extends Base {
        constructor() {
            super('VTIMEZONE', null, '', ['TZID']);
            this.registOnlyChildren([
                'TZID', 'LAST-MOD', 'TZURL'
            ]);
            this.registComponents([
                'Standard', 'Daylight'
            ]);
        }
        verify() {
            if ((!this.contains('STANDARD')) && (!this.contains('DAYLIGHT'))) {
                throw 'STANDARDC / DAYLIGHTC is required';
            }
            super.verify();
        }
    }
    iCalendar.VTimeZone = VTimeZone;
    // STANDARD要素を表現する。
    class Standard extends Base {
        constructor(name) {
            if (name) {
                super(name, null, '', []);
            }
            else {
                super('STANDARD', null, '', []);
            }
            this.registOnlyChildren([
                'DTSTART', 'TZOFFSETFROM', 'TZOFFSETTO', 'TZNAME'
            ]);
        }
    }
    iCalendar.Standard = Standard;
    // DAYLIGHT要素を表現する。
    class Daylight extends Standard {
        constructor() {
            super('DAYLIGHT');
            this.registOnlyChildren([
                'RRULE'
            ]);
        }
    }
    iCalendar.Daylight = Daylight;
    // VALARM要素を表現する。
    class VAlarm extends Base {
        constructor() {
            super('VALARM', null, '', []);
            this.registOnlyChildren([
                'ACKNOWLEDGED', 'ACTION', 'ATTACH', 'TRIGGER', 'UID', 'DESCRIPTION'
            ]);
        }
    }
    iCalendar.VAlarm = VAlarm;
    // DateTimeを世界標準時形式で表現する。
    // Examples:
    //   20241216T112112Z
    function convertToUTCString(dt) {
        let d = (typeof (dt) == 'string') ? new Date(dt) : dt;
        let year = d.getUTCFullYear();
        let month = ('0' + (d.getUTCMonth() + 1)).slice(-2);
        let date = ('0' + (d.getUTCDate())).slice(-2);
        let hours = ('0' + (d.getUTCHours())).slice(-2);
        let minutes = ('0' + (d.getUTCMinutes())).slice(-2);
        let seconds = ('0' + (d.getUTCSeconds())).slice(-2);
        return `${year}${month}${date}T${hours}${minutes}${seconds}Z`;
    }
    iCalendar.convertToUTCString = convertToUTCString;
    function convertToDayString(dt) {
        let d = (typeof (dt) == 'string') ? new Date(dt) : dt;
        let year = d.getFullYear();
        let month = ('0' + (d.getMonth() + 1)).slice(-2);
        let date = ('0' + (d.getDate())).slice(-2);
        return `${year}${month}${date}`;
    }
    iCalendar.convertToDayString = convertToDayString;
    function convertToNextDayString(dt) {
        let d = (typeof (dt) == 'string') ? new Date(dt) : dt;
        return convertToDayString(new Date(d.getTime() + 24 * 60 * 60 * 1000));
    }
    iCalendar.convertToNextDayString = convertToNextDayString;
    // 東京のタイムゾーンに設定する。
    function addTokyoTimeZone(cal) {
        cal.vtimezone((tz) => {
            tz
                .tzid('Asia/Tokyo')
                .daylight((dl) => {
                dl
                    .dtstart('19500507T000000')
                    .rrule({ freq: 'YEARLY', until: '19510505T150000Z', bymonth: 5, byday: '1SU' })
                    .tzname('JDT')
                    .tzoffsetfrom('+0900')
                    .tzoffsetto('+1000');
            })
                .standard((std) => {
                std
                    .dtstart('19510909T010000')
                    .tzname('JST')
                    .tzoffsetfrom('+1000')
                    .tzoffsetto('+0900');
            });
        });
    }
    iCalendar.addTokyoTimeZone = addTokyoTimeZone;
    // アラームを追加する。
    function addAlarm(e, type, before, desc) {
        e.valarm((a) => {
            a
                .action(type)
                .trigger(`-PT${(new Date(`1970-01-01T${before}Z`)).getTime() / 1000 / 60}M`)
                .description(desc);
        });
    }
    iCalendar.addAlarm = addAlarm;
})(iCalendar || (iCalendar = {}));
