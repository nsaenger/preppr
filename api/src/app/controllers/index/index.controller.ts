import { Request, Response } from 'express';
import { STATUS_CODE } from '../../constants/status-codes';
import { Controller, ControllerInstance, Get, Respond } from '../../utilities/controller';

@Controller("/test")
export class IndexController extends ControllerInstance {

  constructor() {
    super();
  }

  @Get()
  public index(request: Request, response: Response) {
    Respond({
      response,
      status: STATUS_CODE.OK,
      html: true,
      data: `
        <h1>Test</h1>
        <p>This is a test.</p>
      `,
    });
  }
}