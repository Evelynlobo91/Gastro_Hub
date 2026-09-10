import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

loadEnv();

/**
 * DataSource usado tanto pelo runtime (via DatabaseModule) quanto pela CLI de
 * migrations do TypeORM (issue #6 — migrations iniciais).
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'gastrohub',
  password: process.env.DB_PASSWORD ?? 'gastrohub',
  database: process.env.DB_NAME ?? 'gastrohub',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/../../features/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'schema_migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'migration'] : ['error'],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
