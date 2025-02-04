import {Moment} from "moment";
import {MongoEntity} from "./mongoEntity";

export interface UserSettings {
    dashboardConfig: any[];
    viewSettings: any[];
}

export interface User extends MongoEntity {
    isDeleted: boolean;
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
    passwordResetValidUntil?: Moment;
}
