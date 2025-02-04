import {Injectable} from "../../utilities/injectable";
import {Instance} from "../../utilities/injector";
import {Request, Response} from 'express';
import * as crypto from "node:crypto";
import {UserService} from "../user/user.service";
import moment, {Moment} from "moment";
import {RedisConnector} from "../../utilities/redisConnector";

@Injectable()
export class AuthorizationService implements Instance {

    constructor(
        private userService: UserService,
        private redisConnector: RedisConnector<{key: string, value: string}>
    ) { }

    public init() {

    }

    public onDestroy(): void {
    }

    public hashPassword(password: string, ts: Moment): string {
        const salt = ts.toISOString();
        return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    }

    public async authorizeUserAndPassword(username: string, password: string): Promise<{ authId: string, authToken: string }> {
        if (username && password) {
            const user = await this.userService.findOne("name = ?", [username]).then((user) => {
                const pwHash = this.hashPassword(password, user.created);
                return pwHash === user.password ? user : null;
            }).catch((err) => null);

            if (!user)
                return null;

            const hash = crypto.createHash('sha256')
                .update(user.name + moment().toISOString())
                .digest('hex');

            // Cancel other sessions
            const authToken = await this.redisConnector.getById(null, user.id);
            if (authToken)
                await this.redisConnector.delete(null, authToken.key);

            // Create new session
            this.redisConnector.create(null, {key: user.id, value: hash}).then();

            // Return session
            return {authId: user.id, authToken: hash};
        }
    }

    public async authorized(request: Request, response: Response) {
        const authId = request.headers["auth-id"] as string;
        const authToken = request.headers["auth-token"] as string;

        if (authId && authToken) {
            const user = await this.userService.getById(authId);

            if (!user) return false;

            const dbAuthToken = await this.redisConnector.getById(null, user.id);
            if (dbAuthToken && dbAuthToken.value == authToken) {
                request.user = user;
                return true;
            }
        }

        return false;
    }
}
