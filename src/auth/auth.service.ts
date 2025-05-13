import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../common/interfaces';
import { OAuth2Client } from 'google-auth-library';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly usersService: UsersService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  generateTokens(userId: number, email: string) {
    const payload: JwtPayload = { sub: userId, email };
    // Create Access Token
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m', // Access token expires in 15 minutes
    });

    // Create Refresh Token (Longer Expiry)
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d', // Refresh token expires in 7 days
    });

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (error: any) {
      console.error(error);
      return null;
    }
  }

  async verifyGoogleToken(token: string) {
    try {
      // Verify the ID token with Google
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new HttpException(
          'Invalid token payload',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Add type assertion for the payload
      const { email, picture } = payload as {
        sub: string;
        email: string;
        picture: string;
      };

      // Check if email exists to satisfy TypeScript
      if (!email) {
        throw new HttpException('Email is required', HttpStatus.UNAUTHORIZED);
      }

      // Find or create user in your database
      let user = await this.usersService.findByEmail(email);

      if (!user) {
        // Create new user if not found
        user = await this.usersService.create({
          email,
          profilePicture: picture,
        });
      }

      return {
        access_token: this.generateTokens(user.id, user.email),
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new HttpException(
        'Google authentication failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
