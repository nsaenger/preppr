import {DateTime} from "luxon";

export interface MongoEntity {
    _id?: string;
    deleted: boolean;
    createdAt: DateTime;
    updatedAt: DateTime;
}