import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('votes')
@Controller('posts/:postId/votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote for an option in a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({ status: 201, description: 'Vote created successfully' })
  @ApiResponse({ status: 404, description: 'Post or option not found' })
  @ApiResponse({
    status: 409,
    description: 'User has already voted on this post',
  })
  create(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req,
    @Body() createVoteDto: CreateVoteDto,
  ) {
    return this.votesService.create(postId, req.user.id, createVoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get vote counts for a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns vote counts for each option',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  findAll(@Param('postId', ParseIntPipe) postId: number) {
    return this.votesService.findAll(postId);
  }

  @Get('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user has voted on a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Returns voting status' })
  hasVoted(@Param('postId', ParseIntPipe) postId: number, @Request() req) {
    return this.votesService.hasVoted(postId, req.user.id);
  }
}
