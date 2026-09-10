import 'reflect-metadata';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import dataSource from '../data-source';

/**
 * Seed de desenvolvimento (issue #6): duas marcas de exemplo + um usuário
 * platform_admin. Idempotente — não duplica se rodar de novo.
 */
async function run() {
  await dataSource.initialize();
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    for (const brand of [
      { name: 'Cozinha da Nonna', slug: 'cozinha-da-nonna' },
      { name: 'Sabor do Cerrado', slug: 'sabor-do-cerrado' },
    ]) {
      await runner.query(
        `INSERT INTO brands (name, slug) VALUES ($1, $2)
         ON CONFLICT (slug) DO NOTHING`,
        [brand.name, brand.slug],
      );
    }

    const adminEmail = 'admin@gastrohub.local';
    const exists = await runner.query(`SELECT 1 FROM users WHERE email = $1`, [adminEmail]);
    if (exists.length === 0) {
      const hash = await argon2.hash('Admin#Gastro123', { type: argon2.argon2id });
      const id = randomUUID();
      await runner.query(
        `INSERT INTO users (id, email, password_hash, full_name, role, status, email_verified_at)
         VALUES ($1, $2, $3, 'Administrador', 'platform_admin', 'active', now())`,
        [id, adminEmail, hash],
      );
      await runner.query(`INSERT INTO profiles (user_id) VALUES ($1)`, [id]);
      // eslint-disable-next-line no-console
      console.log(`Usuário admin criado: ${adminEmail} / Admin#Gastro123`);
    }

    await runner.commitTransaction();
    // eslint-disable-next-line no-console
    console.log('Seed concluído.');
  } catch (err) {
    await runner.rollbackTransaction();
    throw err;
  } finally {
    await runner.release();
    await dataSource.destroy();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
