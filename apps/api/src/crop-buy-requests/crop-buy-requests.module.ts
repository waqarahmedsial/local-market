import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CropBuyRequestsService } from './crop-buy-requests.service';
import { CropBuyRequestsController } from './crop-buy-requests.controller';
import { CropBuyRequest, CropBuyRequestSchema } from './crop-buy-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CropBuyRequest.name, schema: CropBuyRequestSchema },
    ]),
  ],
  controllers: [CropBuyRequestsController],
  providers: [CropBuyRequestsService],
  exports: [CropBuyRequestsService],
})
export class CropBuyRequestsModule {}
