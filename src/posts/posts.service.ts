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
import { CreateLinkPreviewDto, CreateOptionDto, CreatePostDto } from './dto/create-post.dto';
import { FilterPostsDto } from './dto/filter-posts.dto';
import * as puppeteer from 'puppeteer';

export interface LinkPreview {
  url: string;
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
  private browser: puppeteer.Browser | null = null;

  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,

    @InjectRepository(Option)
    private readonly optionsRepository: Repository<Option>,

    @InjectRepository(Vote)
    private readonly votesRepository: Repository<Vote>,
  ) {}

  private async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
        ],
      });
    }
    return this.browser;
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  async getLinkPreview(url: string): Promise<LinkPreview> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Set a realistic user agent
      await page.setUserAgent(this.getRandomUserAgent());

      // Set viewport to a common desktop resolution
      await page.setViewport({ width: 1920, height: 1080 });

      // Set extra headers to appear more like a real browser
      await page.setExtraHTTPHeaders({
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'Sec-Ch-Ua':
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      });

      // Add a small delay to avoid being flagged as a bot
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Wait a bit for dynamic content to load
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Extract metadata
      const metadata = await page.evaluate(() => {
        const getMetaContent = (
          name: string,
          property?: string,
        ): string | undefined => {
          const meta = document.querySelector(
            `meta[name="${name}"], meta[property="${property}"]`,
          ) as HTMLMetaElement;
          return meta?.content;
        };

        const getFavicon = (): string | undefined => {
          const favicon = document.querySelector(
            'link[rel="icon"], link[rel="shortcut icon"]',
          ) as HTMLLinkElement;
          return favicon?.href;
        };

        const getImages = (): string[] => {
          const images = Array.from(document.querySelectorAll('img'));
          return images
            .map((img) => img.src)
            .filter((src) => src && src.startsWith('http'))
            .slice(0, 5); // Limit to first 5 images
        };

        return {
          title: document.title || getMetaContent('title'),
          description:
            getMetaContent('description') || getMetaContent('og:description'),
          image: getMetaContent('og:image') || getMetaContent('twitter:image'),
          siteName:
            getMetaContent('og:site_name') ||
            getMetaContent('application-name'),
          favicon: getFavicon(),
          images: getImages(),
        };
      });

      return {
        url: url,
        title: metadata.title,
        description: metadata.description,
        image: metadata.image,
        siteName: metadata.siteName,
        favicons: metadata.favicon ? [metadata.favicon] : [],
      };
    } catch (error) {
      console.error('Error fetching link preview:', error);

      // Return a fallback response
      return {
        url: url,
        title: 'Unable to fetch preview',
        description: 'The link preview could not be loaded at this time.',
      };
    } finally {
      await page.close();
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
