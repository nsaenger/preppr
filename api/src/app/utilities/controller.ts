import {Request, Response} from 'express';
import {Observable} from 'rxjs';
import {IStatusCode, STATUS_CODE} from '../constants/status-codes';
import {Injector, Instance} from './injector';
import {MIDDLEWARE} from "../application";
import stream from "stream";
import {GenericClassDecorator, Log, Type} from "./type";
import {SortFn} from "./dataUtils";
import {hash} from "@konfirm/checksum";
import {TimeSpan} from "./time-span.class";
import _ from "lodash";
import {DataService} from "./data.service";
import {MongoEntity} from "@shared/types/mongo-entity";
import {DateTime} from "luxon";

/**
 * Represents a route definition for mapping HTTP requests in an application.
 *
 * This interface is used to define the essential properties for a route,
 * including its path, HTTP method, associated middlewares, and the method
 * name in the application's controller or handler that will execute when the route is accessed.
 *
 * The `path` property specifies the URL path for the route.
 * The `requestMethod` defines the HTTP method like GET, POST, DELETE, OPTIONS, or PUT.
 * The `middlewares` are an array of functions that will be executed before the main route handler.
 * The `methodName` indicates the name of the method in the controller that will handle the request.
 */
export interface RouteDefinition {
    path: string;
    requestMethod: 'get' | 'post' | 'delete' | 'options' | 'put';
    middlewares: MIDDLEWARE[];
    methodName: string;
}

/**
 * An enumeration representing the different types of responses.
 *
 * This enumeration is commonly used to define the format or type in which
 * a response will be handled or returned within a system or application.
 *
 * Members:
 * - `JSON`: Represents a response format in JSON.
 * - `HTML`: Represents a response format in HTML.
 * - `RAW`: Represents a raw response without specific formatting.
 * - `STREAM`: Represents response data in a streaming format.
 */
export enum RESPONSE_TYPE {
    JSON, HTML, RAW, STREAM
}

/**
 * Interface representing a structured response object.
 *
 * @interface ResponseObject
 *
 * @property response The primary response object containing the server's response. Must be of type `Response`.
 * @property status Optional status information, typically representing the HTTP status code. Must be of type `IStatusCode`.
 * @property data Optional payload or body data returned from the server. Can be any valid JavaScript type.
 * @property stream Optional readable stream, allowing for data to be read in chunks, typically for large responses.
 * @property type Optional response type indicating the nature or format of the response. Must be of type `RESPONSE_TYPE`.
 * @property header Optional object representing HTTP headers as key-value pairs.
 */
export interface ResponseObject {
    response: Response,
    status?: IStatusCode,
    data?: any,
    stream?: NodeJS.ReadableStream,
    type?: RESPONSE_TYPE,
    header?: { [key: string]: string }
}

/**
 * Recursively flattens and processes an object by evaluating its properties
 * and modifying them based on specific conditions. This function handles nested
 * objects, removes function properties, converts moment objects to native Date objects,
 * and leaves other primitive types as-is.
 *
 * @param {any} data - The input data to be flattened and processed. Expected to be
 * an object, but non-object data will be returned as-is.
 * @returns {any} - The processed data object, with all nested structures flattened and
 * modifications applied. Non-object inputs are returned unchanged.
 */
export const FlattenObject = (data: any): any => {
    if (!data || typeof data !== "object")
        return data;

    Object.keys(data).forEach(key => {
        if (data[key] === undefined || data[key] === null) return

        if (typeof data[key] === 'object') {
            data[key] = FlattenObject(data[key]);
        } else if (typeof data[key] === 'function') {
            delete data[key];
        }
    });

    return data;
}

