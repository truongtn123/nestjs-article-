import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('set')
  setCookie(@Res() res: Response) {
    res.cookie('key', 'value of cookie', { httpOnly: true });
    res.send('Cookie has been set');
  }

  @Get('get')
  getCookie(@Req() req: Request) {
    const value = req.cookies['key'];
    return `Cookie value: ${value}`;
  }
}
