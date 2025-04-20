import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {RefreshToken} from "./refresh-token.entity";
import {Repository} from "typeorm";
import {ConfigService} from "@nestjs/config";
import {User} from "../users/user.entity";
import {v4 as uuidV4} from 'uuid'

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private configService: ConfigService
  ) {
  }

  async createRefreshToken(user: User): Promise<RefreshToken> {
    const expiresIn = this.configService.get<number>('REFRESH_TOKEN_EXPIRY_DAYS', 7) * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiresIn);
    const refreshToken = this.refreshTokenRepository.create({
      token: uuidV4(),
      user: user,
      userId: user.id,
      expiresAt: expiresAt,
      isRevoked: false,
    });
    await this.refreshTokenRepository.save(refreshToken);
    return refreshToken;
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findOne({
      where: {token, isRevoked: false},
      relations: ['user']
    })
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update({token}, {isRevoked: true});
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update({userId, isRevoked: false}, {isRevoked: true})
  }
}
