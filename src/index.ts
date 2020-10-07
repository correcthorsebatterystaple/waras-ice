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
import { parseHijriDate, findEventsByDate, addDayToHijriDate } from './helpers/hijriDate.helper';

const inFilePath = args['file'] || './assets/waras.csv';
const gregRefDate = args['greg-ref'] || '2020-03-26';
const hijriRefDate = args['hijri-ref'] || '1441-08-02';
const outFilePath = args['out-file'] || args['o'] || './result.ics';
const alarmMinutes = args['alarm-minutes'] || 10;
const years = args['years'] || 1;
const [eventStartHour, eventStartMinute] = args['event-start-time']?.split('-') || [18, 0];
const [eventEndHour, eventEndMinute] = args['event-end-time']?.split('-') || [18, 0];

const debug = args['debug'] || false;

export const deps = {
    inFilePath: inFilePath,
    gregRefDate: gregRefDate,
    hijriRefDate: hijriRefDate,
    outFilePath: outFilePath,
    alarmMinutes: alarmMinutes,
    years: years,
    eventStartHour: eventStartHour,
    eventEndHour: eventEndHour,
    eventStartMinute: eventStartMinute,
    eventEndMinute: eventEndMinute
};

(() => {
    const errors: string[] = [];

    if (!inFilePath) {
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
    uid: string;
}

export function readData(file: string): IHijriEvent[] {
    const csv = readFileSync(path.resolve(file));

    let data = parse(csv, {
        columns: true,
        trim: true,
    }) as IWarasCsv[];

    return data.map<IHijriEvent>((record) => {
        return {
            name: record.name,
            date: {
                day: parseInt(record.warasDay),
                month: parseInt(record.warasMonth),
                year: parseInt(record.warasYear),
            } as IHijriDate,
            uid: record.uid
        };
    });
}

export function run(): void {
    debug && console.info('Running with following config:', deps);
    const hijriWarasEvents = readData(path.resolve(deps.inFilePath));
    const gregWarasEvents: IGregEvent[] = [];

    const hijriStartDate = parseHijriDate(deps.hijriRefDate);
    const gregStartDate = moment(deps.gregRefDate);

    const gregEndDate = gregStartDate.clone().add(years, 'year');

    let gregCounterDate = gregStartDate.clone();
    let hijriCounterDate = {...hijriStartDate};

    while (gregCounterDate.isSameOrBefore(gregEndDate)) {
        const hijriEvents = findEventsByDate(hijriWarasEvents, hijriCounterDate);

        hijriEvents.forEach(event => {
            gregWarasEvents.push({
                date: gregCounterDate.clone(),
                name: event.name,
                uid: event.uid
            });
        });

        hijriCounterDate = addDayToHijriDate(hijriCounterDate);
        gregCounterDate.add(1, 'day');
    }

    debug && console.log('gregWarasEvents', gregWarasEvents);

    const icsEvents = gregWarasEvents.map<ics.EventAttributes>(event => {
        const date = event.date;
        const startDate = date.clone().add(-1, 'day');
        return {
            start: [startDate.year(), startDate.month() + 1, startDate.date(), deps.eventStartHour, deps.eventStartMinute],
            startInputType: 'local',
            end: [date.year(), date.month() + 1, date.date(), deps.eventEndHour, deps.eventEndMinute],
            endInputType: 'local',
            title: event.name,
            alarms: [
                {
                    action: 'display',
                    trigger: {
                        before: true,
                        minutes: deps.alarmMinutes,
                    },
                },
            ],
            uid: event.uid+ '-' + startDate.year(),
        };
    });


    writeFileSync(deps.outFilePath, ics.createEvents(icsEvents).value);
}

run();