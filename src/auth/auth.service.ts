import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { username, email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmailOrUsername(
      email,
      username,
    );
    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already in use');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already taken');
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await this.usersService.create({
      username,
      email,
      password: hashedPassword,
    });

    // Generate token
    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  private generateToken(userId: number): string {
    const payload: JwtPayload = { sub: userId };
    return this.jwtService.sign(payload);
  }

  async validateUser(payload: JwtPayload) {
    return this.usersService.findById(payload.sub);
  }
}
