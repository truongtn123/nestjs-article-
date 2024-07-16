import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import { Request, Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<void> {
    const { username, password } = registerUserDto;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
    });

    try {
      await this.userRepository.save(user);
    } catch (error) {
      if ((error.code = 'ER_DUP_ENTRY')) {
        throw new ConflictException('Username already exists');
      }
    }
  }

  async login(loginUserDto: LoginUserDto, res: Response): Promise<any> {
    const { username, password } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: { username: loginUserDto.username },
    });

    if (user) {
      const checkPass = bcrypt.compareSync(password, user.password);

      if (!checkPass) {
        throw new UnauthorizedException('Password is not correct');
      }
      const payload = { id: user.id, username };
      return this.generateToken(payload, res);
    }
    throw new BadRequestException('User is not exits');
  }

  async logout(res: Response): Promise<any> {
    const oneDay = 1000 * 60 * 60 * 24;
    res.cookie('token', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now() + oneDay),
      secure: false,
    });
    res.send({ msg: 'Log out successfully' });
  }

  async refreshToken(req: Request, res: Response): Promise<any> {
    const refresh_token = req.cookies['token'];
    try {
      const verify = await this.jwtService.verifyAsync(refresh_token, {
        secret: '123456',
      });

      const checkRefresh = await this.userRepository.findOneBy({
        id: verify.id,
      });

      if (checkRefresh) {
        await this.generateToken(
          { id: verify.id, username: verify.username },
          res,
        );
      } else {
        throw new BadRequestException('Refresh token is not valid');
      }
    } catch (error) {
      throw new BadRequestException('Refresh token is not valid');
    }
  }

  async generateToken(
    payload: { id: string; username: string },
    res: Response,
  ) {
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: '123456',
      expiresIn: '30d',
    });

    //save access_token to cookie
    const oneDay = 1000 * 60 * 60 * 24;
    res.cookie('token', access_token, {
      httpOnly: true,
      expires: new Date(Date.now() + oneDay),
      secure: false,
    });

    //update refreshtoken to DB
    await this.userRepository.update(payload.id, { refresh_token });

    res.send({ access_token, refresh_token });
  }
}
