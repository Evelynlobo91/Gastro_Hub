import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import { DatabaseConfig } from '../../config/configuration';

/**
 * Cifragem em repouso de dados sensíveis via pgcrypto (issue #7 / LGPD).
 *
 * As colunas sensíveis (`*_enc`) são `bytea` e nunca trafegam em claro no banco:
 * a (de)cifragem acontece dentro do PostgreSQL com `pgp_sym_encrypt/decrypt`,
 * usando a chave simétrica de `DB_ENCRYPTION_KEY` (mantida fora do banco).
 */
@Injectable()
export class PgCryptoService {
  constructor(private readonly config: ConfigService) {}

  private get key(): string {
    return this.config.getOrThrow<DatabaseConfig>('database').encryptionKey;
  }

  /**
   * Grava valores cifrados nas colunas `*_enc` de uma linha já existente.
   * `columns` mapeia nome da coluna -> valor em claro (undefined é ignorado).
   */
  async writeEncrypted(
    manager: EntityManager,
    table: string,
    rowId: string,
    columns: Record<string, string | undefined | null>,
  ): Promise<void> {
    const entries = Object.entries(columns).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return;

    const sets = entries.map(
      ([col], i) =>
        `${col} = CASE WHEN $${i + 3} IS NULL THEN NULL ELSE pgp_sym_encrypt($${i + 3}, $1) END`,
    );
    const params = [this.key, rowId, ...entries.map(([, v]) => v ?? null)];
    await manager.query(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = $2`, params);
  }

  /** Lê e decifra as colunas `*_enc` indicadas de uma linha. */
  async readEncrypted(
    manager: EntityManager,
    table: string,
    rowId: string,
    columns: string[],
  ): Promise<Record<string, string | null>> {
    if (columns.length === 0) return {};
    const selects = columns.map(
      (col) => `CASE WHEN ${col} IS NULL THEN NULL ELSE pgp_sym_decrypt(${col}, $1) END AS ${col}`,
    );
    const rows = await manager.query(`SELECT ${selects.join(', ')} FROM ${table} WHERE id = $2`, [
      this.key,
      rowId,
    ]);
    return rows[0] ?? {};
  }
}
