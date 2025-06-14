import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreateLinkPreviewDto, CreateOptionDto, CreatePostDto } from './dto/create-post.dto';
import { FilterPostsDto } from './dto/filter-posts.dto';
import { Public } from '../auth/auth.public';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  create(@Request() req, @Body() createPostDto: CreatePostDto) {
    return this.postsService.create(req.user.sub, createPostDto);
  }

  @Post('link-preview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get link preview' })
  @ApiResponse({ status: 200, description: 'Preview fetch successfully' })
  getPreview(@Request() req, @Body() url: CreateLinkPreviewDto) {
    return this.postsService.getLinkPreview(url);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all posts with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Returns posts' })
  async findAll(@Request() req, @Query() filterDto: FilterPostsDto) {
    // Get user ID if authenticated, otherwise null
    const userId = req.user?.id || null;
    return this.postsService.findAll(userId, filterDto);
  }


  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Returns the post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    // Get user ID if authenticated, otherwise null
    const userId: number = req.user.sub;
    return this.postsService.findOne(id, userId);
  }

  @Get('user/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's posts" })
  @ApiResponse({ status: 200, description: "Returns the user's posts" })
  getUserPosts(@Request() req) {
    return this.postsService.getUserPosts(req.user.id);
  }

  @Get('user/votes')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's votes" })
  @ApiResponse({ status: 200, description: "Returns the user's votes" })
  getUserVotes(@Request() req) {
    return this.postsService.getUserVotes(req.user.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(id, req.user.id);
  }
}
