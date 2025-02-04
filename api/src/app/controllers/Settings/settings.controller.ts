import {BaseController, Controller, Delete, Get, Post, Put, Respond,} from "../../utilities/controller";
import {Request, Response} from 'express';
import {MIDDLEWARE} from "../../application";
import {Injector} from "../../utilities/injector";
import {SettingsService} from "../../services/settings/settings.service";


@Controller({
    middlewares: [MIDDLEWARE.AUTH]
})
export class SettingsController extends BaseController {

    private service: SettingsService;

    constructor() {
        super();

        this.service = Injector.resolve<SettingsService>(SettingsService);
    }

    @Get()
    public async getAll(request: Request, response: Response) {
        Respond({response, data: await this.service.getAll()});
    }

    @Get({path: '/:id'})
    public async getById(request: Request, response: Response) {
        let id = BaseController.getParam(request, "id", null);
        Respond({response, data: await this.service.getById(id)});
    }

    @Post()
    public async create(request: Request, response: Response) {
        let settings = request.body;
        Respond({response, data: await this.service.create(settings)});
    }

    @Put()
    public async update(request: Request, response: Response) {
        let settings = request.body;
        Respond({response, data: await this.service.update(settings)});
    }

    @Delete({path: '/:id'})
    public async delete(request: Request, response: Response) {
        let id = BaseController.getParam(request, "id", null);
        Respond({response, data: await this.service.delete(id)});
    }

}