import { Body, Controller, Get, Post } from '@nestjs/common';
import { createPostDto } from '../dto/post.dto';

@Controller('post')
export class PostController {
  @Get()
  findAll(): string {
    return 'Hello PostController';
  }

  @Post()
  async create(@Body() createPostDto: createPostDto) {
    console.log({ createPostDto });
    return Promise.resolve(null);
  }
}
