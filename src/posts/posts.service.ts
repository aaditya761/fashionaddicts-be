import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Option } from './entities/option.entity';
import { Vote } from '../votes/entities/vote.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { FilterPostsDto, FilterType } from './dto/filter-posts.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,

    @InjectRepository(Option)
    private readonly optionsRepository: Repository<Option>,

    @InjectRepository(Vote)
    private readonly votesRepository: Repository<Vote>,
  ) {}

  async create(userId: number, createPostDto: CreatePostDto): Promise<Post> {
    // Create post
    const post = this.postsRepository.create({
      title: createPostDto.title,
      description: createPostDto.description,
      user: { id: userId },
    });

    // Save post to get ID
    const savedPost = await this.postsRepository.save(post);

    // Create options
    const options = createPostDto.options.map((optionDto) =>
      this.optionsRepository.create({
        ...optionDto,
        post: { id: savedPost.id },
      }),
    );

    // Save options
    savedPost.options = await this.optionsRepository.save(options);

    return savedPost;
  }

  async findAll(
    userId: number | null,
    filterDto: FilterPostsDto,
  ): Promise<{ posts: Post[]; total: number }> {
    const { page, limit, filter } = filterDto;
    const skip = (page || 0 - 1) * (limit || 1);

    // Create base query builder
    let queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.options', 'option')
      .leftJoinAndSelect('post.comments', 'comment')
      .loadRelationCountAndMap('post.commentCount', 'post.comments');

    // Add order based on filter type
    switch (filter) {
      case FilterType.POPULAR:
        queryBuilder = queryBuilder
          .leftJoin('option.votes', 'vote')
          .addSelect('COUNT(vote.id)', 'voteCount')
          .groupBy('post.id, user.id, option.id, comment.id')
          .orderBy('voteCount', 'DESC');
        break;
      case FilterType.TRENDING:
        // Trending is a mix of recent and popular
        queryBuilder = queryBuilder
          .leftJoin('option.votes', 'vote')
          .addSelect('COUNT(vote.id)', 'voteCount')
          .addSelect('post.createdAt', 'postDate')
          .groupBy('post.id, user.id, option.id, comment.id, post.createdAt')
          // Custom formula: recent posts get a boost
          .orderBy(
            '(COUNT(vote.id) * 0.7) + (EXTRACT(EPOCH FROM post.createdAt) / 10000000 * 0.3)',
            'DESC',
          );
        break;
      case FilterType.RECENT:
      default:
        queryBuilder = queryBuilder.orderBy('post.createdAt', 'DESC');
        break;
    }

    // Execute query with pagination
    const [posts, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Enhanced post data with vote counts and user vote info
    const enhancedPosts = await Promise.all(
      posts.map(async (post) => {
        // Calculate vote counts for each option
        for (const option of post.options) {
          const voteCount = await this.votesRepository.count({
            where: { option: { id: option.id } },
          });
          option.votesCount = voteCount;
        }

        return post;
      }),
    );

    return { posts: enhancedPosts, total };
  }

  async findOne(id: number, userId: number | null): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['user', 'options', 'comments', 'comments.user'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Calculate vote counts for each option
    for (const option of post.options) {
      const voteCount = await this.votesRepository.count({
        where: { option: { id: option.id } },
      });
      option.votesCount = voteCount;
    }

    return post;
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    const posts = await this.postsRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'options', 'comments'],
      order: { createdAt: 'DESC' },
    });

    // Calculate vote counts for each post's options
    for (const post of posts) {
      // Calculate total votes
      let totalVotes = 0;

      for (const option of post.options) {
        const voteCount = await this.votesRepository.count({
          where: { option: { id: option.id } },
        });
        option.votesCount = voteCount;
        totalVotes += voteCount;
      }
      console.log(totalVotes);
    }

    return posts;
  }

  async getUserVotes(userId: number): Promise<{ post: Post }[]> {
    // Find all votes by the user
    const votes = await this.votesRepository.find({
      where: { user: { id: userId } },
      relations: ['option', 'option.post', 'option.post.user'],
      order: { createdAt: 'DESC' },
    });

    // Format the results
    return votes.map((vote) => ({
      post: vote.option.post,
    }));
  }

  async remove(id: number, userId: number): Promise<void> {
    const post = await this.findOne(id, userId);

    // Check if user owns the post
    if (post.user.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this post',
      );
    }

    await this.postsRepository.remove(post);
  }
}
