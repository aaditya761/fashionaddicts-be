import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './entities/post.entity';
import { Option } from './entities/option.entity';
import { Vote } from '../votes/entities/vote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Option, Vote])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
