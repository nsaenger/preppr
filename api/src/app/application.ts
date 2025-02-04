import {Application as ExpressApplication, NextFunction, Request, Response} from 'express';
import Express = require('express');
import {STATUS_CODE} from './constants/status-codes';
import {Controllers} from './controllers';
import {ApiException, ControllerInstance, Respond, RouteDefinition} from './utilities/controller';
import {Injectable} from './utilities/injectable';
import {Injector, Instance} from './utilities/injector';
import {AuthorizationService} from "./services/authorization/authorization.service";
import {Log} from "./utilities/type";

import swagger from "./swagger";
import bodyParser = require('body-parser');
import cors = require('cors');
import {UserService} from "./services/user/user.service";
import {MongoConnector} from "./utilities/mongoConnector";
import {SettingsService} from "./services/settings/settings.service";


/**
 * Enum representing different types of middleware roles.
 *
 * This enum is used to define and control access levels or roles
 * within the application through middleware functions.
 *
 * AUTH: Represents a middleware that requires standard authentication.
 * AUTH_SUPERADMIN: Represents a middleware that requires super-admin level authentication.
 * NO_AUTH: Represents a middleware that does not require authentication to access.
 */
export const enum MIDDLEWARE {
    AUTH,
    AUTH_SUPERADMIN,
    NO_AUTH,
}


/**
 * Application class serves as the main entry point to initialize and manage
 * the server application lifecycle. It includes the initialization of services,
 * middleware, and routes, as well as handling graceful shutdowns.
 */
@Injectable()
export class Application implements Instance {

    private exiting = false;
    private process: NodeJS.Process = process;
    private express: ExpressApplication = null;

    public constructor(
        private mongoConnector: MongoConnector<any>,
        private authorizationService: AuthorizationService,
        private userService: UserService,
        private settingsService: SettingsService,
    ) {
    }


    /**
     * Initializes the application by setting up the necessary services, middlewares, and controllers.
     *
     * @param {ExpressApplication} express - The Express application instance to be used.
     * @param {NodeJS.Process} process - The Node.js process instance for handling system-level events.
     * @return {Promise<void>} A promise that resolves once the application initialization is complete.
     */
    public async init(express: ExpressApplication, process: NodeJS.Process): Promise<void> {
        Log.info('Starting application');

        this.process = process;
        this.express = express;

        this.bindProcessEvents();

        Log.info('\t...starting services');
        await this.mongoConnector.init();
        this.userService.init();
        this.authorizationService.init();
        this.settingsService.init();

        Log.info('\t...serving documentation');
        this.express.use(Express.static('docs'))

        Log.info('\t...loading middlewares');
        this.middleware();

        Log.info("\t...loading controllers")
        this.routes();


        Log.info('application started!');
    }


    /**
     * Shuts down the application gracefully by stopping all instances that implement the onDestroy method
     * and removing all process interrupt listeners. Finally, it exits the process.
     *
     * @return {void} This method does not return any value.
     */
    public shutdown(): void {
        Log.info('shutting down');
        if (!this.exiting) {
            this.exiting = true;
            Injector
                .getAll()
                .map(instance => {
                    if (typeof (instance.onDestroy) === 'function') {
                        instance.onDestroy();
                    }
                });
            Log.info('instances gracefully stopped');
        }

        this.process.off('exit', this.onInterrupt.bind(this));
        this.process.off('SIGINT', this.onInterrupt.bind(this));
        this.process.off('SIGTERM', this.onInterrupt.bind(this));
        this.process.off('SIGUSR1', this.onInterrupt.bind(this));
        this.process.off('SIGUSR2', this.onInterrupt.bind(this));

        Log.info('shutdown complete');
        this.process.exit();
    }


    /**
     * Method that is triggered when the component or service is being destroyed.
     * It performs necessary cleanup operations, such as shutting down ongoing processes.
     *
     * @return {void} Does not return a value.
     */
    public onDestroy(): void {
        this.shutdown();
    }


    /**
     * Configures the middleware for the Express application.
     *
     * This method adds the following middleware to the Express app:
     * - Logging middleware that tracks request start time and logs information about non-OPTIONS and non-ping requests after finishing.
     * - CORS middleware to define allowed and exposed headers for Cross-Origin Resource Sharing.
     * - Body parser middleware to handle urlencoded, JSON, and text payloads with a limit of 4GB.
     *
     * @return {void} This method does not return a value.
     */
    private middleware(): void {
        this.express.use((request: Request, response: Response, next: NextFunction) => {
            request.startTime = Date.now();

            const logRequest = (response: Response) => {
                const responseTime = Date.now() - request.startTime;

                if (request.path !== "/pixel/online" && request.method !== "OPTIONS" && request.path !== "/ping")
                    Log.info(response.statusCode, request.method, request.path, responseTime + 'ms');

                response.off('finish', () => logRequest(response));
            }

            response.on('finish', () => logRequest(response));

            next();
        });

        this.express.use(cors({
            allowedHeaders: ['*'],
            exposedHeaders: ['X-Cache-Checksum']
        }));

        this.express.use(bodyParser.urlencoded({
            extended: false,
            limit: '4gb',
        }));
        this.express.use(bodyParser.json({limit: '4gb'}));
        this.express.use(bodyParser.text({limit: '4gb'}));
    }


