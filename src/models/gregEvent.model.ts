import { Moment } from 'moment';

export interface IGregEvent {
    name: string;
    date: Moment;
    uid: string;
}