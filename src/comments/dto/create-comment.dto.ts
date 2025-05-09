import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment text' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  text: string;
}
