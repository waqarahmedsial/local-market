import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ItemStatus, ItemImportSource } from '@local-market/shared';

export type ItemDocument = Item & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Item {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CanonicalItem', default: null })
  canonicalId?: Types.ObjectId;

  @Prop({ required: true })
  rawName: string; // Original user input

  @Prop({ required: true })
  displayName: string; // Clean name shown publicly

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop()
  unit?: string;

  @Prop({ default: null })
  stock?: number;

  @Prop()
  imageUrl?: string;

  @Prop({ enum: ItemImportSource, default: ItemImportSource.MANUAL })
  importSource: ItemImportSource;

  @Prop({ enum: ItemStatus, default: ItemStatus.PENDING_REVIEW })
  status: ItemStatus;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

ItemSchema.virtual('id').get(function (this: ItemDocument) {
  return this._id.toHexString();
});

// Full-text search index
ItemSchema.index({ rawName: 'text', displayName: 'text' });
ItemSchema.index({ businessId: 1, status: 1 });
ItemSchema.index({ canonicalId: 1 });
