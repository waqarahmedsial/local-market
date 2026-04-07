import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit-log.schema';
import { AuditAction } from '@local-market/shared';
import { getPaginationOptions, paginate } from '../common/pagination.helper';
import { isValidObjectId } from '../common/sanitize.helper';

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>) {}

  async log(dto: {
    userId: string;
    action: AuditAction;
    entity: string;
    entityId: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    note?: string;
  }): Promise<AuditLogDocument> {
    const log = new this.auditModel({
      ...dto,
      userId: new Types.ObjectId(dto.userId),
    });
    return log.save();
  }

  async findAll(params: {
    entity?: string;
    entityId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const { skip, limit, page } = getPaginationOptions(params);
    const filter: Record<string, unknown> = {};
    if (params.entity) {
      // Allow only simple alphanumeric entity names
      filter['entity'] = params.entity.replace(/[^a-zA-Z0-9_-]/g, '');
    }
    if (params.entityId) filter['entityId'] = params.entityId;
    if (params.userId) {
      if (!isValidObjectId(params.userId)) {
        throw new BadRequestException('Invalid userId');
      }
      filter['userId'] = new Types.ObjectId(params.userId);
    }

    const [data, total] = await Promise.all([
      this.auditModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', '-password')
        .exec(),
      this.auditModel.countDocuments(filter),
    ]);

    return paginate(data, total, page, limit);
  }
}
