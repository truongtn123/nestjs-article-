import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/auth/user.entity';
import { UpdatePasswordDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/:id')
  @UseGuards(AuthGuard)
  getUser(@Param('id') id: string): Promise<User> {
    return this.userService.getUser(id);
  }

  @Post('/:id/update')
  @UseGuards(AuthGuard)
  updatePassword(
    @Param('id') id: string,
    @Body() password: UpdatePasswordDto,
  ): Promise<any> {
    return this.userService.updatePassword(id, password);
  }
}
