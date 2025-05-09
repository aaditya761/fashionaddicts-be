import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,

    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async create(
    postId: number,
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    // Check if post exists
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Create comment
    const comment = this.commentsRepository.create({
      text: createCommentDto.text,
      userId,
      postId,
    });

    return this.commentsRepository.save(comment);
  }

  async findByPostId(postId: number): Promise<Comment[]> {
    // Check if post exists
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    return this.commentsRepository.find({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Check if user owns the comment
    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    await this.commentsRepository.remove(comment);
  }
}