/**
 * Handles the response object or an observable that emits a response object.
 *
 * This function processes either a `ResponseObject` or an observable of `ResponseObject` to send or construct
 * an HTTP response. It handles different response types such as JSON, HTML, RAW, and STREAM based on the
 * provided `ResponseObject.type`. The function also sets appropriate headers, status codes, and formats data
 * before sending the response to the client.
 *
 * If the input is an observable, it subscribes to the observable and recursively invokes itself to process
 * emitted values or handle errors.
 *
 * The function ensures default values for headers, response status, response type, and data if not provided
 * explicitly in the `ResponseObject`.
 *
 * Response Types:
 * - `RESPONSE_TYPE.JSON`: Sends a JSON response with a default `Content-Type` header (`application/json; charset=utf-8`).
 * - `RESPONSE_TYPE.HTML`: Sends an HTML response with a default `Content-Type` header (`text/html; charset=utf-8`).
 * - `RESPONSE_TYPE.RAW`: Sends raw data but requires `response.header` to be set.
 * - `RESPONSE_TYPE.STREAM`: Streams data to the client but requires `response.stream` to be set.
 *
 * @param {ResponseObject | Observable<ResponseObject>} responseObject - The response object or an observable emitting a response object.
 *
 * @throws Will throw an error if:
 * - `RESPONSE_TYPE.RAW` is used without `response.header`.
 * - `RESPONSE_TYPE.STREAM` is used without `response.stream`.
 */
export const Respond = (responseObject: ResponseObject | Observable<ResponseObject>) => {
    if (responseObject instanceof Observable) {
        responseObject.subscribe({next: Respond, error: Respond});
        return;
    }

    const response: ResponseObject = {
        response: responseObject.response,
        status: responseObject.status ?? STATUS_CODE.OK,
        data: responseObject.data ?? {},
        stream: responseObject.stream ?? null,
        type: responseObject.type ?? RESPONSE_TYPE.JSON,
        header: responseObject.header ?? null

    };

    if (!response.response) {
        return;
    }

    if (response.header !== null) {
        for (const header of Object.keys(response.header)) {
            response.response.append(header, response.header[header]);
        }
    }

    switch (response.type) {
        default:
        case RESPONSE_TYPE.JSON:
            response.response
                .append('Content-Type', 'application/json; charset=utf-8')
                .status(response.status.code)
                .send(JSON.stringify(response.data));
            break;

        case RESPONSE_TYPE.HTML:
            response.response
                .append('Content-Type', 'text/html; charset=utf-8')
                .status(response.status.code)
                .send(response.data);
            break;

        case RESPONSE_TYPE.RAW:
            if (!response.header)
                throw "RESPONSE_TYPE.RAW requires response.headers to be set!";


            response.response
                .status(response.status.code)
                .send(response.data);
            break;

        case RESPONSE_TYPE.STREAM:
            if (!response.header)
                throw "RESPONSE_TYPE.STREAM obviously requires response.stream to be set!";


            const ps = new stream.PassThrough();
            stream.pipeline(response.stream, ps, (err) => {
                if (err) Log.error(err);
                return response.response.sendStatus(400);
            });
            ps.pipe(response.response);
            break;
    }
};

/**
 * Represents a custom exception for API-related errors.
 * This class extends the built-in Error class and includes
 * additional functionality for handling HTTP status codes.
 *
 * @class ApiException
 * @extends {Error}
 *
 * @param {string} message - The error message that describes the exception.
 * @param {IStatusCode} [status=STATUS_CODE.INTERNAL] - The HTTP status code associated with the error.
 */
export class ApiException extends Error {
    constructor(message: string, public status: IStatusCode = STATUS_CODE.INTERNAL) {
        super(message);
    }
}

/**
 * The `ControllerInstance` class represents an implementation of the `Instance` interface.
 * It provides the ability to define a controller that can include optional lifecycle methods.
 *
 * The class may optionally include the `onDestroy` method, which is invoked to handle cleanup
 * or teardown logic when the instance is destroyed.
 *
 * This design allows extending classes or implementations to define specific behaviors for
 * the `onDestroy` lifecycle hook.
 *
 * Implements:
 * - `Instance`: Interface to be implemented by the `ControllerInstance` class.
 *
 * Methods:
 * - `onDestroy?`: Optional. A method to define custom clean-up or shutdown logic when the
 *   controller instance is destroyed. It is invoked automatically at the appropriate lifecycle stage.
 */
