import {MongoEntity} from "./mongo-entity";
import {Duration} from "luxon";

export interface Settings extends MongoEntity {
    name: string;
    active: boolean;
    staySignedInTtl: Duration;
}
