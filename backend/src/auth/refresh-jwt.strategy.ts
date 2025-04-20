import {Injectable, UnauthorizedException} from "@nestjs/common";
import {PassportStrategy} from "@nestjs/passport";
import {ExtractJwt, Strategy} from "passport-jwt";
import {ConfigService} from "@nestjs/config";
import {RefreshTokenService} from "./refresh-token.service";
import {Request} from 'express'

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private refreshTokenService: RefreshTokenService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      passReqToCallback: true
    });
  }

  async validate(req: Request, payload: any) {
    // The payload is the decoded access token payload (from the *original* token)
    // We don't primarily validate the *payload* here, but the *refresh token itself*
    // The refresh token should be sent in the request body or a custom header
    const refreshToken = req.body.refreshToken || req.get('x-refresh-token')

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided.');
    }

    // validate the refresh token against the database
    const tokenEntity = await this.refreshTokenService.findRefreshToken(refreshToken);

    if(!tokenEntity || tokenEntity.isRevoked || tokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token.')
    }

    // Attach the user from the refresh token entity to the request
    // The user object will be available in the controller via req.user
    return tokenEntity.user;
  }
}
