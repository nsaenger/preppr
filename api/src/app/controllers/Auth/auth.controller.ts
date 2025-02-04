import {BaseController, Controller, Delete, Post, Respond,} from "../../utilities/controller";
import {Request, Response} from 'express';
import {MIDDLEWARE} from "../../application";
import {UserService} from "../../services/user/user.service";
import {Injector} from "../../utilities/injector";
import {STATUS_CODE} from "../../constants/status-codes";
import {AuthorizationService} from "../../services/authorization/authorization.service";

@Controller({
    middlewares: [MIDDLEWARE.NO_AUTH]
})
export class AuthController extends BaseController {

    private userSettingsService: UserService;
    private authorizationService: AuthorizationService;

    constructor() {
        super();

        this.userSettingsService = Injector.resolve<UserService>(UserService);
        this.authorizationService = Injector.resolve<AuthorizationService>(AuthorizationService);
    }

    @Post()
    public async Login(request: Request, response: Response) {
        const body = request.body;

        if (body.username && body.password) {
            const authToken = await this.authorizationService.authorizeUserAndPassword(body.username, body.password);

            if (authToken) {
                const user = await this.userSettingsService.getById(authToken.authId);
                user.token = authToken.authToken;
                Respond({response, data: user});
            } else
                Respond({
                    response,
                    status: STATUS_CODE.UNAUTHORIZED,
                    data: {error: "UNKNOWN_USERNAME_OR_PASSWORD", data: body}
                });
        } else {
            Respond({response, status: STATUS_CODE.UNAUTHORIZED, data: "MISSING_USERNAME_OR_PASSWORD"});
        }
    }

    @Delete()
    public async Logout(request: Request, response: Response) {
        Respond({response, data: true});
    }
}