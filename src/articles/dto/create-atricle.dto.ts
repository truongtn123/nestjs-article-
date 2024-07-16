import { IsNotEmpty } from 'class-validator';
import { User } from 'src/auth/user.entity';

export class CreateArticleDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  filename: string;

  user: User;
}
