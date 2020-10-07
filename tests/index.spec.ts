import { readData, deps, run } from "../src";
import { readFileSync } from "fs";

describe('readData', () => {
    test('when given csv it is parsed correctly', () => {
        const result = readData('tests/waras.test.csv');

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            name: 'Test name',
            date: expect.objectContaining({
                day: 1,
                month: 1,
                year: 1441,
            }),
        });
    });
});

describe('run', () => {
    test('when run should produce correct ics', () => {
        const outFilePath = './tests/waras.test.ics';

        deps.outFilePath = outFilePath;
        deps.inFilePath = './tests/waras.test.csv';

        run();

        const result = readFileSync(outFilePath);
    });
});