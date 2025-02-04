import * as http from 'http';
import dotenv from 'dotenv';
import colors from 'colors';

import { Injector } from './utilities/injector';

import express = require('express');
import os = require('os');
import Socket = NodeJS.Socket;
import { App } from './app';

dotenv.config();

export class Bootstrap {
  public connections: Socket[] = [];
  private readonly expressApplication: express.Application;
  private readonly maxHotRestarts;
  private hotRestarts;
  private server: http.Server;
  private port = process.env.PORT || 5000;

  constructor() {
    this.expressApplication = express();
    this.maxHotRestarts = 100;
    this.hotRestarts = 0;

    this.startServer();
  }

  startServer() {
    this.server = this.expressApplication.listen(this.port, () => {
      this.startApplication();
      this.server.on('connection', (connection) => {
        this.connections.push(connection);
      });
    });
  }

  stopServer() {
    if (this.server) {
      console.info(`stopping server`);
      this.connections.map(connection => {
        connection.end();
      });
      this.server.close();
    }
  }

  startApplication() {
    const interfaces = os.networkInterfaces();
    const keys = Object.keys(interfaces);
    let address = 'localhost';

    keys.map(key => interfaces[key]?.map(network => {
      if (network.family === 'IPv4' && !network.internal) {
        address = network.address;
      }
    }));

    console.info(`listening on http://${ colors.yellow(address + ':' + this.port) }/`);
    if (process.env.NODE_ENV === 'development') {
      console.info(`running in development mode`);
    }
    Injector.resolve<App>(App).init(this.expressApplication, process).then();
  }

  stopApplication() {
    console.info(`stopping all instances`);
    Injector
      .getAll()
      .map(instance => {
        if (typeof (instance.onDestroy) === 'function') {
          instance.onDestroy();
        }
      });
  }

  restart() {
    if (++this.hotRestarts >= this.maxHotRestarts) {
      console.error('Too much hot restarts, fail save active...');
      this.stopApplication();
      this.stopServer();
      process.exit();
    }

    console.info(`restarting ( ${ this.hotRestarts } / ${ this.maxHotRestarts } )`);
    this.stopApplication();
    Injector.instances = [];
    setTimeout(() => {
      this.stopServer();
      this.startServer();
      console.info('restart complete');
    }, 2500);
  }
}
