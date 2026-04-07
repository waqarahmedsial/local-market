import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@local-market/shared';
import { ok } from '../common/response.helper';
import { IsString, IsOptional } from 'class-validator';

class CreateCategoryDto {
  @IsString() name: string;
  @IsString() @IsOptional() parentId?: string;
}

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll() {
    const categories = await this.categoriesService.findAll();
    return ok(categories);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(dto);
    return ok(category);
  }
}
