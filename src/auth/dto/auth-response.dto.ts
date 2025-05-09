import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  token: string;

  @ApiProperty({ description: 'User details' })
  user: {
    id: number;
    username: string;
    email: string;
  };
}
