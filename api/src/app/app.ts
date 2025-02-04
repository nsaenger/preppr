import { Application as ExpressApplication, Response, Request } from 'express';
import { STATUS_CODE } from './constants/status-codes';
import { Controllers } from './controllers';
import { Respond, RouteDefinition } from './utilities/controller';
import { Injectable } from './utilities/injectable';
import { Injector, Instance } from './utilities/injector';
import bodyParser = require('body-parser');
import cors = require('cors');

export const enum MIDDLEWARE {
  AUTH
}

@Injectable()
export class App implements Instance {

  private exiting = false;
  private process: NodeJS.Process = process;
  private express: ExpressApplication = null;

  public constructor() {
    console.info('constructing application');
  }

  public async init(express: ExpressApplication, process: NodeJS.Process) {
    console.info('initializing application');

    this.process = process;
    this.bindProcessEvents();

    this.express = express;

    this.middleware();
    this.routes();
  }

  public shutdown() {
    console.info('shutting down');
    if (!this.exiting) {
      this.exiting = true;
      Injector
        .getAll()
        .map(instance => {
          if (typeof (instance.onDestroy) === 'function') {
            instance.onDestroy();
          }
        });
      console.info('instances gracefully stopped');
    }

    this.process.off('exit', this.onInterrupt.bind(this));
    this.process.off('SIGINT', this.onInterrupt.bind(this));
    this.process.off('SIGTERM', this.onInterrupt.bind(this));
    this.process.off('SIGUSR1', this.onInterrupt.bind(this));
    this.process.off('SIGUSR2', this.onInterrupt.bind(this));

    console.info('shutdown complete');
    this.process.exit();
  }

  private middleware() {
    console.info('loading middleware');
    this.express.use(cors());

    this.express.use(bodyParser.urlencoded({
      extended: false,
      limit: '4gb',
    }));
    this.express.use(bodyParser.json({ limit: '4gb' }));
    this.express.use(bodyParser.text({ limit: '4gb' }));
  }

  private routes() {
    Controllers.forEach(controller => {
      const instance = Injector.resolve(controller);
      const prefix = Reflect.getMetadata('prefix', controller);
      const routes: RouteDefinition[] = Reflect.getMetadata('routes', controller);

      routes.forEach(route => {
        this.express[route.requestMethod](
          // Route
          (prefix + route.path).replace(/\/\//g, '/'),

          // Middleware
          (request: any, response, next) => this.getMiddlewareFn(route.middleware, request, response, next),

          // ControllerFn
          // @ts-ignore
          (request: any, response, next) => instance[route.methodName](request, response, next),
        );
      });
    });

    this.express.all('**', (request: Request, response: Response) =>
      Respond({
        response: response,
        status: STATUS_CODE.NOT_FOUND,
        data: `Path not found: ${ request.method }:${ request.path }`,
      }));

    console.info('application started');
  }

  private bindProcessEvents() {
    this.process.on('exit', this.onInterrupt.bind(this));
    this.process.on('SIGINT', this.onInterrupt.bind(this));
    this.process.on('SIGTERM', this.onInterrupt.bind(this));
    this.process.on('SIGUSR1', this.onInterrupt.bind(this));
    this.process.on('SIGUSR2', this.onInterrupt.bind(this));
  }

  private onInterrupt() {
    console.error('SIGUSR2');
    this.shutdown();
  }

  private getMiddlewareFn(middleware: MIDDLEWARE, request: Request, response: Response, next: Function) {
    switch (middleware) {
      case MIDDLEWARE.AUTH:
        return;
      default:
        next();
        return;
    }
  }

  public onDestroy(): void {
    this.shutdown();
  }
}
