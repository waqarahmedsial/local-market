import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CanonicalItem,
  CanonicalItemDocument,
  ItemVariation,
  ItemVariationDocument,
} from './canonical.schema';
import { CanonicalStatus, VariationStatus } from '@local-market/shared';
import { getPaginationOptions, paginate } from '../common/pagination.helper';

@Injectable()
export class CanonicalService {
  constructor(
    @InjectModel(CanonicalItem.name) private canonicalModel: Model<CanonicalItemDocument>,
    @InjectModel(ItemVariation.name) private variationModel: Model<ItemVariationDocument>,
  ) {}

  // ── Canonical Items ───────────────────────────────────────────────────────

  async createCanonical(dto: {
    name: string;
    categoryId: string;
    description?: string;
  }): Promise<CanonicalItemDocument> {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await this.canonicalModel.findOne({ slug });
    if (existing) throw new ConflictException('Canonical item with this name already exists');

    const item = new this.canonicalModel({
      ...dto,
      slug,
      categoryId: new Types.ObjectId(dto.categoryId),
    });
    return item.save();
  }

  async findAllCanonical(params: {
    status?: CanonicalStatus;
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { skip, limit, page } = getPaginationOptions(params);
    const filter: Record<string, unknown> = {};
    if (params.status) filter['status'] = params.status;
    if (params.categoryId) filter['categoryId'] = new Types.ObjectId(params.categoryId);
    if (params.search) filter['$text'] = { $search: params.search };

    const [data, total] = await Promise.all([
      this.canonicalModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate('categoryId')
        .exec(),
      this.canonicalModel.countDocuments(filter),
    ]);

    return paginate(data, total, page, limit);
  }

  async findCanonicalById(id: string): Promise<CanonicalItemDocument> {
    const item = await this.canonicalModel.findById(id).populate('categoryId').exec();
    if (!item) throw new NotFoundException('Canonical item not found');
    return item;
  }

  async updateCanonical(
    id: string,
    dto: { name?: string; description?: string; status?: CanonicalStatus },
  ): Promise<CanonicalItemDocument> {
    const item = await this.canonicalModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!item) throw new NotFoundException('Canonical item not found');
    return item;
  }

  /**
   * Admin operation: Merge source canonical into target.
   * Re-links all variations from source → target, then soft-deletes source.
   */
  async mergeCanonical(sourceId: string, targetId: string): Promise<CanonicalItemDocument> {
    const [source, target] = await Promise.all([
      this.findCanonicalById(sourceId),
      this.findCanonicalById(targetId),
    ]);

    // Re-link all variations
    await this.variationModel.updateMany(
      { canonicalId: source._id },
      { canonicalId: target._id },
    );

    // Deactivate source
    source.status = CanonicalStatus.INACTIVE;
    await source.save();

    return target;
  }

  // ── Variations ────────────────────────────────────────────────────────────

  async findOrCreateVariation(dto: {
    rawInput: string;
    normalizedForm: string;
    language?: string;
    confidence?: number;
    submittedBy?: string;
  }): Promise<{ variation: ItemVariationDocument; isNew: boolean }> {
    const normalized = dto.normalizedForm.toLowerCase().trim();

    // Check if we already have this variation
    let variation = await this.variationModel
      .findOne({ normalizedForm: normalized })
      .exec();

    if (variation) return { variation, isNew: false };

    // Try to auto-link to canonical with high confidence
    let canonicalId: Types.ObjectId | undefined;
    if (dto.confidence && dto.confidence >= 0.85) {
      const canonicalSlug = normalized.replace(/\s+/g, '-');
      const canonical = await this.canonicalModel.findOne({ slug: canonicalSlug });
      if (canonical) canonicalId = canonical._id as Types.ObjectId;
    }

    variation = new this.variationModel({
      rawInput: dto.rawInput,
      normalizedForm: normalized,
      language: dto.language,
      confidence: dto.confidence,
      canonicalId,
      submittedBy: dto.submittedBy ? new Types.ObjectId(dto.submittedBy) : undefined,
      status: canonicalId ? VariationStatus.LINKED : VariationStatus.PENDING,
    });

    return { variation: await variation.save(), isNew: true };
  }

  async getPendingVariations(): Promise<ItemVariationDocument[]> {
    return this.variationModel
      .find({ status: VariationStatus.PENDING })
      .populate('canonicalId')
      .exec();
  }

  async getVariationsForCanonical(
    canonicalId: string,
    params: { status?: VariationStatus; page?: number; limit?: number },
  ) {
    const { skip, limit, page } = getPaginationOptions(params);
    const filter: Record<string, unknown> = {
      canonicalId: new Types.ObjectId(canonicalId),
    };
    if (params.status) filter['status'] = params.status;

    const [data, total] = await Promise.all([
      this.variationModel.find(filter).skip(skip).limit(limit).exec(),
      this.variationModel.countDocuments(filter),
    ]);

    return paginate(data, total, page, limit);
  }

  async approveVariation(variationId: string, canonicalId: string): Promise<ItemVariationDocument> {
    const variation = await this.variationModel.findById(variationId);
    if (!variation) throw new NotFoundException('Variation not found');

    variation.canonicalId = new Types.ObjectId(canonicalId) as any;
    variation.status = VariationStatus.LINKED;
    return variation.save();
  }

  async rejectVariation(variationId: string): Promise<ItemVariationDocument> {
    const variation = await this.variationModel.findById(variationId);
    if (!variation) throw new NotFoundException('Variation not found');

    variation.status = VariationStatus.REJECTED;
    return variation.save();
  }

  /**
   * Resolve a raw user input to a canonical item (used during item creation).
   * Returns the canonical item if found, or null if it needs admin review.
   */
  async resolveToCanonical(
    rawInput: string,
    normalizedForm: string,
    confidence: number,
    userId?: string,
  ): Promise<CanonicalItemDocument | null> {
    const { variation } = await this.findOrCreateVariation({
      rawInput,
      normalizedForm,
      confidence,
      submittedBy: userId,
    });

    if (variation.status === VariationStatus.LINKED && variation.canonicalId) {
      return this.findCanonicalById(variation.canonicalId.toString());
    }

    return null;
  }
}
