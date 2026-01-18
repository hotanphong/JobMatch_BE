import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const databaseConfig: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const dbHost = config.get<string>('DB_HOST');
    const dbPort = config.get<number>('DB_PORT');
    const dbUsername = config.get<string>('DB_USERNAME');
    const dbPassword = config.get<string>('DB_PASSWORD');
    const dbDatabase = config.get<string>('DB_DATABASE');

    if (!dbHost || !dbPort || !dbUsername || !dbPassword || !dbDatabase) {
      throw new Error('Missing required database environment variables');
    }

    return {
      type: 'postgres',
      host: dbHost,
      port: dbPort,
      username: dbUsername,
      password: dbPassword,
      database: dbDatabase,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrationsRun: true,
      synchronize: true,
      logging: process.env.NODE_ENV !== 'production',
    };
  },
};
