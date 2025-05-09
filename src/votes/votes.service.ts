import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote } from './entities/vote.entity';
import { Option } from '../posts/entities/option.entity';
import { Post } from '../posts/entities/post.entity';
import { CreateVoteDto } from './dto/create-vote.dto';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private readonly votesRepository: Repository<Vote>,

    @InjectRepository(Option)
    private readonly optionsRepository: Repository<Option>,

    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async create(
    postId: number,
    userId: number,
    createVoteDto: CreateVoteDto,
  ): Promise<Vote> {
    const { optionId } = createVoteDto;

    // Check if post exists
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['options'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Check if option exists and belongs to the post
    const option = post.options.find((opt) => opt.id === optionId);
    if (!option) {
      throw new NotFoundException(
        `Option with ID ${optionId} not found in post ${postId}`,
      );
    }

    // Check if user has already voted on this post
    const existingVote = await this.votesRepository
      .createQueryBuilder('vote')
      .innerJoin('vote.option', 'option')
      .where('option.postId = :postId', { postId })
      .andWhere('vote.userId = :userId', { userId })
      .getOne();

    if (existingVote) {
      throw new ConflictException(`You have already voted on post ${postId}`);
    }

    // Create vote
    const vote = this.votesRepository.create({
      userId,
      optionId,
    });

    return this.votesRepository.save(vote);
  }

  async findAll(
    postId: number,
  ): Promise<{ optionId: number; count: number }[]> {
    // Check if post exists
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['options'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Get vote counts for each option
    const voteCounts = await Promise.all(
      post.options.map(async (option) => {
        const count = await this.votesRepository.count({
          where: { optionId: option.id },
        });

        return { optionId: option.id, count };
      }),
    );

    return voteCounts;
  }

  async findByUser(userId: number): Promise<Vote[]> {
    return this.votesRepository.find({
      where: { userId },
      relations: ['option', 'option.post'],
    });
  }

  async hasVoted(
    postId: number,
    userId: number,
  ): Promise<{ hasVoted: boolean; optionId?: number }> {
    const existingVote = await this.votesRepository
      .createQueryBuilder('vote')
      .innerJoin('vote.option', 'option')
      .where('option.postId = :postId', { postId })
      .andWhere('vote.userId = :userId', { userId })
      .getOne();

    if (existingVote) {
      return { hasVoted: true, optionId: existingVote.optionId };
    }

    return { hasVoted: false };
  }
}
