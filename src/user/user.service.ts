import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/user.entity';
import { Repository } from 'typeorm';
import { UpdatePasswordDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async getUser(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updatePassword(id: string, password: UpdatePasswordDto): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (user) {
      const { new_Password, current_password } = password;

      const checkPass = bcrypt.compareSync(current_password, user.password);

      if (!checkPass) {
        throw new BadRequestException('Password is not correct');
      } else {
        const update_at = new Date();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_Password, salt);

        await this.userRepository.update(id, {
          ...user,
          update_at,
          password: hashedPassword,
        });

        return 'update password successfully';
      }
    } else {
      throw new BadRequestException(`No user with id ${id}`);
    }
  }
}
