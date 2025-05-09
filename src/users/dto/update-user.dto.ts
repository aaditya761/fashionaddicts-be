import {
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ description: 'Email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Password', required: false })
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiProperty({ description: 'User bio/description', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}
