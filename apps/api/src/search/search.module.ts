import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Item, ItemSchema } from '../items/item.schema';
import { ItemVariation, ItemVariationSchema } from '../canonical/canonical.schema';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: ItemVariation.name, schema: ItemVariationSchema },
    ]),
    AiModule,
  ],
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
