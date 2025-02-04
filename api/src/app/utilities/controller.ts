import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { MIDDLEWARE } from '../app';
import { IStatusCode, STATUS_CODE } from '../constants/status-codes';
import { Injector, Instance } from './injector';
import { Type } from './type';

export interface RouteDefinition {
  path: string;
  requestMethod: 'get' | 'post' | 'delete' | 'options' | 'put';
  middleware: MIDDLEWARE;
  methodName: string;
}

export interface ResponseObject {
  response: Response,
  status?: IStatusCode,
  data?: any,
  html?: boolean
}

export const Respond = (responseObject: ResponseObject | Observable<ResponseObject>) => {
  if (responseObject instanceof Observable) {
    responseObject.subscribe({ next: Respond, error: Respond });
    return;
  }

  const response = {
    response: responseObject.response ? responseObject.response : null,
    status: responseObject.status ? responseObject.status : STATUS_CODE.OK,
    data: responseObject.data ? responseObject.data : '',
    html: responseObject.html ? responseObject.html : false,
  };

  if (!response.response) {
    return;
  }

  if (response.html) {
    response.response
      .header({ 'Content-Type': 'text/html; charset=utf-8' })
      .status(response.status.code)
      .send(response.data);
  } else {
    response.response
      .header({ 'Content-Type': 'application/json; charset=utf-8' })
      .status(response.status.code)
      .send(JSON.stringify({
        status: response.status,
        data: response.data,
      }));
  }
};

export abstract class DataController<t, tu, T extends Instance> {

  protected service: T;

  protected constructor(
    protected type: Type<T>,
  ) {
    this.service = Injector.resolve(type);
  }

  public get(request: Request, response: Response): Observable<ResponseObject> {
    return new Observable<ResponseObject>(obs => {

    });
  }

  public getOne(request: Request, response: Response): Observable<ResponseObject> {
    return new Observable<ResponseObject>(obs => {

    });
  }

  public insert(request: Request, response: Response): Observable<ResponseObject> {
    return new Observable<ResponseObject>(obs => {

    });
  }

  public update(request: Request, response: Response): Observable<ResponseObject> {
    return new Observable<ResponseObject>(obs => {

    });
  }

  public delete(request: Request, response: Response): Observable<ResponseObject> {
    return new Observable<ResponseObject>(obs => {

    });
  }
}

export class ControllerInstance implements Instance {
  constructor() {
  }

  public onDestroy?(): void {
  }
}

export function Controller(prefix: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('prefix', prefix, target);
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target);
    }
  };
}

export const Get = (path: string = '/', middleware?: MIDDLEWARE): MethodDecorator => (target, propertyKey: string | symbol): void => {
  if (!Reflect.hasMetadata('routes', target.constructor))
    Reflect.defineMetadata('routes', [], target.constructor);

  Reflect.defineMetadata('routes', Reflect.getMetadata('routes', target.constructor)
      .concat({
        requestMethod: 'get',
        path,
        middleware,
        methodName: propertyKey as string,
      }),
    target.constructor);
};

export const Post = (path: string = '/', middleware?: MIDDLEWARE): MethodDecorator => (target, propertyKey: string | symbol): void => {
  if (!Reflect.hasMetadata('routes', target.constructor)) {
    Reflect.defineMetadata('routes', [], target.constructor);
  }

  Reflect.defineMetadata('routes',
    Reflect.getMetadata('routes', target.constructor).concat({
      requestMethod: 'post',
      path,
      middleware,
      methodName: propertyKey,
    }),
    target.constructor);
};

export const Put = (path: string = '/', middleware?: MIDDLEWARE): MethodDecorator => (target, propertyKey: string | symbol): void => {
  if (!Reflect.hasMetadata('routes', target.constructor)) {
    Reflect.defineMetadata('routes', [], target.constructor);
  }

  Reflect.defineMetadata('routes',
    Reflect.getMetadata('routes', target.constructor).concat({
      requestMethod: 'put',
      path,
      middleware,
      methodName: propertyKey,
    }),
    target.constructor);
};

export const Delete = (path: string = '/', middleware?: MIDDLEWARE): MethodDecorator => (target, propertyKey: string | symbol): void => {
  if (!Reflect.hasMetadata('routes', target.constructor)) {
    Reflect.defineMetadata('routes', [], target.constructor);
  }

  Reflect.defineMetadata('routes',
    Reflect.getMetadata('routes', target.constructor).concat({
      requestMethod: 'delete',
      path,
      middleware,
      methodName: propertyKey,
    }),
    target.constructor);
};

export const Options = (path: string = '/', middleware?: MIDDLEWARE): MethodDecorator => (target, propertyKey: string | symbol): void => {
  if (!Reflect.hasMetadata('routes', target.constructor)) {
    Reflect.defineMetadata('routes', [], target.constructor);
  }

  Reflect.defineMetadata('routes',
    Reflect.getMetadata('routes', target.constructor).concat({
      requestMethod: 'options',
      path,
      middleware,
      methodName: propertyKey,
    }),
    target.constructor);
};
