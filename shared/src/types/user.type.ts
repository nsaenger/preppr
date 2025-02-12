import {MongoEntity} from "./mongo-entity";
import {DateTime} from "luxon";

export interface UserSettings {
    dashboardConfig: any[];
    viewSettings: any[];
}

export interface User extends MongoEntity {
    name: string;
    email: string;
    salt?: string;
    appToken?: string;
    password?: string;
    roles: string[];
    language: string;
    token: string;
    activated: boolean;
    settings: UserSettings;
    passwordResetToken?: string;
    passwordResetValidUntil?: DateTime;
}
