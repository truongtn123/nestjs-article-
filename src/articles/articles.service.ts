import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Article } from './article.entity';
import { CreateArticleDto } from './dto/create-atricle.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetArticlesFilterDto } from './dto/get-articles-filter.dto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articlesRepository: Repository<Article>,
  ) {}

  async getArticles(filterDto: GetArticlesFilterDto): Promise<any> {
    const items_per_page = Number(filterDto.items_per_page) || 10;
    const page = Number(filterDto.page) || 1;
    const search = filterDto.search || '';

    const skip = (page - 1) * items_per_page;

    const [res, total] = await this.articlesRepository.findAndCount({
      where: [
        {
          title: Like('%' + search + '%'),
        },
        {
          description: Like('%' + search + '%'),
        },
      ],

      take: items_per_page,
      skip: skip,
    });

    const lastPage = Math.ceil(total / items_per_page);
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

  async getArticleById(id: string): Promise<Article> {
    const found = await this.articlesRepository.findOne({ where: { id } });

    if (!found) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return found;
  }

  async createArticle(createArticleDto: CreateArticleDto): Promise<Article> {
    const { title, description, filename } = createArticleDto;
    const article = this.articlesRepository.create({
      title,
      description,
      filename,
    });
    await this.articlesRepository.save(article);
    return article;
  }

  async updateArticle(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.getArticleById(id);
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

    return await this.getArticleById(id); // Retrieve the updated article
  }

  async deleteArticle(id: string): Promise<void> {
    const result = await this.articlesRepository.delete(id);
    //if file is existed (id is correct) so result.affected = 1; else is 0
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }
}
