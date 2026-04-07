import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CurrentUser } from '../common/current-user.decorator';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole, ItemStatus, AiImportPreview } from '@local-market/shared';
import { ok } from '../common/response.helper';
import { UserDocument } from '../common/user.schema';
import { IsNumber, IsOptional, IsString, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CreateItemDto {
  @ApiProperty() @IsString() rawName: string;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) price: number;
  @ApiPropertyOptional() @IsString() @IsOptional() unit?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) stock?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() imageUrl?: string;
}

class BulkCreateDto {
  @ApiProperty() @IsArray() items: AiImportPreview[];
}

@ApiTags('items')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  // POST /businesses/:businessId/items
  @Post('businesses/:businessId/items')
  @Roles(UserRole.BUSINESS)
  async create(
    @Param('businessId') businessId: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateItemDto,
  ) {
    const item = await this.itemsService.create(businessId, dto, user);
    return ok(item, 'Item added. Pending review.');
  }

  // POST /businesses/:businessId/items/bulk
  @Post('businesses/:businessId/items/bulk')
  @Roles(UserRole.BUSINESS)
  async bulkCreate(
    @Param('businessId') businessId: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: BulkCreateDto,
  ) {
    const items = await this.itemsService.bulkCreate(businessId, dto.items, user);
    return ok(items, `${items.length} items added`);
  }

  // GET /businesses/:businessId/items
  @Get('businesses/:businessId/items')
  async findByBusiness(
    @Param('businessId') businessId: string,
    @Query('status') status?: ItemStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.itemsService.findByBusiness(businessId, { status, page, limit });
    return ok(result);
  }

  // PATCH /items/:id
  @Patch('items/:id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: Partial<CreateItemDto>,
  ) {
    const item = await this.itemsService.update(id, dto, user);
    return ok(item);
  }

  // DELETE /items/:id
  @Delete('items/:id')
  async delete(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    await this.itemsService.delete(id, user);
    return ok(null, 'Item deleted');
  }
}
