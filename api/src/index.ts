import {Bootstrap} from './app/bootstrap';
import {Log} from "./app/utilities/type";

/**
 * An instance of the Bootstrap class used to initialize and manage
 * the Bootstrap framework functionality within the application.
 * This variable serves as the main access point for utilizing
 * customizations, configurations, or components provided by Bootstrap.
 *
 * The `b` instance can be used to invoke methods or interact with
 * various features of the Bootstrap library as defined in its
 * implementation.
 */
const b = new Bootstrap();

process.on('uncaughtException', (reason: Error) => {
    Log.error(reason.message, reason.stack);
    b.restart();
});
process.on('unhandledRejection', (reason: Error, p) => {
    Log.error(reason.message, reason.stack);
    b.restart();
});
