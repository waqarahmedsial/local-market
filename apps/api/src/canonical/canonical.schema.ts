import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CanonicalStatus, VariationStatus } from '@local-market/shared';

// ─── Layer 1: Canonical (Truth) ───────────────────────────────────────────────

export type CanonicalItemDocument = CanonicalItem & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class CanonicalItem {
  @Prop({ required: true, unique: true })
  name: string; // Clean English name: "Potato"

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ enum: CanonicalStatus, default: CanonicalStatus.ACTIVE })
  status: CanonicalStatus;
}

export const CanonicalItemSchema = SchemaFactory.createForClass(CanonicalItem);

CanonicalItemSchema.virtual('id').get(function (this: CanonicalItemDocument) {
  return this._id.toHexString();
});

// Text index for search
CanonicalItemSchema.index({ name: 'text', slug: 'text', description: 'text' });

// ─── Layer 2: Variations (Real World) ────────────────────────────────────────

export type ItemVariationDocument = ItemVariation & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class ItemVariation {
  @Prop({ required: true })
  rawInput: string; // What user typed: "allu"

  @Prop({ required: true })
  normalizedForm: string; // AI normalized: "potato"

  @Prop()
  language?: string; // "ur", "hi", "en", "roman_urdu"

  @Prop({ type: Number, min: 0, max: 1 })
  confidence?: number;

  @Prop({ type: Types.ObjectId, ref: 'CanonicalItem', default: null })
  canonicalId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  submittedBy?: Types.ObjectId;

  @Prop({ enum: VariationStatus, default: VariationStatus.PENDING })
  status: VariationStatus;
}

export const ItemVariationSchema = SchemaFactory.createForClass(ItemVariation);

ItemVariationSchema.virtual('id').get(function (this: ItemVariationDocument) {
  return this._id.toHexString();
});

// Index for fast lookup
ItemVariationSchema.index({ rawInput: 1 });
ItemVariationSchema.index({ normalizedForm: 1 });
ItemVariationSchema.index({ canonicalId: 1 });
