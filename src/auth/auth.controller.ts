import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto): Promise<any> {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  login(
    @Body() loginUserDto: LoginUserDto,
    @Res() res: Response,
  ): Promise<any> {
    return this.authService.login(loginUserDto, res);
  }

  @Post('refresh-token')
  refreshToken(@Req() req: Request, @Res() res: Response): Promise<any> {
    return this.authService.refreshToken(req, res);
  }

  @Get('logout')
  logout(@Res() res: Response): Promise<any> {
    return this.authService.logout(res);
  }
}
