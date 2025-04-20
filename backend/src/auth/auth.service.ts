import {BadRequestException, ForbiddenException, Injectable, UnauthorizedException} from '@nestjs/common';
import {UsersService} from '../users/users.service';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {User} from "../users/user.entity";
import {JwtPayload} from "./interfaces/jwt-payload.interface";
import {AuthRegisterDto} from "./dto/auth-register.dto";
import {ConfigService} from "@nestjs/config";
import {RefreshTokenService} from "./refresh-token.service";
import {v4 as uuidv4} from "uuid";
import {MailService} from "../mail/mail.service";

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
    public refreshTokenService: RefreshTokenService
  ) {
  }

  async validateUser(username: string, pass: string): Promise<User | null> {
    const user = await this.userService.findOne(username);
    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      return null;
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Please verify your email address to log in.')
    }

    const {password, ...result} = user;
    return result as User;
  }

  async login(user: { username: string; id: string }) {
    const payloadTokenPayload: JwtPayload = {username: user.username, sub: user.id};
    const accessToken = this.jwtService.sign(payloadTokenPayload);

    const refreshToken = await this.refreshTokenService.createRefreshToken(user as User)

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN')
    };
  }

  async register(authRegister: AuthRegisterDto): Promise<User | null> {
    const user = await this.userService.create(authRegister);
    const verificationToken = uuidv4();
    const verificationTokenExpiresAt = new Date(Date.now() + this.configService.get<number>('VERIFICATION_TOKEN_EXPIRY_HOURS', 24) * 60 * 60 * 1000);

    await this.userService.update(user.id, {
      verificationToken,
      verificationTokenExpiresAt,
      isVerified: false
    })

    const verificationLink = `${this.configService.get<string>('APP_BASE_URL')}/auth/verify-email?token=${verificationToken}`;
    const emailHtml = `<p>Please verify your email by clicking the link: <a href="${verificationLink}">Verify Email</a></p>`;
    const emailText = `Please verify your email by visiting the link: ${verificationLink}`;

    // Don't block registration response on email sending, handle errors asynchronously
    this.mailService.sendMail(user.username, 'Verify Your Email', emailHtml, emailText).catch(console.error);

    return user;
  }

  async verifyEmail(token: string): Promise<User> {
    if (!token) {
      throw new BadRequestException('Verification token is required.')
    }

    const user = await this.userService.findOneByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid verification token.');
    }

    // check if token has expired
    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired.');
    }

    await this.userService.update(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null
    })

    const {password, ...result} = user;
    return result as User;
  }

  async refreshToken(token: string) {
    const refreshTokenEntity = await this.refreshTokenService.findRefreshToken(token);
    if (!refreshTokenEntity || refreshTokenEntity.isRevoked || refreshTokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token.')
    }

    const user = refreshTokenEntity.user;

    if (!user) {
      throw new UnauthorizedException('Refresh token user not found.');
    }

    if (!user.isVerified) {
      // If you allow refreshing but user becomes unverified later, you might throw
      // Or, the access token validation should catch this if you include isVerified in payload
      // and JwtStrategy checks it. For now, login is restricted, refresh is allowed if token is valid.
      // Consider your desired flow here.
      throw new ForbiddenException('User not verified.');
    }

    // revoke the old refresh token
    await this.refreshTokenService.revokeRefreshToken(token);

    // generate a new access token
    const accessTokenPayload: JwtPayload = {username: user.username, sub: user.id};
    const accessToken = this.jwtService.sign(accessTokenPayload);

    // generate a new refresh token (Token rotation)
    const refreshToken = await this.refreshTokenService.createRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN')
    }
  }
}
