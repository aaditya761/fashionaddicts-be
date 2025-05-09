import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVoteDto {
  @ApiProperty({ description: 'Option ID to vote for' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  optionId: number;
}
