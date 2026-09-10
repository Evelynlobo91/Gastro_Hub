import { Global, Module } from '@nestjs/common';
import { PgCryptoService } from './pgcrypto.service';

@Global()
@Module({
  providers: [PgCryptoService],
  exports: [PgCryptoService],
})
export class CryptoModule {}
