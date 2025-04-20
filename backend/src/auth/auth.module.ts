import {Module} from '@nestjs/common';
import {UsersModule} from '../users/users.module';
import {PassportModule} from '@nestjs/passport';
import {JwtModule} from '@nestjs/jwt';
import {AuthService} from './auth.service';
import {AuthController} from './auth.controller';
import {LocalStrategy} from './local.strategy';
import {JwtStrategy} from './jwt.strategy';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {MailModule} from "../mail/mail.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {RefreshToken} from "./refresh-token.entity";
import {RefreshTokenService} from "./refresh-token.service";
import {RefreshJwtStrategy} from "./refresh-jwt.strategy";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {expiresIn: '60m'},
      }),
    }),
    TypeOrmModule.forFeature([RefreshToken]),
    ConfigModule
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, RefreshTokenService, RefreshJwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {
}
