import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CanonicalItem, CanonicalItemSchema, ItemVariation, ItemVariationSchema } from './canonical.schema';
import { CanonicalService } from './canonical.service';
import { CanonicalController } from './canonical.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CanonicalItem.name, schema: CanonicalItemSchema },
      { name: ItemVariation.name, schema: ItemVariationSchema },
    ]),
  ],
  providers: [CanonicalService],
  controllers: [CanonicalController],
  exports: [CanonicalService],
})
export class CanonicalModule {}
