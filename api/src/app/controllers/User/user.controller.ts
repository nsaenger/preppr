import {BaseController, Controller, DataController, Delete, Get, Post, Put, Respond,} from "../../utilities/controller";
import {Request, Response} from 'express';
import {MIDDLEWARE} from "../../application";
import {UserService} from "../../services/user/user.service";
import {User, UserSettings} from "../../types/user.type";
import {STATUS_CODE} from "../../constants/status-codes";
import moment from "moment";
import {AuthorizationService} from "../../services/authorization/authorization.service";


@Controller({
    middlewares: [MIDDLEWARE.AUTH]
})
export class UserController extends DataController<User, UserService> {

    constructor(
        service: UserService,
        private authorizationService: AuthorizationService,
    ) {
        super(service);
    }

    @Get()
    public async getAll(request: Request, response: Response) {
        const users = (await this.service.getAll()).filter(x => this.filter(x));
        Respond({response, data: users});
    }

    @Get({path: '/:id'})
    public async getById(request: Request, response: Response) {
        let id: string = BaseController.getParam(request, "id", null);
        const user = await this.service.getById(id);

        Respond({response, data: user});
    }

    @Post()
    public async create(request: Request, response: Response) {
        const protoUser: User = {...request.body};
        const now = moment();
        const newUser = await this.service.create({
            ...protoUser,
            created: now,
            password: this.authorizationService.hashPassword(protoUser.password, now),
            settings: {
                dashboardConfig: [],
                viewSettings: []
            }
        });

        Respond({response, data: newUser});
    }

    @Put()
    public async update(request: Request, response: Response) {
        let user: User = request.body;

        if (!user) {
            Respond({
                response,
                status: STATUS_CODE.NOT_FOUND,
                data: "Unable to find legacy user with name: " + user.name
            });
            return;
        }

        if (!request.body.password) {
            const oldUser = await this.service.getById(user.id);
            user.password = oldUser.password;
        }

        user = await this.service.update(user);

        Respond({response, data: user});
    }

    @Delete({path: '/:id'})
    public async delete(request: Request, response: Response) {
        const id = BaseController.getParam(request, "id", "");
        await this.service.delete(id);
        Respond({response, data: true});
    }

    public filter(value: User): boolean {
        return !value || !value.isDeleted;
    }

}