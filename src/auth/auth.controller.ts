import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';
import { JwtPayload } from '../common/interfaces';
import { UsersService } from 'src/users/users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() email: string) {
    const user = await this.usersService.getUser(email);
    return this.authService.generateTokens(user.id, user.email);
  }

  @Post('refresh-token')
  getRefreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const newAccessToken: JwtPayload = this.authService.verifyRefreshToken(
      refreshTokenDto.token,
    );
    return { accessToken: newAccessToken };
  }

  // Redirects user to Google login page
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  // Google redirects to this endpoint after authentication
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    return {
      message: 'Google login successful',
      user: req.user,
    };
  }
}
