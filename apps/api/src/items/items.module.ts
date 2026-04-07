import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Item, ItemSchema } from './item.schema';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { AiModule } from '../ai/ai.module';
import { CanonicalModule } from '../canonical/canonical.module';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
    AiModule,
    CanonicalModule,
    BusinessesModule,
  ],
  providers: [ItemsService],
  controllers: [ItemsController],
  exports: [ItemsService],
})
export class ItemsModule {}
