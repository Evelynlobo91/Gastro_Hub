import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtConfig } from '../../config/configuration';
import { AUTH_SERVICE } from '../../contracts';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenEntity } from './entities/refresh-token.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshTokenEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jwt = config.getOrThrow<JwtConfig>('jwt');
        return { secret: jwt.accessSecret, signOptions: { expiresIn: jwt.accessTtl } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, { provide: AUTH_SERVICE, useExisting: AuthService }],
  exports: [AuthService, AUTH_SERVICE, JwtModule],
})
export class AuthModule {}
