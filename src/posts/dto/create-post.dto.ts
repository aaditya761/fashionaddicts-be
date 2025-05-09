import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOptionDto {
  @ApiProperty({ description: 'Image URL' })
  @IsNotEmpty()
  @IsUrl()
  url: string;
}

export class CreatePostDto {
  @ApiProperty({ description: 'Post title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Options to vote on', type: [CreateOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}
