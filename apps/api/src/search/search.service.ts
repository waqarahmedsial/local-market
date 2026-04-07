import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item, ItemDocument } from '../items/item.schema';
import { ItemVariation, ItemVariationDocument } from '../canonical/canonical.schema';
import { AiService } from '../ai/ai.service';
import { ItemStatus } from '@local-market/shared';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<ItemDocument>,
    @InjectModel(ItemVariation.name) private variationModel: Model<ItemVariationDocument>,
    private readonly aiService: AiService,
  ) {}

  async search(params: {
    q: string;
    city?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    // Step 1: Normalize the query using AI
    const normalized = await this.aiService.normalizeText(params.q);
    const normalizedQuery = normalized.normalized.toLowerCase();

    // Step 2: Find canonical IDs that match via variations
    const matchingVariations = await this.variationModel
      .find({
        $or: [
          { rawInput: { $regex: params.q, $options: 'i' } },
          { normalizedForm: { $regex: normalizedQuery, $options: 'i' } },
        ],
        canonicalId: { $ne: null },
      })
      .select('canonicalId')
      .exec();

    const canonicalIds = [
      ...new Set(matchingVariations.map((v) => v.canonicalId?.toString()).filter(Boolean)),
    ].map((id) => new Types.ObjectId(id!));

    // Step 3: Build item filter
    const filter: Record<string, unknown> = {
      status: ItemStatus.ACTIVE,
      $or: [
        { displayName: { $regex: normalizedQuery, $options: 'i' } },
        { rawName: { $regex: params.q, $options: 'i' } },
        ...(canonicalIds.length > 0 ? [{ canonicalId: { $in: canonicalIds } }] : []),
      ],
    };

    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (params.minPrice !== undefined) priceFilter['$gte'] = params.minPrice;
      if (params.maxPrice !== undefined) priceFilter['$lte'] = params.maxPrice;
      filter['price'] = priceFilter;
    }

    const [items, total] = await Promise.all([
      this.itemModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate('canonicalId')
        .populate({
          path: 'businessId',
          match: params.city ? { city: { $regex: params.city, $options: 'i' } } : undefined,
        })
        .exec(),
      this.itemModel.countDocuments(filter),
    ]);

    // Filter out items where business city didn't match (from populate match)
    const filteredItems = params.city
      ? items.filter((item) => item.businessId !== null)
      : items;

    return {
      items: filteredItems,
      total: params.city ? filteredItems.length : total,
      query: params.q,
      normalizedQuery: normalized.normalized,
      page,
      limit,
    };
  }
}
