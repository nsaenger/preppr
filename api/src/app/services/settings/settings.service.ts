import {Injectable} from "../../utilities/injectable";
import {DataService} from "../../utilities/data.service";
import {MongoConnector} from "../../utilities/mongoConnector";
import {Settings} from "../../types/settings.type";
import {Log} from "../../utilities/type";
import moment from "moment";

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
                    active: true,
                    created: moment(),
                    currencySymbol: "€",
                    inputVolumeSymbol: "FM",
                    installationSettings: [],
                    mailEnableSSL: false,
                    mailPassword: "",
                    mailPort: 0,
                    mailServer: "",
                    mailUser: "",
                    modified: moment(),
                    name: "default-settings",
                    outputVolumeSymbol: "m³",
                    staySignedInTtl: 14*24*60*60*1000

                }).then(() => {
                    Log.info("Settings table initialized, default settings created");
                });
            }
        });
    }
}