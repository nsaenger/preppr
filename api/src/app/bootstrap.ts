import * as http from 'http';
import 'dotenv/config';
import colors from 'colors';

import {Injector} from './utilities/injector';
import {Application} from "./application";
import {Log} from "./utilities/type";
import express = require('express');
import os = require('os');
import Socket = NodeJS.Socket;


/**
 * The Bootstrap class is responsible for initializing, starting, stopping, and restarting
 * the application server. It manages the server lifecycle, client connections, and application
 * initialization. It also provides a mechanism for handling hot restarts.
 */
export class Bootstrap {
    public connections: Socket[] = [];
    private readonly expressApplication: express.Application;
    private readonly maxHotRestarts: number;
    private hotRestarts: number;
    private server: http.Server;
    private port = process.env.PORT || 5010;


    /**
     * Constructor for initializing the server application.
     *
     * It sets up the Express application instance, initializes the counter
     * for hot restarts, sets the maximum number of allowed hot restarts,
     * and starts the server.
     */
    constructor() {
        this.expressApplication = express();
        this.maxHotRestarts = 100;
        this.hotRestarts = 0;

        this.startServer();
    }


    /**
     * Starts the server by binding it to the specified port and initializing the application.
     * Sets up a listener for incoming connections and keeps track of active connections.
     *
     * @return {void} Does not return a value.
     */
    public startServer(): void {
        this.server = this.expressApplication.listen(this.port, () => {
            try {
                this.startApplication();
            } catch (e) {
                Log.error(e);
            }
            this.server.on('connection', (connection) => {
                this.connections.push(connection);
            });
        });
    }

    /**
     * Stops the server and closes all active connections.
     * Ensures that all current connections are properly ended before shutting down the server.
     * Handles the case where the server instance exists by closing it gracefully.
     * @return {void} No value is returned.
     */
    public stopServer(): void {
        if (this.server) {
            Log.info(`stopping server`);
            this.connections.map(connection => {
                connection.end();
            });
            this.server.close();
        }
    }

    /**
     * Starts the application by performing the necessary initialization steps such as
     * resolving network addresses, logging initial status, and initializing dependency injection.
     *
     * @return {void} This method does not return a value.
     */
    public startApplication(): void {
        const interfaces = os.networkInterfaces();
        const keys = Object.keys(interfaces);
        let address = '0.0.0.0';

        /*
        keys.map(key => interfaces[key]?.map(network => {
            if (network.family === 'IPv4' && !network.internal) {
                address = network.address;
            }
        }));*/

        Log.info(`listening on http://${colors.yellow(address + ':' + this.port)}/`);
        if (process.env.NODE_ENV === 'development') {
            Log.info(`running in development mode`);
        }
        Injector.resolve<Application>(Application).init(this.expressApplication, process).then();
    }

    /**
     * Stops the application by invoking the `onDestroy` method on all instances where applicable.
     * It retrieves all injected instances and checks for the presence of an `onDestroy` method.
     * If found, the method is executed for proper cleanup.
     *
     * @return {void} Does not return a value.
     */
    public stopApplication(): void {
        Log.info(`stopping all instances`);
        Injector
            .getAll()
            .map((instance: any) => {
                if (typeof (instance.onDestroy) === 'function') {
                    instance.onDestroy();
                }
            });
    }

    /**
     * Restarts the application and server by stopping the current instance
     * and starting a new one. If the number of restarts exceeds the defined
     * maximum hot restarts threshold, the application forcibly shuts down.
     *
     * @return {void} No return value.
     */
    public restart(): void {
        if (++this.hotRestarts >= this.maxHotRestarts) {
            console.error('Too much hot restarts, fail save active...');
            this.stopApplication();
            this.stopServer();
            process.exit();
        }

        Log.info(`restarting ( ${this.hotRestarts} / ${this.maxHotRestarts} )`);
        this.stopApplication();
        Injector.instances = [];
        setTimeout(() => {
            this.stopServer();
            this.startServer();
            Log.info('restart complete');
        }, 2500);
    }
}
