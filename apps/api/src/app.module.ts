import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BusinessesModule } from './businesses/businesses.module';
import { ItemsModule } from './items/items.module';
import { CanonicalModule } from './canonical/canonical.module';
import { CategoriesModule } from './categories/categories.module';
import { AiModule } from './ai/ai.module';
import { SearchModule } from './search/search.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({ isGlobal: true }),

    // MongoDB via Mongoose
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://localhost:27017/local-market'),
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Feature modules
    AuthModule,
    UsersModule,
    BusinessesModule,
    ItemsModule,
    CanonicalModule,
    CategoriesModule,
    AiModule,
    SearchModule,
    AuditModule,
  ],
})
export class AppModule {}
