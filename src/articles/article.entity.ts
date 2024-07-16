import { Exclude } from 'class-transformer';
import { User } from 'src/auth/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  filename: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: null })
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.articles)
  @Exclude({ toPlainOnly: true })
  user: User;
}
