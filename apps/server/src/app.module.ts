import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    // SQLite erp.db from original paperbox-erp location
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: '/data/erp-data/erp-system/erp.db',
      entities: [],           // populated per feature module
      synchronize: false,
      logging: false,
    }),
  ],
})
export class AppModule {}
