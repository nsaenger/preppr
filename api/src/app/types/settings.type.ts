import {MongoEntity} from "./mongoEntity";

export interface Settings extends MongoEntity {
    name: string;
    active: boolean;
    staySignedInTtl: number;
    currencySymbol: string;
    inputVolumeSymbol: string;
    outputVolumeSymbol: string;
    mailServer: string;
    mailPort: number;
    mailUser: string;
    mailPassword: string;
    mailEnableSSL: boolean;
}
