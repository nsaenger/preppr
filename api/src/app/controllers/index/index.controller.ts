import 'reflect-metadata';
import {Request, Response} from "express";
import {BaseController, Controller, Get, Respond} from "../../utilities/controller";
import {TimeSpan} from "../../utilities/time-span.class";
import {MIDDLEWARE} from "../../application";
import * as process from "node:process";

export interface Uptime {
    hours: number;
    minutes: number;
    seconds: number;
    millis: number;
}

export interface PingResponse {
    version: string;
    uptime: Uptime;
}

@Controller({
    prefix: '/',
    middlewares: [MIDDLEWARE.NO_AUTH]
})
export class IndexController extends BaseController {

    constructor() {
        super();
    }

    @Get()
    public index(request: Request, response: Response) {
        const uptime = TimeSpan.fromSeconds(process.uptime());
        const pingResponse = {
            version: process.env.npm_package_version ?? "1.0.0",
            uptime: {
                hours: uptime.hours,
                minutes: uptime.minutes,
                seconds: uptime.seconds,
                millis: uptime.milliseconds
            }
        }
        Respond({response, data: pingResponse});
    }

    @Get({
        path: '/ping'
    })
    public ping(request: Request, response: Response) {
        const uptime = TimeSpan.fromSeconds(process.uptime());
        const pingResponse: PingResponse = {
            version: process.env.npm_package_version ?? "3.0.0",
            uptime: {
                hours: uptime.hours,
                minutes: uptime.minutes,
                seconds: uptime.seconds,
                millis: uptime.milliseconds
            }
        }
        Respond({response, data: pingResponse});
    }
}
