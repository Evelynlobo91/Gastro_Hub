import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser, TokenPair } from '../../contracts';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Cadastro de cliente (issue #7)' })
  register(@Body() dto: RegisterDto): Promise<TokenPair> {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login — retorna par de tokens JWT' })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<TokenPair> {
    return this.auth.login(dto, { ip: req.ip, userAgent: req.headers['user-agent'] });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotação de refresh token' })
  refresh(@Body() dto: RefreshDto, @Req() req: Request): Promise<TokenPair> {
    return this.auth.refresh(dto.refreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga a família de refresh tokens da sessão' })
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  @ApiOperation({ summary: 'Dados do usuário autenticado' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    const [summary, profile] = await Promise.all([
      this.users.findById(user.id),
      this.users.getProfile(user.id),
    ]);
    return { ...summary, profile };
  }
}
