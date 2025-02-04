import colors from "colors";

/**
 * A generic interface representing a constructor function type.
 *
 * The `Type` interface is used to define a class-like type or a constructor
 * signature for objects of type `T`. It allows the creation of new instances
 * of `T` using the `new` keyword.
 *
 * @template T - The type of the instance created by the constructor function.
 */
export interface Type<T> {
    new(...args: any[]): T;
}


/**
 * Represents a decorator that can be applied to a class or constructor-like target.
 *
 * @template T The type of the target that the decorator can be applied to.
 * @typedef {Function} GenericClassDecorator
 * @param {T} target - The target to which the decorator is applied.
 * @returns {void}
 */
export type GenericClassDecorator<T> = (target: T) => void;

/**
 * Extends the Express `Request` interface to include additional optional properties.
 *
 * @property {number} [startTime] - Optional property to store the timestamp indicating when the request started.
 * @property {IUser} [user] - Optional property to store data related to the authenticated user.
 */
declare global {
    namespace Express {
        export interface Request {
            startTime?: number;
            // @ts-ignore
            user?: IUser;
        }
    }
}

/***
 * Class for logging to console and file
 *
 * @example
 * new Log('Hello', 'World');
 * // [2021-01-01 00:00:00] LOG     :: Hello World
 *
 * Log.log('Hello', 'World');
 * // [2021-01-01 00:00:00] LOG     :: Hello World
 *
 * Log.debug('Hello', 'World');
 * // [2021-01-01 00:00:00] DEBUG   :: Hello World
 *
 * Log.info('Hello', 'World');
 * // [2021-01-01 00:00:00] INFO    :: Hello World
 *
 * Log.warning('Hello', 'World');
 * // [2021-01-01 00:00:00] WARNING :: Hello World
 *
 * Log.error('Hello', 'World');
 * // [2021-01-01 00:00:00] ERROR   :: Hello World
 */
export class Log {

    /***
     * Log to console and file as log
     * @param args: any[]
     *
     * @example
     * new Log('Hello', 'World');
     * // [2021-01-01 00:00:00] LOG     :: Hello World
     */
    constructor(...args: any[]) {
        Log.log(...args);
    }

    /***
     * Log to console and file as debug
     * @param args: any[]
     *
     * @example
     * Log.debug('Hello', 'World');
     * // [2021-01-01 00:00:00] DEBUG   :: Hello World
     */
    public static log(...args: any[]) {
        const date = new Date();
        const timestamp = `[${date.toLocaleDateString()} ${date.toLocaleTimeString()}] LOG     :: `;
        const message = `${timestamp} ${args.map(x => typeof (x) === 'object' ? JSON.stringify(x) : x).join(' ')}`;
        console.log(colors.white(message));
        Log.WriteToFile('log', message);
    }

    /***
     * Log to console and file as debug
     * @param args: any[]
     *
     * @example
     * Log.debug('Hello', 'World');
     * // [2021-01-01 00:00:00] DEBUG   :: Hello World
     */
    public static debug(...args: any[]) {
        const date = new Date();
        const timestamp = `[${date.toLocaleDateString()} ${date.toLocaleTimeString()}] DEBUG   :: `;
        const message = `${timestamp} ${args.map(x => typeof (x) === 'object' ? JSON.stringify(x) : x).join(' ')}`;
        console.debug(colors.cyan(message));
        Log.WriteToFile('debug', message);
    }

    /***
     * Log to console and file as info
     * @param args: any[]
     *
     * @example
     * Log.info('Hello', 'World');
     * // [2021-01-01 00:00:00] INFO    :: Hello World
     */
    public static info(...args: any[]) {
        const date = new Date();
        const timestamp = `[${date.toLocaleDateString()} ${date.toLocaleTimeString()}] INFO    :: `;
        const message = `${timestamp} ${args.map(x => typeof (x) === 'object' ? JSON.stringify(x) : x).join(' ')}`;
        console.info(colors.blue(message));
        Log.WriteToFile('info', message);
    }

    /***
     * Log to console and file as warning
     * @param args: any[]
     *
     * @example
     * Log.warning('Hello', 'World');
     * // [2021-01-01 00:00:00] WARNING :: Hello World
     */
    public static warning(...args: any[]) {
        const date = new Date();
        const timestamp = `[${date.toLocaleDateString()} ${date.toLocaleTimeString()}] WARNING :: `;
        const message = `${timestamp} ${args.map(x => typeof (x) === 'object' ? JSON.stringify(x) : x).join(' ')}`;
        console.warn(colors.yellow(message));
        Log.WriteToFile('warning', message);
    }

    /***
     * Log to console and file as error
     * @param args: any[]
     *
     * @example
     * Log.error('Hello', 'World');
     * // [2021-01-01 00:00:00] ERROR   :: Hello World
     */
    public static error(...args: any[]) {
        const date = new Date();
        const timestamp = `[${date.toLocaleDateString()} ${date.toLocaleTimeString()}] ERROR   :: `;
        const message = `${timestamp} ${args.map(x => typeof (x) === 'object' ? JSON.stringify(x) : x).join(' ')}`;
        console.error(colors.red(message));
        Log.WriteToFile('error', message);
    }

    /**
     * Writes a log message to a file based on the specified log type.
     *
     * @param {'log' | 'debug' | 'info' | 'warning' | 'error'} logType - The type of log message (e.g., 'log', 'debug', 'info', 'warning', 'error').
     * @param {string} message - The message to be written to the log file.
     * @return {void} This method does not return a value.
     */
    private static WriteToFile(logType: 'log' | 'debug' | 'info' | 'warning' | 'error', message: string) {
        const logPath = process.env.LOG_PATH ?? null;
        if (!logPath) return;

        const fs = require('fs');
        const path = require('path');
        let fileName = 'log';

        switch (logType) {
            default:
            case "log":
                fileName = 'log';
                break;
            case "debug":
                fileName = 'debug';
                break;
            case "info":
                fileName = 'info';
                break;
            case "warning":
                fileName = 'warning';
                break;
            case "error":
                fileName = 'error';
                break;
        }

        const logFile = path.join(logPath, fileName + '.log');

        fs.appendFileSync(logFile, message + '\n');
    }
}