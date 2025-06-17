import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsUrl,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PostType {
  CHOOSE = 'choose',
  LOOK = 'look',
}

export interface LinkPreviewResponse {
  url?: string;
  title?: string;
  description?: string;
  images?: string[];
  siteName?: string;
  mediaType?: string;
  contentType?: string;
  favicons?: string[];
}

export class CreateLinkPreviewDto {
  @ApiProperty({ description: 'Product URL' })
  @IsNotEmpty()
  @IsUrl()
  url: string;
}

export class CreateOptionDto {
  @ApiProperty({ description: 'Product URL' })
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Product image' })
  @IsUrl()
  image: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Site name' })
  @IsString()
  siteName: string;
}

export class CreatePostDto {
  @ApiProperty({ description: 'Post title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsEnum(PostType)
  postType?: PostType = PostType.CHOOSE;

  @ApiProperty({ description: 'Options to vote on', type: [CreateOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}
