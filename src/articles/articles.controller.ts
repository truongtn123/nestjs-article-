import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-atricle.dto';
import { Article } from './article.entity';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetArticlesFilterDto } from './dto/get-articles-filter.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { storageConfig } from 'utils/storage.config';

@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

  @Get()
  getArticles(@Query() filterDto: GetArticlesFilterDto): Promise<any> {
    return this.articlesService.getArticles(filterDto);
  }

  @Get('/:id')
  getArticleById(@Param('id') id: string): Promise<Article> {
    return this.articlesService.getArticleById(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storageConfig('article'),
      limits: {
        fileSize: 5 * 1024 * 1024, // max size 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
    }),
  )
  createArticle(
    @Body() createArticleDto: CreateArticleDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Article> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.articlesService.createArticle({
      ...createArticleDto,
      filename: file.destination + '/' + file.filename,
    });
  }

  @Patch('/:id/update')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storageConfig('article'),
      limits: {
        fileSize: 5 * 1024 * 1024, // max size 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
    }),
  )
  updateArticle(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Article> {
    if (file) {
      updateArticleDto.filename = file.destination + '/' + file.filename;
    }
    return this.articlesService.updateArticle(id, updateArticleDto);
  }

  @Delete('/:id')
  deleteArticle(@Param('id') id: string): Promise<void> {
    return this.articlesService.deleteArticle(id);
  }
}
