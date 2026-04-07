import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BusinessStatus } from '@local-market/shared';

export type BusinessDocument = Business & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Business {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  influencerId?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  logoUrl?: string;

  @Prop({
    type: { latitude: Number, longitude: Number },
    _id: false,
  })
  location?: { latitude: number; longitude: number };

  @Prop({ enum: BusinessStatus, default: BusinessStatus.PENDING })
  status: BusinessStatus;

  @Prop()
  rejectionReason?: string;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);

BusinessSchema.virtual('id').get(function (this: BusinessDocument) {
  return this._id.toHexString();
});