    /**
     * Configures and initializes all application routes by dynamically registering
     * routes defined in controllers, setting up middleware, and providing error handling.
     *
     * The method performs the following steps:
     * - Serves Swagger API documentation at the `/api-docs` endpoint.
     * - Iterates over all controllers, registering their respective routes based on metadata.
     * - Registers default and route-specific middlewares for each endpoint.
     * - Provides a catch-all route to handle undefined paths, returning a 404 error.
     *
     * @return {void} This method does not return a value. It modifies the express instance by adding routes and middleware.
     */
    private routes(): void {
        // Build and serve swagger documentation (/api-docs)
        swagger(this.express);

        Controllers.forEach((controllerType: typeof ControllerInstance) => {
            const instance = Injector.resolve(controllerType);
            const prefix = Reflect.getMetadata('prefix', controllerType);
            const routes: RouteDefinition[] = Reflect.getMetadata('routes', controllerType);
            const defaultMiddlewares: MIDDLEWARE[] = Reflect.getMetadata('defaultMiddleware', controllerType);

            // Log.info(`Register controller: ${prefix} with routes:`);

            routes.forEach(route => {
                // Log.info(`  [${(route.requestMethod + ']       ').slice(0, 8)} ${(prefix + route.path).replace(/\/\//g, '/')}`);
                this.express[route.requestMethod](
                    // Route
                    (prefix + route.path).replace(/\/\//g, '/'),

                    // Middleware
                    (request: Request, response: Response, next: NextFunction) => this.getMiddlewareFn(defaultMiddlewares.concat(route.middlewares), request, response, next),

                    // ControllerFn
                    // @ts-ignore
                    async (request: Request, response: Response) => {
                        try {
                            await instance[route.methodName](request, response);
                        } catch (error: any) {
                            Log.error(error.message);
                            Respond({response, data: error.message, status: STATUS_CODE.INTERNAL});
                        }
                    }
                );
            });
        });

        this.express.use((request: Request, response: Response) => {
            const error = new ApiException(`Path not found: ${request.method}:${request.path}`, STATUS_CODE.NOT_FOUND)
            Respond({response, status: error.status, data: error.message});
        });

    }


    /**
     * Binds event listeners to process signals to handle interruption or termination events.
     *
     * The method listens to 'exit', 'SIGINT', 'SIGTERM', 'SIGUSR1', and 'SIGUSR2' signals on the process
     * and binds the `onInterrupt` handler to execute appropriate cleanup operations or respond to these events.
     *
     * @return {void} This method does not return any value.
     */
    private bindProcessEvents(): void {
        this.process.on('exit', this.onInterrupt.bind(this));
        this.process.on('SIGINT', this.onInterrupt.bind(this));
        this.process.on('SIGTERM', this.onInterrupt.bind(this));
        this.process.on('SIGUSR1', this.onInterrupt.bind(this));
        this.process.on('SIGUSR2', this.onInterrupt.bind(this));
    }


    /**
     * Handles the interrupt signal (e.g., SIGUSR2) by logging the signal type and initiating the shutdown process.
     *
     * @return {void} Does not return a value.
     */
    private onInterrupt(): void {
        console.error('SIGUSR2');
        this.shutdown();
    }


    /**
     * Processes an array of middleware functions and executes them sequentially for a given request.
     * If certain middleware conditions are not met, it may return an early response and stop further processing.
     *
     * @param {MIDDLEWARE[]} [middlewares=[]] - An array of middleware identifiers to be handled. Defaults to an empty array.
     * @param {Request} request - The HTTP request object.
     * @param {Response} response - The HTTP response object.
     * @param {NextFunction} next - The callback to move to the next middleware or route handler.
     * @return {Promise<void>} - A promise that resolves when all middlewares in the chain are successfully processed or an early response is sent.
     */
    private async getMiddlewareFn(middlewares: MIDDLEWARE[] = [], request: Request, response: Response, next: NextFunction): Promise<void> {
        for (let index = 0; index < middlewares.length; index++) {
            const middleware = middlewares[index];

            switch (middleware) {
                case MIDDLEWARE.AUTH:
                    // Override if NO_AUTH is set
                    if (!middlewares.includes(MIDDLEWARE.NO_AUTH)) {
                        const success = await this.authorizationService.authorized(request, response);
                        if (!success) {
                            Respond({response, status: STATUS_CODE.UNAUTHORIZED});
                            return;
                        }
                    }

                    break;

                default:
                    break;
            }
        }

        next();
    }
}
