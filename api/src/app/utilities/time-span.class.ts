import {DateTime} from "luxon";

const MILLIS_PER_SECOND = 1000;
const MILLIS_PER_MINUTE = MILLIS_PER_SECOND * 60;   //     60,000
const MILLIS_PER_HOUR = MILLIS_PER_MINUTE * 60;     //  3,600,000
const MILLIS_PER_DAY = MILLIS_PER_HOUR * 24;        // 86,400,000

class TimeSpanOverflowError extends Error {
    constructor(message: string) {
        super(message);
    }
}

class TimeSpanUnableToParseError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class TimeSpan {
    public static RegExpMatch: RegExp = /^-?([0-9]+\.+)?[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}(\.+[0-9]{1,3})?$/gi;
    public static RegExpNoDaysMatch: RegExp = /^-?[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}(\.+[0-9]{1,3})?$/gi;
    public static RegExpNoMillisMatch: RegExp = /^-?([0-9]+\.+)?[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}$/gi;
    public static RegExpTimeMatch: RegExp = /^-?[0-9]+:[0-9]{1,2}(:[0-9]{1,2})?$/gi;
    public negative: boolean = false;
    private _millis: number;

    constructor(millis: number | TimeSpan) {
        if (millis instanceof TimeSpan)
            millis = millis._millis;

        this._millis = millis;
    }

    public static get zero(): TimeSpan {
        return new TimeSpan(0);
    }

    public static get maxValue(): TimeSpan {
        return new TimeSpan(Number.MAX_SAFE_INTEGER);
    }

    public static get minValue(): TimeSpan {
        return new TimeSpan(Number.MIN_SAFE_INTEGER);
    }

    public get days(): number {
        return TimeSpan.round(this._millis / MILLIS_PER_DAY);
    }

    public get hours(): number {
        return TimeSpan.round((this._millis / MILLIS_PER_HOUR) % 24);
    }

    public get minutes(): number {
        return TimeSpan.round((this._millis / MILLIS_PER_MINUTE) % 60);
    }

    public get seconds(): number {
        return TimeSpan.round((this._millis / MILLIS_PER_SECOND) % 60);
    }

    public get milliseconds(): number {
        return TimeSpan.round(this._millis % 1000);
    }

    public get totalDays(): number {
        return this._millis / MILLIS_PER_DAY * (this.negative ? -1 : 1);
    }

    public get totalHours(): number {
        return this._millis / MILLIS_PER_HOUR * (this.negative ? -1 : 1);
    }

    public get totalMinutes(): number {
        return this._millis / MILLIS_PER_MINUTE * (this.negative ? -1 : 1);
    }

    public get totalSeconds(): number {
        return this._millis / MILLIS_PER_SECOND * (this.negative ? -1 : 1);
    }

    public get totalMilliseconds(): number {
        return this._millis * (this.negative ? -1 : 1);
    }

    public static fromTimeSpan(protoTimeSpan: TimeSpan) {
        return new TimeSpan(protoTimeSpan._millis);
    }

    public static fromDays(value: number): TimeSpan {
        return TimeSpan.interval(value, MILLIS_PER_DAY);
    }

    public static fromHours(value: number): TimeSpan {
        return TimeSpan.interval(value, MILLIS_PER_HOUR);
    }

    public static fromMilliseconds(value: number): TimeSpan {
        return TimeSpan.interval(value, 1);
    }

    public static fromMinutes(value: number): TimeSpan {
        return TimeSpan.interval(value, MILLIS_PER_MINUTE);
    }

    public static fromSeconds(value: number): TimeSpan {
        return TimeSpan.interval(value, MILLIS_PER_SECOND);
    }

    public static fromTime(hours: number, minutes: number, seconds: number): TimeSpan;

    public static fromTime(days: number, hours: number, minutes: number, seconds: number, milliseconds: number): TimeSpan;

    public static fromTime(daysOrHours: number, hoursOrMinutes: number, minutesOrSeconds: number, seconds?: number, milliseconds?: number): TimeSpan {
        if (milliseconds != undefined) {
            return this.fromTimeStartingFromDays(daysOrHours, hoursOrMinutes, minutesOrSeconds, seconds, milliseconds);
        } else {
            return this.fromTimeStartingFromHours(daysOrHours, hoursOrMinutes, minutesOrSeconds);
        }
    }

