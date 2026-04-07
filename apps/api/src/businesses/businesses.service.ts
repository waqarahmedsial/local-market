import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Business, BusinessDocument } from './business.schema';
import { BusinessStatus, UserRole } from '@local-market/shared';
import { CreateBusinessDto, AssignInfluencerDto } from './businesses.dto';
import { UserDocument } from '../common/user.schema';
import { getPaginationOptions, paginate } from '../common/pagination.helper';

@Injectable()
export class BusinessesService {
  constructor(@InjectModel(Business.name) private businessModel: Model<BusinessDocument>) {}

  async create(owner: UserDocument, dto: CreateBusinessDto): Promise<BusinessDocument> {
    const existing = await this.businessModel.findOne({ ownerId: (owner as any)._id });
    if (existing) throw new BadRequestException('You already have a registered business');

    const business = new this.businessModel({
      ...dto,
      ownerId: (owner as any)._id,
      status: BusinessStatus.PENDING,
    });
    return business.save();
  }

  async findAll(params: {
    status?: BusinessStatus;
    influencerId?: string;
    page?: number;
    limit?: number;
  }) {
    const { skip, limit, page } = getPaginationOptions(params);
    const filter: Record<string, unknown> = {};
    if (params.status) filter['status'] = params.status;
    if (params.influencerId) filter['influencerId'] = new Types.ObjectId(params.influencerId);

    const [data, total] = await Promise.all([
      this.businessModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate('ownerId', '-password')
        .populate('influencerId', '-password')
        .exec(),
      this.businessModel.countDocuments(filter),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<BusinessDocument> {
    const business = await this.businessModel
      .findById(id)
      .populate('ownerId', '-password')
      .populate('influencerId', '-password')
      .exec();
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async findByOwner(ownerId: string): Promise<BusinessDocument> {
    const business = await this.businessModel
      .findOne({ ownerId: new Types.ObjectId(ownerId) })
      .populate('influencerId', '-password')
      .exec();
    if (!business) throw new NotFoundException('No business found for this user');
    return business;
  }

  async update(
    id: string,
    user: UserDocument,
    dto: Partial<CreateBusinessDto>,
  ): Promise<BusinessDocument> {
    const business = await this.findById(id);
    this.assertOwnerOrAdmin(business, user);
    Object.assign(business, dto);
    return business.save();
  }

  async approve(id: string): Promise<BusinessDocument> {
    const business = await this.findById(id);
    if (business.status === BusinessStatus.APPROVED) {
      throw new BadRequestException('Business is already approved');
    }
    business.status = BusinessStatus.APPROVED;
    return business.save();
  }

  async reject(id: string, reason?: string): Promise<BusinessDocument> {
    const business = await this.findById(id);
    business.status = BusinessStatus.REJECTED;
    business.rejectionReason = reason;
    return business.save();
  }

  async assignInfluencer(
    businessId: string,
    dto: AssignInfluencerDto,
  ): Promise<BusinessDocument> {
    const business = await this.findById(businessId);
    business.influencerId = new Types.ObjectId(dto.influencerId) as any;
    return business.save();
  }

  private assertOwnerOrAdmin(business: BusinessDocument, user: UserDocument) {
    const isOwner = (business.ownerId as any).toString() === (user as any)._id.toString();
    const isAdmin = user.role === UserRole.ADMIN;
    if (!isOwner && !isAdmin) throw new ForbiddenException('Not authorized');
  }
}
