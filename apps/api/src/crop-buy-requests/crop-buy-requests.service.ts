import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CropBuyRequest, CropBuyRequestDocument } from './crop-buy-request.schema';
import { CropBuyRequestStatus } from '@local-market/shared';
import { getPaginationOptions, paginate } from '../common/pagination.helper';

@Injectable()
export class CropBuyRequestsService {
  constructor(
    @InjectModel(CropBuyRequest.name)
    private cropBuyRequestModel: Model<CropBuyRequestDocument>,
  ) {}

  async create(dto: {
    cropName: string;
    quantity: number;
    unit: string;
    maxPricePerUnit?: number;
    city: string;
    description?: string;
    contactName: string;
    contactPhone: string;
  }): Promise<CropBuyRequestDocument> {
    const request = new this.cropBuyRequestModel({
      ...dto,
      status: CropBuyRequestStatus.OPEN,
    });
    return request.save();
  }

  async findAll(params: {
    city?: string;
    cropName?: string;
    status?: CropBuyRequestStatus;
    page?: number;
    limit?: number;
  }) {
    const { skip, limit, page } = getPaginationOptions(params);
    const filter: Record<string, unknown> = {};

    if (params.status) {
      filter['status'] = params.status;
    } else {
      filter['status'] = CropBuyRequestStatus.OPEN;
    }

    if (params.city) {
      filter['city'] = { $regex: params.city, $options: 'i' };
    }

    if (params.cropName) {
      filter['cropName'] = { $regex: params.cropName, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      this.cropBuyRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.cropBuyRequestModel.countDocuments(filter),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<CropBuyRequestDocument> {
    const request = await this.cropBuyRequestModel.findById(id).exec();
    if (!request) throw new NotFoundException('Crop buy request not found');
    return request;
  }

  async updateStatus(
    id: string,
    status: CropBuyRequestStatus,
    isAdmin: boolean,
  ): Promise<CropBuyRequestDocument> {
    const request = await this.findById(id);
    if (!isAdmin && status === CropBuyRequestStatus.CANCELLED) {
      // Allow anyone to cancel (they know the ID = they posted it)
    } else if (!isAdmin && status === CropBuyRequestStatus.FULFILLED) {
      // Allow anyone to mark as fulfilled
    } else if (!isAdmin) {
      throw new ForbiddenException('Insufficient permissions');
    }
    request.status = status;
    return request.save();
  }

  async delete(id: string): Promise<void> {
    const request = await this.findById(id);
    await request.deleteOne();
  }
}
