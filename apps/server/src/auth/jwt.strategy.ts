import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'paperbox-erp-jwt-secret-change-in-production',
    });
  }

  async validate(payload: { sub: number; username: string; role: string }) {
    if (!payload || !payload.sub) return null;
    const account = await this.authService.getAccountById(payload.sub);
    if (!account || account.status !== 'active') return null;
    return { id: account.id, username: account.username, real_name: account.real_name, role: account.role };
  }
}
