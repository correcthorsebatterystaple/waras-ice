import parse from 'csv-parse/lib/sync';
import path from 'path';
import moment, { Moment } from 'moment';
import args from 'minimist-argv';
import 'colors';
import * as ics from 'ics';
import { readFileSync, writeFileSync } from 'fs';
import { IHijriEvent } from './models/hijriEvent.model';
import { IHijriDate } from './models/hijriDate.model';
import { IGregEvent } from './models/gregEvent.model';
import { parseHijriDate, findEventByDate, addDayToHijriDate } from './helpers/hijriDate.helper';

const filename = args['file'] || './assets/waras.csv';
const gregRefDate = args['greg-ref'] || '2020-03-26';
const hijriRefDate = args['hijri-ref'] || '1441-08-02';
const outFilename = args['out-file'] || args['o'] || './waras.ics';
const alarmMinutes = args['alarm-minutes'] || 10;
const years = args['years'] || 1;
const [eventStartHour, eventStartMinute] = args['event-start-time']?.split('-') || [18, 0];
const [eventEndHour, eventEndMinute] = args['event-end-time']?.split('-') || [18, 0];

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
interface IWarasCsv {
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
    }) as IWarasCsv[];

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

function run(): void {
    const hijriWarasEvents = readData(path.resolve(filename));
    const gregWarasEvents: IGregEvent[] = [];

    const hijriStartDate = parseHijriDate(hijriRefDate);
    const gregStartDate = moment(gregRefDate);

    const gregEndDate = gregStartDate.clone().add(years, 'year');

    let gregCounterDate = gregStartDate.clone();
    let hijriCounterDate = {...hijriStartDate};

    while (gregCounterDate.isSameOrBefore(gregEndDate)) {
        const hijriEvent = findEventByDate(hijriWarasEvents, hijriCounterDate);
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
        const startDate = date.clone().add(-1, 'day');
        return {
            start: [startDate.year(), startDate.month() + 1, startDate.date(), eventStartHour, eventStartMinute],
            startInputType: 'local',
            end: [date.year(), date.month() + 1, date.date(), eventEndHour, eventEndMinute],
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
}

run();