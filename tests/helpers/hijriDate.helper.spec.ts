import { parseHijriDate, addDayToHijriDate, areHijriDatesEqual, findEventsByDate } from "../../src/helpers/hijriDate.helper";
import { IHijriDate } from "../../src/models/hijriDate.model";
import { IHijriEvent } from "../../src/models/hijriEvent.model";

describe('parseHijriDate', () => {
    test('when correctly formatted date is entered', () => {
        const result = parseHijriDate('1441-01-01');

        expect(result).toMatchObject({
            year: 1441,
            month: 1,
            day: 1,
        });
    });

    test('when day is greater than days in month', () => {
        const result = () => parseHijriDate('1441-08-30');
        expect(result).toThrowError();
    });

    test('when month is greater than 12', () => {
        const result = () => parseHijriDate('1441-13-29');
        expect(result).toThrowError();
    });

    test('when format is invalid', () => {
        const results = [
            () => parseHijriDate('invalid'),
            () => parseHijriDate('01-01-1441'),
            () => parseHijriDate('1441-1-1'),
            () => parseHijriDate('1441/01/01'),
        ];

        for (const result of results) {
            expect(result).toThrowError();
        }
    });
});

describe('addDayToHijriDate', () => {
    test('when add day without month or year change', () => {
        const date: IHijriDate = {
            year: 1441,
            month: 1,
            day: 1,
        };

        const result = addDayToHijriDate(date);

        expect(result).toMatchObject({
            year: 1441,
            month: 1,
            day: 2,
        });
    });

    test('when add day with month change', () => {
        const date: IHijriDate = {
            year: 1441,
            month: 1,
            day: 30,
        };

        const result = addDayToHijriDate(date);

        expect(result).toMatchObject({
            year: 1441,
            month: 2,
            day: 1,
        });
    });

    test('when add day with year change', () => {
        const date: IHijriDate = {
            year: 1441,
            month: 12,
            day: 29,
        };

        const result = addDayToHijriDate(date);

        expect(result).toMatchObject({
            year: 1442,
            month: 1,
            day: 1,
        });
    });
});

describe('areHijriDatesEqual', () => {
    test('when dates are equal', () => {
        const date1: IHijriDate = {
            day: 1,
            month: 1,
            year: 1441,
        };
        const date2: IHijriDate = {
            day: 1,
            month: 1,
            year: 1441,
        };

        const result = areHijriDatesEqual(date1, date2);

        expect(result).toBe(true);
    });

    test('when only day is unequal', () => {
        const date1: IHijriDate = {
            day: 2,
            month: 1,
            year: 1441,
        };
        const date2: IHijriDate = {
            day: 1,
            month: 1,
            year: 1441,
        };

        const result = areHijriDatesEqual(date1, date2);

        expect(result).toBe(false);
    });

    test('when only month is unequal', () => {
        const date1: IHijriDate = {
            day: 1,
            month: 2,
            year: 1441,
        };
        const date2: IHijriDate = {
            day: 1,
            month: 1,
            year: 1441,
        };

        const result = areHijriDatesEqual(date1, date2);

        expect(result).toBe(false);
    });

    test('when only year is unequal', () => {
        const date1: IHijriDate = {
            day: 1,
            month: 1,
            year: 1442,
        };
        const date2: IHijriDate = {
            day: 1,
            month: 1,
            year: 1441,
        };

        const result = areHijriDatesEqual(date1, date2);

        expect(result).toBe(true);
    });
});

describe('hijriDateIsInList', () => {
    test('when date is in list', () => {
        const list: IHijriEvent[] = [
            {
                name: 'test',
                date: {
                    day: 1,
                    month: 1,
                    year: 1441,
                },
                uid: 'Some uuid'
            }
        ];
        const date: IHijriDate = {
            day: 1,
            month: 1,
            year: 1441,
        };

        const result = findEventsByDate(list, date);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            name: 'test',
            date: expect.objectContaining({
                day: 1,
                month: 1,
                year: 1441,
            }),
            uid: 'Some uuid'
        });
    });

    test('when date is not in list', () => {
        const list: IHijriEvent[] = [
            {
                name: 'test',
                date: {
                    day: 1,
                    month: 5,
                    year: 1441,
                },
                uid: 'Some uuid'
            }
        ];
        const date: IHijriDate = {
            day: 1,
            month: 1,
            year: 1441,
        };

        const result = findEventsByDate(list, date);

        expect(result).toHaveLength(0);
    });

    test.todo('find all events corresponding to date');
});