export class ControllerInstance implements Instance {
    public onDestroy?(): void {
    }
}

/**
 * Abstract class representing a base controller with commonly used methods for handling requests and parameters.
 * This class extends the ControllerInstance and provides utility methods for parameter retrieval and parsing.
 */
export abstract class BaseController extends ControllerInstance {

    /***
     * @param request {Express.Request}
     * @param key {string}
     * @param defaultValue {T}
     * @return {T}
     * @description
     *  Tries to get parameter specified by key from requests route parameters. If the parameter is not found in the
     *  request, the default value will be returned.
     */
    static getParam<T extends DateTime | string | number | boolean>(request: Request, key: string, defaultValue: T): T {
        const paramMap = request.params;
        if (paramMap[key] === undefined) {
            return defaultValue;
        }

        if (defaultValue instanceof DateTime) {
            const date = DateTime.fromISO(paramMap[key]);

            if (date.isValid)
                return date as T;

            throw new ApiException(`Invalid date format: ${paramMap[key]}. Suggested format: ISO8601`, STATUS_CODE.BAD_REQUEST);
        }

        return paramMap[key] as T;
    }

    /**
     * Retrieves and parses the "id" parameter from the given request object.
     *
     * @param {Request} request - The request object containing parameters.
     * @param {boolean} [shouldThrow=true] - Determines whether an exception should be thrown if the "id" parameter is missing.
     * @return {number|null} The parsed integer value of the "id" parameter if present, or null if not present and `shouldThrow` is false.
     * @throws {ApiException} Throws an exception if the "id" parameter is missing and `shouldThrow` is true.
     */
    static getId(request: Request, shouldThrow: boolean = true): number {
        let id = BaseController.getParam(request, 'id', null);

        if (id === null) {
            if (shouldThrow)
                throw new ApiException('No ID given', STATUS_CODE.BAD_REQUEST);

            return null;
        }

        return parseInt(id, 10);
    }

    /***
     * @param request {Express.Request}
     * @param paramDefinition {ParamDefinition}
     * @return {ParamDefinition}
     * @description
     *   Tries to get parameters specified in paramDefinition from requests route parameters. If a parameter is not
     *   found in the request, the parameter is set to the default value specified in paramDefinition.
     */
    static getParams<T extends DateTime | string | number | boolean>(request: Request, paramDefinition: ParamDefinition<T>): ParamDefinition<T> {
        const keys = Object.keys(paramDefinition);

        keys.forEach(key => {
            paramDefinition[key] = DataController.getParam(request, key, paramDefinition[key]);
        });

        return paramDefinition;
    }
}


/**
 * Represents a parameter definition where the keys are strings and the values are of a specific type.
 *
 * The type is constrained to be one of the following:
 * - moment.Moment
 * - string
 * - number
 * - boolean
 *
 * This type can be used to define a collection of parameters with consistent value types.
 *
 * @template T The type of values in the parameter definition, constrained to moment.Moment, string, number, or boolean.
 */
export type ParamDefinition<T extends DateTime | string | number | boolean> = { [key: string]: T };

/**
 * Represents options for configuring a controller decorator.
 *
 * This interface provides support for defining configurations such as
 * route prefix and middleware functions to be applied to the controller.
 *
 * @interface
 * @property {string} [prefix] Optional route prefix that will be applied to all endpoints of the controller.
 * @property {MIDDLEWARE[]} [middlewares] Optional list of middleware to be executed for the controller.
 */
export interface ControllerDecoratorOptions {
    prefix?: string;
    middlewares?: MIDDLEWARE[];
}

