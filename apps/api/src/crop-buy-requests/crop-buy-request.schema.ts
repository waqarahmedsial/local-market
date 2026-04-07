import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CropBuyRequestStatus } from '@local-market/shared';

export type CropBuyRequestDocument = CropBuyRequest & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class CropBuyRequest {
  @Prop({ required: true })
  cropName: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ min: 1 })
  maxPricePerUnit?: number;

  @Prop({ required: true })
  city: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  contactName: string;

  @Prop({ required: true })
  contactPhone: string;

  @Prop({ enum: CropBuyRequestStatus, default: CropBuyRequestStatus.OPEN })
  status: CropBuyRequestStatus;
}

export const CropBuyRequestSchema = SchemaFactory.createForClass(CropBuyRequest);

CropBuyRequestSchema.virtual('id').get(function (this: CropBuyRequestDocument) {
  return this._id.toHexString();
});

CropBuyRequestSchema.index({ city: 1, status: 1 });
CropBuyRequestSchema.index({ cropName: 'text' });
