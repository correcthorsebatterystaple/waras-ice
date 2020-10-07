import { IHijriDate } from '../models/hijriDate.model';
import { HijriMonth } from '../models/enums/HijriMonth.enum';
import { IHijriEvent } from '../models/hijriEvent.model';

export function parseHijriDate(date: string): IHijriDate {
    const regex = /^(\d+)\-(\d{2})\-(\d{2})$/;
    const match = date.match(regex);

    if (!match) {
        throw new Error('Cannot parse date, format is invalid');
    }

    const res = {
        year: parseInt(match[1]),
        month: parseInt(match[2]) as HijriMonth,
        day: parseInt(match[3]),
    };

    if (res.month > 12 || res.month < 1) {
        throw new Error('Cannot parse date, month is invalid');
    }

    if (res.day > daysInHijriMonth(res.month) || res.day < 1) {
        throw new Error('Cannot parse date, day is invalid');
    }

    return res;
}

function daysInHijriMonth(month: number): number {
    if (month > 12 || month < 1) {
        throw Error('Month is invalid');
    }

    return month % 2 === 0 ? 29 : 30;
}

export function addDayToHijriDate(date: IHijriDate): IHijriDate {
    const daysInMonth = daysInHijriMonth(date.month);
    const result = {...date};

    result.day++;

    if (result.day > daysInMonth) {
        result.day = 1;
        result.month++;

        if (result.month > 12) {
            result.month = 1;
            result.year++;
        }
    }

    return result;
}

export function areHijriDatesEqual(date1: IHijriDate, date2: IHijriDate): boolean {
    if (date1.month === date2.month && date1.day === date2.day) {
        return true;
    }

    return false;
}

export function findEventsByDate(list: IHijriEvent[], date: IHijriDate): IHijriEvent[] {
    const result = list.filter(item => areHijriDatesEqual(item.date, date));

    return result;
}