/**
 * Decorator function for defining a controller in a web application.
 * It assigns metadata such as prefix, default middleware, and routes to a class.
 *
 * @param {ControllerDecoratorOptions} [options] - Optional configuration for the controller.
 * @param {string} [options.prefix] - The base route path for the controller.
 * @param {Array<Function>} [options.middlewares] - Default middleware functions for the controller.
 * @return {ClassDecorator} Returns a class decorator that applies the controller configuration.
 */
export function Controller<T extends Instance>(options?: ControllerDecoratorOptions): GenericClassDecorator<Type<T>> {
    options = options ?? {} as ControllerDecoratorOptions;
    return (target: any) => {
        const tokens = Reflect.getMetadata('design:paramtypes', target) || [];
        const injections = tokens.map((token: any) => Injector.resolve<any>(token));

        const instance = new target(...injections);

        Injector.instances.push({
            type: target,
            instance: instance,
        });

        if (!options.prefix)
            options.prefix = '/' + target.name.replace('Controller', '').toLowerCase().trim();

        options.prefix = sanitizePath(options.prefix);

        Reflect.defineMetadata('prefix', options.prefix, target);

        if (!Reflect.hasMetadata('defaultMiddleware', target))
            Reflect.defineMetadata('defaultMiddleware', options?.middlewares ?? [], target);

        if (!Reflect.hasMetadata('routes', target))
            Reflect.defineMetadata('routes', [], target);
    };
}

/**
 * Interface representing configuration options for a route decorator.
 *
 * @interface
 */
export interface RouteDecoratorOptions {
    path?: string;
    middlewares?: MIDDLEWARE[];
}

/**
 * `Get` is a function that acts as a decorator for defining HTTP GET route handlers in a web application.
 * It allows specifying options for the route, including the path and any associated middleware.
 *
 * @param {RouteDecoratorOptions} [options] - Optional configuration for the route.
 *        - path: The URL path of the route (default is '/').
 *        - middlewares: An array of middleware functions to apply to the route (default is an empty array).
 *
 * @returns {MethodDecorator} - A method decorator function to bind route metadata to the target method.
 *
 * The decorator stores metadata about the HTTP route, such as the request method, path, middleware, and method name,
 * using reflection. This metadata can be used by the framework to register and configure routes in the application.
 */
export const Get = (options?: RouteDecoratorOptions): MethodDecorator => (target, propertyKey: string | symbol): void => {
    options = options ?? {path: '/', middlewares: []} as RouteDecoratorOptions;

    options.path = sanitizePath(options.path);

    if (!Reflect.hasMetadata('routes', target.constructor))
        Reflect.defineMetadata('routes', [], target.constructor);

    Reflect.defineMetadata('routes', Reflect.getMetadata('routes', target.constructor)
        .concat({
            requestMethod: 'get',
            path: options?.path ?? '/',
            middlewares: options?.middlewares ?? [],
            methodName: propertyKey as string,
        }), target.constructor);
};

/**
 * A decorator factory for defining HTTP POST route handlers in a class-based routing system.
 * This decorator associates a method in a class with a specific POST endpoint, including its path,
 * any middleware functions, and other route metadata.
 *
 * @param {RouteDecoratorOptions} [options] - An optional object specifying additional configurations for the route.
 * It includes the `path` for the route and an array of middleware functions.
 *
 * @returns {MethodDecorator} A method decorator function that adds the POST route metadata to the target class.
 */
export const Post = (options?: RouteDecoratorOptions): MethodDecorator => (target, propertyKey: string | symbol): void => {
    options = options ?? {path: '/', middlewares: []} as RouteDecoratorOptions;

    options.path = sanitizePath(options.path);

    if (!Reflect.hasMetadata('routes', target.constructor))
        Reflect.defineMetadata('routes', [], target.constructor);

    Reflect.defineMetadata('routes', Reflect.getMetadata('routes', target.constructor).concat({
        requestMethod: 'post',
        path: options?.path ?? '/',
        middlewares: options?.middlewares ?? [],
        methodName: propertyKey,
    }), target.constructor);
};

