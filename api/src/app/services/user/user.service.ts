import {Injectable} from "../../utilities/injectable";
import {DataService} from "../../utilities/data.service";
import {User} from "../../types/user.type";
import {MongoConnector} from "../../utilities/mongoConnector";
import {Log} from "../../utilities/type";
import moment from "moment";
import {AuthorizationService} from "../authorization/authorization.service";

@Injectable()
export class UserService extends DataService<User, MongoConnector<User>> {

    constructor(
        connector: MongoConnector<User>,
        private authorizationService: AuthorizationService,
    ) { super("users", connector); }

    public init() {
        this.getAll().then((users) => {
            const admin = users.find(x => x.name === "admin");
            if (users.length === 0 || !admin) {
                const now = moment();
                this.create({
                    isDeleted: false,
                    name: "admin",
                    activated: true,
                    email: "admin@preppr",
                    language: "en-GB",
                    roles: ["role.default.admin"],
                    settings: {
                        dashboardConfig: [],
                        viewSettings: []
                    },
                    token: "",
                    password: this.authorizationService.hashPassword("admin", now),
                    created: now,
                    modified: moment()
                }).then(() => {
                    Log.info("User table initialized, admin user created");
                });
            }
        });
    }

    public sanitize(data: User, skip: boolean = false): User {
        if (!!data?.salt)
            delete data.salt;

        if (!!data?.password)
            delete data.password;

        return data;
    }
}