import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Article } from './article.entity';
import { CreateArticleDto } from './dto/create-atricle.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetArticlesFilterDto } from './dto/get-articles-filter.dto';
import * as path from 'path';
import * as fs from 'fs';
import { User } from 'src/auth/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articlesRepository: Repository<Article>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getArticles(
    filterDto: GetArticlesFilterDto,
    userId: string,
  ): Promise<any> {
    const itemsPerPage = Number(filterDto.items_per_page) || 10;
    const page = Number(filterDto.page) || 1;
    const search = filterDto.search || '';

    const skip = (page - 1) * itemsPerPage;

    const query = this.articlesRepository.createQueryBuilder('article');

    query.where(
      '(article.title LIKE :search OR article.description LIKE :search)',
      { search: `%${search}%` },
    );
    query.andWhere('article.userId = :userId', { userId });
    query.orderBy('article.created_at', 'DESC');
    query.take(itemsPerPage);
    query.skip(skip);
    query.leftJoinAndSelect('article.user', 'user', 'user.id = article.userId');
    query.select(['article', 'user.id', 'user.username']);

    const [res, total] = await query.getManyAndCount();

    const lastPage = Math.ceil(total / itemsPerPage);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    return {
      data: res,
      total,
      currentPage: page,
      nextPage,
      prevPage,
      lastPage,
    };
  }

  async getArticleById(id: string, userId: string): Promise<Article> {
    const query = this.articlesRepository.createQueryBuilder('article');

    query.where('article.id = :id', { id });
    query.andWhere('article.userId = :userId', { userId });
    query.leftJoinAndSelect('article.user', 'user');
    query.select(['article', 'user.id', 'user.username']);

    const found = await query.getOne();

    if (!found) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }

    return found;
  }

  async createArticle(
    createArticleDto: CreateArticleDto,
    userId: string,
  ): Promise<Article> {
    const { title, description, filename } = createArticleDto;

    // find user by id
    const checkUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    const article = this.articlesRepository.create({
      title,
      description,
      filename,
      user: checkUser,
    });
    await this.articlesRepository.save(article);
    return article;
  }

  async updateArticle(
    id: string,
    updateArticleDto: UpdateArticleDto,
    userId: string,
  ): Promise<Article> {
    const article = await this.getArticleById(id, userId);
    const { title, description, filename } = updateArticleDto;
    const updated_at = new Date();
    // console.log(filename);

    if (filename) {
      const oldFilePath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        article.filename,
      );
      fs.unlinkSync(oldFilePath); //delete
    }

    await this.articlesRepository.update(id, {
      ...article,
      title,
      description,
      filename,
      updated_at,
    });

    return await this.getArticleById(id, userId); // Retrieve the updated article
  }

  async deleteArticle(id: string, userId: string): Promise<void> {
    const result = await this.articlesRepository.delete({
      id,
      user: { id: userId },
    });

    //if file is existed (id is correct) so result.affected = 1; else is 0
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }
}