/**
 * A decorator function for defining a PUT HTTP route on a method within a class. This decorator
 * is typically used within a framework to register a method as a handler for PUT requests
 * to a specific route path.
 *
 * @param {RouteDecoratorOptions} [options] - Optional configuration object for the route.
 *        - `path`: A string representing the path for the route. Defaults to `/` if not provided.
 *        - `middlewares`: An array of middleware functions to execute before the route handler. Defaults to an empty array.
 *
 * @returns {MethodDecorator} A method decorator that assigns metadata to the class, including the request method, path, middlewares, and the method name.
 *
 * @throws {Error} May throw if there are issues with metadata configuration on the target class.
 *
 * Metadata:
 * - `routes`: Defined on the class, an array of route metadata objects each containing:
 *   - `requestMethod`: The HTTP method for the route, which is `put` for this decorator.
 *   - `path`: The route path.
 *   - `middlewares`: The middlewares associated with the route.
 *   - `methodName`: The name of the method this decorator is applied to.
 */
export const Put = (options?: RouteDecoratorOptions): MethodDecorator => (target, propertyKey: string | symbol): void => {
    options = options ?? {path: '/', middlewares: []} as RouteDecoratorOptions;

    options.path = sanitizePath(options.path);

    if (!Reflect.hasMetadata('routes', target.constructor))
        Reflect.defineMetadata('routes', [], target.constructor);

    Reflect.defineMetadata('routes', Reflect.getMetadata('routes', target.constructor).concat({
        requestMethod: 'put',
        path: options.path ?? '/',
        middlewares: options.middlewares ?? [],
        methodName: propertyKey,
    }), target.constructor);
};

/**
 * A method decorator for defining a DELETE route in a web application.
 *
 * This decorator associates a method with an HTTP DELETE request handled by the specified path.
 * It uses optional parameters for customizing the route, such as the path and middleware functions.
 * The decorated method can then be registered as a DELETE handler in the routing system.
 *
 * @param {RouteDecoratorOptions} [options] - Optional configuration for the DELETE route.
 * - `path` specifies the endpoint for the route. Defaults to '/'.
 * - `middlewares` is an array of middleware functions to be applied to the route. Defaults to an empty array.
 *
 * @returns {MethodDecorator} A decorator function that associates metadata about the DELETE route
 *                             with the method it decorates, storing the configuration under the `routes` metadata key.
 */
export const Delete = (options?: RouteDecoratorOptions): MethodDecorator => (target, propertyKey: string | symbol): void => {
    options = options ?? {path: '/', middlewares: []} as RouteDecoratorOptions;

    options.path = sanitizePath(options.path);

    if (!Reflect.hasMetadata('routes', target.constructor))
        Reflect.defineMetadata('routes', [], target.constructor);

    Reflect.defineMetadata('routes', Reflect.getMetadata('routes', target.constructor).concat({
        requestMethod: 'delete',
        path: options?.path ?? '/',
        middlewares: options?.middlewares ?? [],
        methodName: propertyKey,
    }), target.constructor);
};

/**
 * A decorator function that sets up route metadata for an "OPTIONS" HTTP request method.
 *
 * @function
 * @name Options
 * @param {RouteDecoratorOptions} [options] - Configuration options for the route,
 * including the `path` and any `middlewares`. If not provided, defaults to `{path: '/', middlewares: []}`.
 * @returns {MethodDecorator} A method decorator that applies the route metadata to the target class.
 *
 * The decorator defines metadata such as path, middlewares, request method type,
 * and method name for the specified class method. This metadata is stored using `Reflect`
 * and can later be retrieved to create HTTP routing logic.
 */
