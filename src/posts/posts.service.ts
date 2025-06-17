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
import {
  CreateLinkPreviewDto,
  CreatePostDto,
  LinkPreviewResponse,
} from './dto/create-post.dto';
import { FilterPostsDto } from './dto/filter-posts.dto';
import { getLinkPreview } from 'link-preview-js';
import * as puppeteer from 'puppeteer';

interface Metadata {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  mediaType?: string;
  contentType?: string;
  favicons?: string[];
}

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

  async getMetadataWithPuppeteer(url: string): Promise<Metadata> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36',
    );

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const data = await page.evaluate(() => {
      const getMeta = (selector: string) =>
        document.querySelector(selector)?.getAttribute('content') || '';

      return {
        title: document.title,
        description: getMeta("meta[name='description']"),
        image: getMeta("meta[property='og:image']"),
        siteName: getMeta("meta[property='og:site_name']"),
      };
    });

    await browser.close();
    return data;
  }

  async getLinkPreview(
    url: CreateLinkPreviewDto,
  ): Promise<LinkPreviewResponse> {
    try {
      const preview: LinkPreviewResponse = await getLinkPreview(url.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      const isIncomplete =
        !preview.description &&
        (!('images' in preview) || !preview.images?.length) &&
        !('siteName' in preview);

      if (isIncomplete) {
        console.warn('Fallback to Puppeteer due to incomplete data.');
        const puppeteerData = await this.getMetadataWithPuppeteer(url.url);
        return {
          ...preview,
          ...puppeteerData,
        };
      }

      return preview;
    } catch (err: any) {
      console.warn('Primary preview failed, using Puppeteer fallback...', err);
      return await this.getMetadataWithPuppeteer(url.url);
    }
  }

  async create(userId: number, createPostDto: CreatePostDto): Promise<Post> {
    // Create post
    const post = this.postsRepository.create({
      title: createPostDto.title,
      description: createPostDto.description,
      user: { id: userId },
      type: createPostDto.postType,
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
    const { page, limit } = filterDto;
    const skip = ((page || 1) - 1) * (limit || 1);

    // Create base query builder
    let queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.options', 'option')
      .leftJoinAndSelect('post.comments', 'comment')
      .leftJoinAndSelect('comment.user', 'commentUser')
      .loadRelationCountAndMap('post.commentCount', 'post.comments');

    queryBuilder = queryBuilder.orderBy('post.createdAt', 'DESC');

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

  async findOne(id: number, userId: number): Promise<Post> {
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
      const vote = await this.votesRepository.findOne({
        where: { option: { id: option.id }, user: { id: userId } },
      });
      if (vote) {
        post['hasUserVoted'] = true;
        post['votedOption'] = option;
      }
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
