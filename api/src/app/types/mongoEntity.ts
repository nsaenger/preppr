import {Moment} from "moment/moment";

export interface MongoEntity {
    id?: string;
    created?: Moment;
    modified?: Moment;
}