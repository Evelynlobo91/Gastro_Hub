import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USERS_SERVICE } from '../../contracts';
import { ProfileEntity } from './entities/profile.entity';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ProfileEntity])],
  providers: [UsersService, { provide: USERS_SERVICE, useExisting: UsersService }],
  exports: [UsersService, USERS_SERVICE],
})
export class UsersModule {}
