import {Injectable} from "../../utilities/injectable";
import {Instance} from "../../utilities/injector";
import {Request, Response} from 'express';
import * as crypto from "node:crypto";
import {UserService} from "../user/user.service";
import {RedisConnector} from "../../utilities/redisConnector";
import {HashPassword} from "../../utilities/dataUtils";
import {DateTime} from "luxon";

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



    public async authorizeUserAndPassword(username: string, password: string): Promise<{ authId: string, authToken: string }> {
        if (username && password) {
            const user = await this.userService.findOne("name = ?", [username]).then((user) => {
                const pwHash = HashPassword(password, user.createdAt);
                return pwHash === user.password ? user : null;
            }).catch((err) => null);

            if (!user)
                return null;

            const hash = crypto.createHash('sha256')
                .update(user.name + DateTime.now().toString())
                .digest('hex');

            // Cancel other sessions
            const authToken = await this.redisConnector.getById(null, user._id);
            if (authToken)
                await this.redisConnector.delete(null, authToken.key);

            // Create new session
            this.redisConnector.create(null, {key: user._id, value: hash}).then();

            // Return session
            return {authId: user._id, authToken: hash};
        }
    }

    public async authorized(request: Request, response: Response) {
        const authId = request.headers["auth-id"] as string;
        const authToken = request.headers["auth-token"] as string;

        if (authId && authToken) {
            const user = await this.userService.getById(authId);

            if (!user) return false;

            const dbAuthToken = await this.redisConnector.getById(null, user._id);
            if (dbAuthToken && dbAuthToken.value == authToken) {
                request.user = user;
                return true;
            }
        }

        return false;
    }
}
