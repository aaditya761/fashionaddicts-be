import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsNumber,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOptionDto {
  @ApiProperty({ description: 'Image URL' })
  @IsNotEmpty()
  @IsUrl()
  imageUrl: string;

  @ApiProperty({ description: 'Description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Price', required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ description: 'Store name', required: false })
  @IsOptional()
  @IsString()
  store?: string;

  @ApiProperty({ description: 'Product URL', required: false })
  @IsOptional()
  @IsUrl()
  url?: string;
}

export class CreatePostDto {
  @ApiProperty({ description: 'Post title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Options to vote on', type: [CreateOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}
