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

  async login(loginUserDto: LoginUserDto): Promise<any> {
    const { username, password } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: { username: loginUserDto.username },
    });

    const checkPass = bcrypt.compareSync(password, user.password);

    if (!checkPass) {
      throw new UnauthorizedException('Password is not correct');
    }
    const payload = { id: user.id, username };
    return this.generateToken(payload);
  }

  async refreshToken(refresh_token: string): Promise<any> {
    try {
      const verify = await this.jwtService.verifyAsync(refresh_token, {
        secret: '123456',
      });
      return this.generateToken({ id: verify.id, username: verify.username });
    } catch (error) {
      throw new BadRequestException('Refresh token is not valid');
    }
  }

  async generateToken(payload: { id: string; username: string }) {
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: '123456',
      expiresIn: '1d',
    });
    return {
      access_token,
      refresh_token,
    };
  }
}
