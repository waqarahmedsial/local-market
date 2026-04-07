import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item, ItemDocument } from './item.schema';
import { ItemStatus, ItemImportSource, AiImportPreview, UserRole } from '@local-market/shared';
import { UserDocument } from '../common/user.schema';
import { AiService } from '../ai/ai.service';
import { CanonicalService } from '../canonical/canonical.service';
import { BusinessesService } from '../businesses/businesses.service';
import { getPaginationOptions, paginate } from '../common/pagination.helper';

@Injectable()
export class ItemsService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<ItemDocument>,
    private readonly aiService: AiService,
    private readonly canonicalService: CanonicalService,
    private readonly businessesService: BusinessesService,
  ) {}

  async create(
    businessId: string,
    dto: {
      rawName: string;
      price: number;
      unit?: string;
      stock?: number;
      imageUrl?: string;
      importSource?: ItemImportSource;
    },
    user: UserDocument,
  ): Promise<ItemDocument> {
    await this.assertBusinessOwner(businessId, user);

    // AI normalization pipeline
    const aiResult = await this.aiService.normalizeText(dto.rawName);

    // Try to resolve to canonical
    const canonical = await this.canonicalService.resolveToCanonical(
      dto.rawName,
      aiResult.normalized,
      aiResult.confidence,
      (user as any)._id.toString(),
    );

    const item = new this.itemModel({
      businessId: new Types.ObjectId(businessId),
      canonicalId: canonical ? canonical._id : undefined,
      rawName: dto.rawName,
      displayName: canonical ? canonical.name : aiResult.normalized,
      price: dto.price,
      unit: dto.unit,
      stock: dto.stock,
      imageUrl: dto.imageUrl,
      importSource: dto.importSource ?? ItemImportSource.MANUAL,
      status: ItemStatus.PENDING_REVIEW,
    });

    return item.save();
  }

  async bulkCreate(
    businessId: string,
    previews: AiImportPreview[],
    user: UserDocument,
  ): Promise<ItemDocument[]> {
    await this.assertBusinessOwner(businessId, user);

    const items: ItemDocument[] = [];
    for (const preview of previews) {
      const item = await this.create(
        businessId,
        {
          rawName: preview.rawInput,
          price: preview.price ?? 0,
          unit: preview.unit,
          importSource: ItemImportSource.EXCEL,
        },
        user,
      );
      items.push(item);
    }
    return items;
  }

  async findByBusiness(
    businessId: string,
    params: { status?: ItemStatus; page?: number; limit?: number },
  ) {
    const { skip, limit, page } = getPaginationOptions(params);
    const filter: Record<string, unknown> = {
      businessId: new Types.ObjectId(businessId),
    };
    if (params.status) filter['status'] = params.status;

    const [data, total] = await Promise.all([
      this.itemModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate('canonicalId')
        .exec(),
      this.itemModel.countDocuments(filter),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<ItemDocument> {
    const item = await this.itemModel.findById(id).populate('canonicalId').exec();
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async update(
    id: string,
    dto: Partial<{ rawName: string; price: number; unit: string; stock: number; imageUrl: string; status: ItemStatus }>,
    user: UserDocument,
  ): Promise<ItemDocument> {
    const item = await this.findById(id);
    await this.assertBusinessOwner(item.businessId.toString(), user);

    Object.assign(item, dto);
    return item.save();
  }

  async delete(id: string, user: UserDocument): Promise<void> {
    const item = await this.findById(id);
    await this.assertBusinessOwner(item.businessId.toString(), user);
    await item.deleteOne();
  }

  private async assertBusinessOwner(businessId: string, user: UserDocument): Promise<void> {
    if (user.role === UserRole.ADMIN) return;
    const business = await this.businessesService.findById(businessId);
    if ((business.ownerId as any).toString() !== (user as any)._id.toString()) {
      throw new ForbiddenException('Not your business');
    }
  }
}
