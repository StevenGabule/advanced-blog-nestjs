import {Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Request, UseGuards, UsePipes} from '@nestjs/common';
import {AuthService} from './auth.service';
import {LocalAuthGuard} from './local-auth.guard';
import {JwtAuthGuard} from "./jwt-auth.guard";
import {CreateAuthDto, createAuthSchema} from "./dto/auth-register.dto";
import {ZodValidationPipe} from "../pipe/ZodValidationPipe";
import {RefreshJwtAuthGuard} from "./refresh-jwt-auth.guard";
import {RefreshTokenDto} from "./dto/refresh-token.dto";

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(createAuthSchema))
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() authRegisterDto: CreateAuthDto ) {
    await this.authService.register(authRegisterDto);
    return {
      message: 'User registered successfully. Please check your email to verify your account.'
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    try {
      await this.authService.refreshTokenService.revokeAllUserRefreshTokens(req.user.id);
    } catch (err) {}
    return { message: 'Logout successful. Please discard your token on the client side.' };
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return {
      message: 'Email is verified successfully. You can now log in.'
    }
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Request() req) {// Get refresh token from body, user from guard
    // RefreshJwtAuthGuard validated the refresh token and attached the user to req.user
    // The token itself (string) needs to be passed in the body (or header) to revoke the old one
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}
