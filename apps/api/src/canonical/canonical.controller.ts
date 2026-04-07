import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CanonicalService } from './canonical.service';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole, CanonicalStatus, VariationStatus } from '@local-market/shared';
import { ok } from '../common/response.helper';
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateCanonicalDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() categoryId: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
}

class UpdateCanonicalDto {
  @ApiPropertyOptional() @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional({ enum: CanonicalStatus })
  @IsEnum(CanonicalStatus)
  @IsOptional()
  status?: CanonicalStatus;
}

class MergeCanonicalDto {
  @ApiProperty() @IsString() targetId: string;
}

class ApproveVariationDto {
  @ApiProperty() @IsString() canonicalId: string;
}

@ApiTags('canonical')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('canonical')
export class CanonicalController {
  constructor(private readonly canonicalService: CanonicalService) {}

  // ── Canonical Items ───────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INFLUENCER)
  async findAll(
    @Query('status') status?: CanonicalStatus,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.canonicalService.findAllCanonical({
      status,
      categoryId,
      search,
      page,
      limit,
    });
    return ok(result);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateCanonicalDto) {
    const item = await this.canonicalService.createCanonical(dto);
    return ok(item);
  }

  @Get('variations/pending')
  @Roles(UserRole.ADMIN)
  async getPendingVariations() {
    const variations = await this.canonicalService.getPendingVariations();
    return ok(variations);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.INFLUENCER)
  async findOne(@Param('id') id: string) {
    const item = await this.canonicalService.findCanonicalById(id);
    return ok(item);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateCanonicalDto) {
    const item = await this.canonicalService.updateCanonical(id, dto);
    return ok(item);
  }

  @Post(':id/merge')
  @Roles(UserRole.ADMIN)
  async merge(@Param('id') sourceId: string, @Body() dto: MergeCanonicalDto) {
    const result = await this.canonicalService.mergeCanonical(sourceId, dto.targetId);
    return ok(result, 'Canonical items merged successfully');
  }

  // ── Variations ────────────────────────────────────────────────────────────

  @Get(':id/variations')
  @Roles(UserRole.ADMIN)
  async getVariations(
    @Param('id') canonicalId: string,
    @Query('status') status?: VariationStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.canonicalService.getVariationsForCanonical(canonicalId, {
      status,
      page,
      limit,
    });
    return ok(result);
  }

  @Patch('variations/:id/approve')
  @Roles(UserRole.ADMIN)
  async approveVariation(@Param('id') id: string, @Body() dto: ApproveVariationDto) {
    const variation = await this.canonicalService.approveVariation(id, dto.canonicalId);
    return ok(variation, 'Variation linked to canonical');
  }

  @Patch('variations/:id/reject')
  @Roles(UserRole.ADMIN)
  async rejectVariation(@Param('id') id: string) {
    const variation = await this.canonicalService.rejectVariation(id);
    return ok(variation, 'Variation rejected');
  }
}