    public static parse(timeSpanString: string): TimeSpan {
        let negative = false;
        if (timeSpanString[0] === '-') {
            negative = true;
            timeSpanString = timeSpanString.substring(1);
        }

        if (!TimeSpan.IsTimeSpanString(timeSpanString))
            throw new TimeSpanUnableToParseError(`Unable to parse string "${timeSpanString}".`);

        if (timeSpanString.match(TimeSpan.RegExpNoDaysMatch))
            timeSpanString = `0.${timeSpanString}`;

        if (timeSpanString.match(TimeSpan.RegExpNoMillisMatch))
            timeSpanString = `${timeSpanString}.0`;

        if (timeSpanString.match(TimeSpan.RegExpTimeMatch))
            timeSpanString = `0.${timeSpanString}.0`;

        const dotSplit = timeSpanString.split('.');
        const days = isNaN(parseInt(dotSplit[0])) ? 0 : parseInt(dotSplit[0]);
        const millis = isNaN(parseInt(dotSplit[2])) ? 0 : parseInt(dotSplit[2]);

        const split = dotSplit[1].split(':').map(x => isNaN(parseInt(x)) ? 0 : parseInt(x));

        if (negative) {
            return TimeSpan.zero
                .subtract(TimeSpan.fromDays(days))
                .subtract(TimeSpan.fromHours(split[0]))
                .subtract(TimeSpan.fromMinutes(split[1]))
                .subtract(TimeSpan.fromSeconds(split[2]))
                .subtract(TimeSpan.fromMilliseconds(millis));
        } else {
            return TimeSpan.zero
                .add(TimeSpan.fromDays(days))
                .add(TimeSpan.fromHours(split[0]))
                .add(TimeSpan.fromMinutes(split[1]))
                .add(TimeSpan.fromSeconds(split[2]))
                .add(TimeSpan.fromMilliseconds(millis));
        }
    }

    public static diff(a: DateTime, b: DateTime) {
        a = a.toUTC();
        b = b.toUTC();
        return new TimeSpan(a.diff(b).milliseconds);
    }

    public static fromMoment(date: DateTime) {
        return new TimeSpan(date.valueOf());
    }

    public static IsTimeSpanString(timeSpanString: string): boolean {
        return TimeSpan.RegExpMatch.test(timeSpanString) ||
            TimeSpan.RegExpNoDaysMatch.test(timeSpanString) ||
            TimeSpan.RegExpNoMillisMatch.test(timeSpanString) ||
            TimeSpan.RegExpTimeMatch.test(timeSpanString);
    }

    private static interval(value: number, scale: number): TimeSpan {
        if (Number.isNaN(value)) {
            throw new Error('value can\'t be NaN');
        }

        const tmp = value * scale;
        const millis = TimeSpan.round(tmp + (value >= 0 ? 0.5 : -0.5));
        if ((millis > TimeSpan.maxValue.totalMilliseconds) || (millis < TimeSpan.minValue.totalMilliseconds)) {
            throw new TimeSpanOverflowError('TimeSpanTooLong');
        }

        return new TimeSpan(millis);
    }

    private static round(n: number): number {
        if (n < 0) {
            return Math.ceil(n);
        } else if (n > 0) {
            return Math.floor(n);
        }

        return 0;
    }

    private static timeToMilliseconds(hour: number, minute: number, second: number): number {
        const totalSeconds = (hour * 3600) + (minute * 60) + second;
        if (totalSeconds > TimeSpan.maxValue.totalSeconds || totalSeconds < TimeSpan.minValue.totalSeconds) {
            throw new TimeSpanOverflowError('TimeSpanTooLong');
        }

        return totalSeconds * MILLIS_PER_SECOND;
    }

    private static fromTimeStartingFromHours(hours: number, minutes: number, seconds: number): TimeSpan {
        const millis = TimeSpan.timeToMilliseconds(hours, minutes, seconds);
        return new TimeSpan(millis);
    }

    private static fromTimeStartingFromDays(days: number, hours: number, minutes: number, seconds: number, milliseconds: number): TimeSpan {
        const totalMilliSeconds = (days * MILLIS_PER_DAY) +
            (hours * MILLIS_PER_HOUR) +
            (minutes * MILLIS_PER_MINUTE) +
            (seconds * MILLIS_PER_SECOND) +
            milliseconds;

        if (totalMilliSeconds > TimeSpan.maxValue.totalMilliseconds || totalMilliSeconds < TimeSpan.minValue.totalMilliseconds) {
            throw new TimeSpanOverflowError('TimeSpanTooLong');
        }
        return new TimeSpan(totalMilliSeconds);
    }

    public setNegative(isNegative: boolean): TimeSpan {
        this.negative = isNegative;
        return this;
    }

    public toString = (): string => {
        return (this.negative ? '-' : '') + (this.days != 0 ? `${this.days}.` : '') +
            `${leftPad(this.hours)}:${leftPad(this.minutes)}:${leftPad(this.seconds)}` +
            (this.milliseconds != 0 ? `.${leftPad(this.milliseconds, 3)}` : '');
    };

    public add(ts: TimeSpan, override: boolean = true): TimeSpan {
        const millis = this._millis + ts.totalMilliseconds;

        if (override)
            this._millis = millis;

        return new TimeSpan(millis);
    }

    public subtract(ts: TimeSpan): TimeSpan {
        const result = this._millis - ts.totalMilliseconds;
        return new TimeSpan(result);
    }

    public format(formatString: string): string {
        if (formatString === null)
            return this.toString();

        return (this.negative ? '-' : '') +
            formatString
                .replace('d', this.days + '')
                .replace('hhh', Math.floor(this.totalHours) + '')
                .replace('hh', leftPad(this.hours))
                .replace('mm', leftPad(this.minutes))
                .replace('ss', leftPad(this.seconds));
    }

    public clone() {
        return new TimeSpan(this._millis);
    }
}

function leftPad(value: number, length: number = 2) {
    let prefix = '';
    for (let i = 0; i <= length; i++)
        prefix += '0';

    return (`${prefix}${value}`).slice(-length);
}
