import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './category.schema';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) {}

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().exec();
  }

  async findById(id: string): Promise<CategoryDocument> {
    const cat = await this.categoryModel.findById(id).exec();
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(dto: { name: string; parentId?: string }): Promise<CategoryDocument> {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const cat = new this.categoryModel({ ...dto, slug });
    return cat.save();
  }

  async delete(id: string): Promise<void> {
    const cat = await this.findById(id);
    const childCount = await this.categoryModel.countDocuments({ parentId: cat._id }).exec();
    if (childCount > 0) {
      throw new BadRequestException(
        'Cannot delete a category that has sub-categories. Remove or reassign them first.',
      );
    }
    await cat.deleteOne();
  }
}
