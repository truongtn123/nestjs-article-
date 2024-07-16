import { Exclude } from 'class-transformer';
import { Article } from 'src/articles/article.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  @Exclude()
  refresh_token: string;

  @CreateDateColumn()
  create_at: Date;

  @Column({ default: null })
  update_at: Date;

  @OneToMany(() => Article, (article) => article.user)
  articles: Article[];
}
