import { IHijriDate } from './hijriDate.model';

export interface IHijriEvent {
    name: string;
    date: IHijriDate;
    uid: string;
}