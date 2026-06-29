import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Account } from '../entities/accounts';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<Account | null> {
    if (!password) return null;
    const account = await this.accountRepo.findOne({ where: { username } });
    if (!account || !account.password) return null;

    const valid = await bcrypt.compare(password, account.password);
    if (!valid) return null;
    return account;
  }

  async login(username: string, password: string) {
    const account = await this.validateUser(username, password);
    if (!account) throw new UnauthorizedException('用户名或密码错误');

    const payload = { sub: account.id, username: account.username, role: account.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: account.id, username: account.username, real_name: account.real_name, role: account.role },
    };
  }

  async getAccountById(id: number) {
    return this.accountRepo.findOne({ where: { id } });
  }
}