export const Options = (options?: RouteDecoratorOptions): MethodDecorator => (target, propertyKey: string | symbol): void => {
    options = options ?? {path: '/', middlewares: []} as RouteDecoratorOptions;

    options.path = sanitizePath(options.path);

    if (!Reflect.hasMetadata('routes', target.constructor))
        Reflect.defineMetadata('routes', [], target.constructor);

    Reflect.defineMetadata('routes', Reflect.getMetadata('routes', target.constructor).concat({
        requestMethod: 'options',
        path: options?.path ?? '/',
        middlewares: options?.middlewares ?? [],
        methodName: propertyKey,
    }), target.constructor);
};


/**
 * Sanitizes a file path by ensuring it starts with a single forward slash `/` and replaces
 * any occurrences of double slashes `//` with a single slash `/`.
 *
 * @param {string} path - The file path to sanitize. Defaults to '/' if no path is provided.
 * @return {string} The sanitized file path.
 */
function sanitizePath(path: string = '/'): string {
    if (path[0] != '/')
        path = '/' + path

    return path.replace('//', '/');
}

/**
 * Represents a generic cache object with a unique identifier, data, a calculated checksum,
 * validity period, and a defined lifetime.
 *
 * This class provides functionality to initialize, update, and manage cached data, including
 * recalculating a checksum for integrity and setting header information for external use.
 *
 * @template T The type of data stored in the cache.
 */
export class Cache<T = any> {
    public id: string;
    public data: T;
    public checksum: string;
    public validUntil: DateTime;
    private readonly lifeTime: TimeSpan;

    /**
     * Constructs a new instance of the cache-like object with the given properties.
     *
     * @param {Object} cacheLike - The cache-like object containing initialization properties.
     * @param {string} cacheLike.id - The unique identifier for the cache object.
     * @param {T} cacheLike.data - The data to be stored in the cache object.
     * @param {TimeSpan} cacheLike.lifeTime - The lifespan of the cache object.
     */
    constructor(cacheLike: { id: string, data: T, lifeTime: TimeSpan }) {
        this.id = cacheLike.id;
        this.data = cacheLike.data;
        this.lifeTime = cacheLike.lifeTime;
        this.validUntil = this.lifeTime ? DateTime.now().plus({milliseconds: this.lifeTime.totalMilliseconds}) : DateTime.now();
        this.checksum = hash(this.data);
    }

    /**
     * Updates the cached data, resets the validity period, and recalculates the checksum.
     *
     * @param {T} data - The new data to be cached.
     * @return {Cache<T>} The current instance of the Cache with the updated data.
     */
    public updateData(data: T): Cache<T> {
        this.data = data;
        this.validUntil = DateTime.now().plus({milliseconds: this.lifeTime.totalMilliseconds});
        this.checksum = hash(this.data);

        return this;
    }

    /**
     * Retrieves the headers as an object where keys represent the header names and values represent their respective values.
     *
     * @return {Object} An object containing header key-value pairs. Specifically includes the 'X-Cache-Checksum' header and its value.
     */
    public getHeader(): ({ [key: string]: string }) {
        return {'X-Cache-Checksum': this.checksum};
    }

}

/**
 * Abstract class that provides a base implementation for managing data operations such as loading,
 * caching, retrieving, updating, creating, and deleting resources. The `DataController` is designed
 * to interact with a specified interface for managing data and provides methods for handling common
 * resource-related operations.
 *
 * This class is designed to be extended by specific implementations for various data types.
 *
 * @template TInterface - The interface that defines the structure of the data managed by this controller.
 */
export abstract class DataController<TInterface extends MongoEntity, TService extends DataService<TInterface, any>> extends BaseController {
    /**
     * An array of cache objects used to store data temporarily. Each cache object is expected
     * to hold an array of elements, with the specific type of the elements being flexible (any[]).
     * This variable can be utilized as a mechanism to manage and retrieve stored data efficiently.
     */
    protected caches: Cache<any[]>[] = [];

    /**
     * Protected constructor for initializing the class with actions and a default cache lifetime.
     *
     * @param {TimeSpan} [defaultCacheLifetime=TimeSpan.fromMinutes(1)] - The default duration for cache lifetime.
     * @param service
     */
    protected constructor(
        protected service: TService,
        protected defaultCacheLifetime: TimeSpan = TimeSpan.fromMinutes(1)
    ) {
        super();
    }

