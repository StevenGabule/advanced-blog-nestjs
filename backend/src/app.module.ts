import {Module, ValidationPipe} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {PostController} from './post/post.controller';
import {PostService} from './post/post.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuthModule} from './auth/auth.module';
import {User} from './users/user.entity';
import {ProfileController} from './profile/profile.controller';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {APP_FILTER} from "@nestjs/core";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User],
        synchronize: configService.get<boolean>('TYPEORM_SYNCHRONIZE', configService.get<string>('NODE_ENV') !== 'production'),
      }),
    }),
    AuthModule,
  ],
  controllers: [AppController, PostController, ProfileController],
  providers: [
    AppService,
    PostService,
    {
      provide: APP_FILTER,
      useClass: ValidationPipe
    }
  ],
})
export class AppModule {}
