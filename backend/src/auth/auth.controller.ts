import {Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards, UsePipes} from '@nestjs/common';
import {AuthService} from './auth.service';
import {LocalAuthGuard} from './local-auth.guard';
import {JwtAuthGuard} from "./jwt-auth.guard";
import {CreateAuthDto, createAuthSchema} from "./dto/auth-register.dto";
import {ZodValidationPipe} from "../pipe/ZodValidationPipe";

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(createAuthSchema))
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() authRegisterDto: CreateAuthDto ) {
    return this.authService.register(authRegisterDto);
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
    return { message: 'Logout successful. Please discard your token on the client side.' };
  }
}