    /**
     * Loads data using the provided loader function and generates a cache with a checksum.
     * Utilizes request-specific parameters to identify caching needs, validate cache validity,
     * and update the cache if necessary.
     *
     * @param {Request} request - The incoming request object containing path, parameters, body, and headers.
     * @param {T[]} data - A function to load data that will populate the cache.
     * @return {{ cache: Cache<T[]>, status: IStatusCode }} - An object containing the updated or existing cache,
     * and the operation status code.
     */
    public async loadDataAndGenerateChecksum<T>(request: Request, dataLoader: Promise<T[]>): Promise<{
        cache: Cache<T[]>,
        status: IStatusCode
    }> {
        // Remove all outdated local caches
        this.caches = this.caches.filter(x => x.validUntil > DateTime.now());

        // Generate cacheId and check if it already exists
        const cacheId = hash({path: request.path, params: request.params, body: request.body});
        const cacheIndex = this.caches.findIndex(x => x.id === cacheId);
        let cache = (cacheIndex >= 0 ? this.caches[cacheIndex] : null) as any as Cache<T[]>;

        // Generate new cache if not already present
        if (!cache) {
            cache = new Cache<T[]>({
                id: cacheId,
                data: await dataLoader,
                lifeTime: this.defaultCacheLifetime
            });
        } else {
            // Check if local cache needs to be rebuild
            if (cache.validUntil < DateTime.now())
                cache.updateData(await dataLoader);
        }

        // Caching is disabled, return data
        if (this.defaultCacheLifetime === null)
            return {cache: _.cloneDeep(cache), status: STATUS_CODE.OK};

        // Caching is enabled, update existing cache or add new one
        if (cacheIndex !== -1)
            this.caches[cacheIndex] = cache;
        else
            this.caches.push(cache);

        // Return null if checksums are identical (client has the same cache as the API)
        const requestedChecksum = request.header("X-Cache-Checksum");
        if (!!requestedChecksum && requestedChecksum === cache.checksum) {
            return {cache: null, status: STATUS_CODE.NOT_MODIFIED};
        }

        return {cache: _.cloneDeep(cache), status: STATUS_CODE.OK};
    }

    /**
     * Retrieves all data based on the provided request, processes it, and sends the appropriate response.
     *
     * @param {Request} request - The incoming request object containing the necessary parameters and context.
     * @param {Response} response - The response object used to send back the processed data or error information.
     * @return {void} This method does not return anything directly, but responds to the client with the processed data or an error.
     */
    @Get()
    public async getAll(request: Request, response: Response): Promise<void> {
        try {
            const result = await this.loadDataAndGenerateChecksum(request, this.service.getAll()
                .then(data => data
                    .filter(this.filter.bind(this))
                    .map(this.sanitizeFromDB.bind(this))
                ));
            const {cache, status} = result;

            if (status === STATUS_CODE.NOT_MODIFIED) {
                Respond({response, status});
                return;
            }
            let data = cache.data;

            if (data.length > 1 && data[0].hasOwnProperty("id")) {
                // @ts-ignore
                data = data.sort(SortFn<TInterface>("id" as keyof TInterface));
            }

            Respond({response, data: data, status: STATUS_CODE.OK, header: cache.getHeader()});
        } catch (e) {
            const exception = e as ApiException;
            Respond({response, status: exception.status, data: exception.message});
        }
    }

