import { Bootstrap } from './app/bootstrap';

const b = new Bootstrap();

process.on('uncaughtException', (e: any) => {
  if (!!e && e !== '[]') {
    console.log('Unhandled Exception', e);
    b.restart();
  }
});
process.on('unhandledRejection', (e, p) => {
  console.log('Unhandled Rejection', e, p);
  b.restart();
});
