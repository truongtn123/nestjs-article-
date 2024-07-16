import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-atricle.dto';
import { Article } from './article.entity';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetArticlesFilterDto } from './dto/get-articles-filter.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { storageConfig } from 'utils/storage.config';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

  @Get()
  @UseGuards(AuthGuard)
  getArticles(
    @Query() filterDto: GetArticlesFilterDto,
    @Req() req: Request,
  ): Promise<any> {
    const userId = req['user'].id;
    return this.articlesService.getArticles(filterDto, userId);
  }

  @Get('/:id')
  @UseGuards(AuthGuard)
  getArticleById(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Article> {
    const userId = req['user'].id;

    return this.articlesService.getArticleById(id, userId);
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
  @UseGuards(AuthGuard)
  createArticle(
    @Req() req: Request,
    @Body() createArticleDto: CreateArticleDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Article> {
    const userId = req['user'].id;

    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.articlesService.createArticle(
      {
        ...createArticleDto,
        filename: file.destination + '/' + file.filename,
      },
      userId,
    );
  }

  @Patch('/:id/update')
  @UseGuards(AuthGuard)
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
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Article> {
    const userId = req['user'].id;

    if (file) {
      updateArticleDto.filename = file.destination + '/' + file.filename;
    }
    return this.articlesService.updateArticle(id, updateArticleDto, userId);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  deleteArticle(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const userId = req['user'].id;
    return this.articlesService.deleteArticle(id, userId);
  }
}
