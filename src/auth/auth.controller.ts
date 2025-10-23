import {
  Body,
  Controller,
  Post,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { Public } from './auth.public';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.NOT_FOUND);
    }
    return this.authService.generateTokens(user.id, user.email);
  }

  @Public()
  @Post('access-token')
  getAccessTokenFromRefreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.getAccessTokenFromRefreshToken(
      refreshTokenDto.token,
    );
  }

  @Post('refresh-token')
  getRefreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const newAccessToken = this.authService.verifyRefreshToken(
      refreshTokenDto.token,
    );
    return { accessToken: newAccessToken };
  }

  @Public()
  @Post('google/verify')
  async verifyGoogleToken(@Body() body: { credential: string }) {
    try {
      if (!body.credential) {
        throw new HttpException(
          'No credential provided',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Verify and process the token
      const userData = await this.authService.verifyGoogleToken(
        body.credential,
      );
      return userData;
    } catch (error) {
      throw new HttpException(
        error.message || 'Authentication failed',
        error.status || HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