    /**
     * Retrieves a record by its identifier from the database, sanitizes the data,
     * and sends the response back to the client. Throws an exception if the record
     * is not found or an error occurs during the process.
     *
     * @param {Request} request The HTTP request object, used to extract the record ID.
     * @param {Response} response The HTTP response object, used to send back the result or error message.
     * @return {void} Does not return a value, as it sends the response directly to the client.
     */
    @Get({
        path: "/:id"
    })
    public async getById(request: Request, response: Response): Promise<void> {
        try {
            let id = BaseController.getId(request);

            const result = this.sanitizeFromDB(await this.service.findOne("id = :0", [id]));

            if (!result)
                throw new ApiException(`Can't find object with id: ${id}`, STATUS_CODE.NOT_FOUND);

            Respond({response, data: result});
        } catch (e) {
            const exception = e as ApiException;
            Respond({response, status: exception.status, data: exception.message});
        }
    }

    /**
     * Handles the creation of a new resource by processing the request,
     * sanitizing input and output data, and responding with the created resource.
     *
     * @param {Request} request - The HTTP request containing the data to create the resource.
     * @param {Response} response - The HTTP response used to send the result back to the client.
     * @return {void} This method does not return a value, it sends a response to the client.
     */
    @Post()
    public async create(request: Request, response: Response): Promise<void> {
        try {
            let data = this.sanitizeForDB(request.body as TInterface);

            const result = this.sanitizeFromDB(await this.service.create(data, false));

            // Force cache rebuild for all clients
            this.destroyCaches();

            Respond({response, data: result});
        } catch (e) {
            const exception = e as ApiException;
            Respond({response, status: exception.status, data: exception.message});
        }
    }

    /**
     * Updates the resource with the provided data and responds with the updated result.
     *
     * @param {Request} request - The request object containing the data to update the resource.
     * @param {Response} response - The response object used to send the result or error to the client.
     * @return {void} This method does not return a value; it sends a response back to the client.
     */
    @Put()
    public async update(request: Request, response: Response): Promise<void> {
        try {
            let data = this.sanitizeForDB(request.body);

            const result = this.sanitizeFromDB(await this.service.update(data, false));

            // Force cache rebuild for all clients
            this.destroyCaches();

            Respond({response, data: result});
        } catch (e) {
            const exception = e as ApiException;
            Respond({response, status: exception.status, data: exception.message});
        }
    }

    /**
     * Deletes a resource identified by the provided ID.
     *
     * @param {Request} request - The HTTP request object, containing the resource ID to delete.
     * @param {Response} response - The HTTP response object, used to send back the deletion result.
     * @return {void} No value is returned, the response object is used to communicate the result.
     */
    @Delete({
        path: "/:id"
    })
    public async delete(request: Request, response: Response): Promise<void> {
        try {
            let id = BaseController.getId(request);

            const result = await this.service.delete(id);

            // Force cache rebuild for all clients
            this.destroyCaches();

            if (!result)
                throw new ApiException(`Unable to delete object`, STATUS_CODE.INTERNAL);

            Respond({response, data: result});
        } catch (e) {
            const exception = e as ApiException;
            Respond({response, status: exception.status, data: exception.message});
        }
    }

    /**
     * Clears all the caches by resetting the caches array to an empty state.
     *
     * @return {void} No return value.
     */
    public destroyCaches(): void {
        this.caches = [];
    }

    /**
     * Sanitizes the provided value for safe usage and storage in a database.
     *
     * @param {TInterface} value - The input object or data structure that needs to be sanitized.
     * @return {TInterface} The sanitized version of the input object or data structure.
     */
    public sanitizeForDB(value: TInterface): TInterface {
        return value;
    }

    /**
     * Sanitizes the given object retrieved from the database to ensure it is safe and standardized for processing.
     *
     * @param {TInterface} value - The object retrieved from the database that needs to be sanitized.
     * @return {TInterface} The sanitized object after processing.
     */
    public sanitizeFromDB(value: TInterface): TInterface {
        return value;
    }

    /**
     * Filters the input value based on specific criteria.
     *
     * @param {TInterface} value - The value to be evaluated against the filter.
     * @return {boolean} Returns true if the value meets the filter criteria, otherwise false.
     */
    public filter(value: TInterface): boolean {
        return true;
    }
}