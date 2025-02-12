import {Injectable} from "../../utilities/injectable";
import {DataService} from "../../utilities/data.service";
import {MongoConnector} from "../../utilities/mongoConnector";
import {Settings} from "@shared/types/settings.type";
import {Log} from "../../utilities/type";
import {DateTime, Duration} from "luxon";

@Injectable()
export class SettingsService extends DataService<Settings, MongoConnector<Settings>> {

    constructor(
        connector: MongoConnector<Settings>
    ) {
        super("settings", connector);
    }

    public init() {
        this.getAll().then((settings) => {
            if (settings.length === 0) {
                this.create({
                    deleted: false,
                    active: false,
                    createdAt: DateTime.now(),
                    updatedAt: DateTime.now(),
                    name: "default-settings",
                    staySignedInTtl: Duration.fromMillis(14 * 24 * 60 * 60 * 1000)
                }).then(() => {
                    Log.info("Settings table initialized, default settings created");
                });
            }
        });
    }
}