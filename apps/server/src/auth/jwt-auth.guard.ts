import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    // console.log('[JwtAuthGuard] err:', err, 'user:', user, 'info:', info?.message);
    if (err || !user) {
      throw err || new UnauthorizedException('未认证，请先登录');
    }
    return user;
  }
}
