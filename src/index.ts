import parse from 'csv-parse/lib/sync';
import path from 'path';
import moment, { Moment } from 'moment';
import args from 'minimist-argv';
import 'colors';
import * as ics from 'ics';
import { readFileSync, writeFileSync } from 'fs';
import { IHijriEvent } from './models/hijriEvent.model';
import { IHijriDate } from './models/hijriDate.model';
import { HijriMonth } from './models/enums/HijriMonth.enum';
import { IGregEvent } from './models/gregEvent.model';

const filename = args['file'];
const gregRefDate = args['greg-ref'];
const hijriRefDate = args['hijri-ref'];
const outFilename = args['out-file'] || args['o'] || './waras.ics';
const alarmMinutes = args['alarm-minutes'] || 10;

(() => {
    const errors: string[] = [];

    if (!filename) {
        errors.push(`[${'ERROR'.red}]\tFile missing. specify file with --file.`);
    }
    if (!gregRefDate) {
        errors.push(`[${'ERROR'.red}]\tGregorian reference date missing. specify file with --greg-ref.`);
    }
    if (!hijriRefDate) {
        errors.push(`[${'ERROR'.red}]\tHijri reference  missing. specify file with --hijri-ref.`);
    }

    if (errors.length) {
        console.log(errors.join('\n'));
        process.exit(1);
    }
})();
interface WarasCsv {
    name: string;
    warasDay: string;
    warasMonth: string;
    warasYear?: string;
}

function readData(file: string): IHijriEvent[] {
    const csv = readFileSync(path.resolve(file));

    let data = parse(csv, {
        columns: true,
        ltrim: true,
    }) as WarasCsv[];

    return data.map<IHijriEvent>((record) => {
        return {
            name: record.name,
            date: {
                day: parseInt(record.warasDay),
                month: parseInt(record.warasMonth),
                year: parseInt(record.warasYear),
            } as IHijriDate
        };
    });
}

function parseHijriDate(date: string): IHijriDate {
    const regex = /(\d{4})\-(\d{2})\-(\d{2})/;
    const match = date.match(regex);

    return {
        year: parseInt(match[1]),
        month: parseInt(match[2]) as HijriMonth,
        day: parseInt(match[3]),
    };
}

function addDayToHijriDate(date: IHijriDate): IHijriDate {
    const daysInMonth = date.month % 2 === 0 ? 29 : 30;
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

function areHijriDatesEqual(date1: IHijriDate, date2: IHijriDate): boolean {
    if (date1.month === date2.month && date1.day === date2.day) {
        return true;
    }

    return false;
}

function hijriDateIsInList(list: IHijriEvent[], date: IHijriDate): IHijriEvent {
    for (const item of list) {
        if (areHijriDatesEqual(item.date, date)) return item;
    }

    return undefined;
}

(async () => {

    const hijriWarasEvents = readData(path.resolve(filename));
    const gregWarasEvents: IGregEvent[] = [];

    const hijriStartDate = parseHijriDate(hijriRefDate);
    const gregStartDate = moment(gregRefDate);

    const gregEndDate = gregStartDate.clone().add(1, 'year');

    let gregCounterDate = gregStartDate.clone();
    let hijriCounterDate = {...hijriStartDate};

    while (gregCounterDate.isSameOrBefore(gregEndDate)) {
        const hijriEvent = hijriDateIsInList(hijriWarasEvents, hijriCounterDate);
        if (hijriEvent) {
            gregWarasEvents.push({
                date: gregCounterDate.clone(),
                name: hijriEvent.name,
            });
        }

        hijriCounterDate = addDayToHijriDate(hijriCounterDate);
        gregCounterDate.add(1, 'day');
    }

    const icsEvents = gregWarasEvents.map<ics.EventAttributes>(event => {
        const date = event.date;
        return {
            start: [date.year(), date.month() + 1, date.clone().add(-1, 'day').date(), 18, 0],
            startInputType: 'local',
            end: [date.year(), date.month() + 1, date.date(), 18, 0],
            endInputType: 'local',
            title: event.name,
            alarms: [
                {
                    action: 'display',
                    trigger: {
                        before: true,
                        minutes: alarmMinutes,
                    },
                },
            ],
        };
    });

    writeFileSync(outFilename, ics.createEvents(icsEvents).value);

})();