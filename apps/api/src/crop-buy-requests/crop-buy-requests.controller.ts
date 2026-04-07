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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CropBuyRequestsService } from './crop-buy-requests.service';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole, CropBuyRequestStatus } from '@local-market/shared';
import { ok } from '../common/response.helper';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CreateCropBuyRequestDto {
  @ApiProperty({ description: 'Name of the crop to buy (e.g. Wheat, Rice, Cotton)' })
  @IsString()
  @IsNotEmpty()
  cropName: string;

  @ApiProperty({ description: 'How much they want to buy' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ description: 'Unit of quantity (kg, maund, ton, bags)' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({ description: 'Maximum price willing to pay per unit (Rs)' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  maxPricePerUnit?: number;

  @ApiProperty({ description: 'City where delivery or pickup is required' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ description: 'Additional details (quality, variety, delivery terms)' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Full name of the buyer' })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty({ description: 'Phone number to contact the buyer' })
  @IsString()
  @IsNotEmpty()
  contactPhone: string;
}

class UpdateStatusDto {
  @ApiProperty({ enum: CropBuyRequestStatus })
  @IsEnum(CropBuyRequestStatus)
  status: CropBuyRequestStatus;
}

@ApiTags('crop-buy-requests')
@Controller('crop-requests')
export class CropBuyRequestsController {
  constructor(private readonly service: CropBuyRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Post a crop buying request (no login required)' })
  async create(@Body() dto: CreateCropBuyRequestDto) {
    const request = await this.service.create(dto);
    return ok(request, 'Crop buy request posted successfully.');
  }

  @Get()
  @ApiOperation({ summary: 'List open crop buy requests' })
  async findAll(
    @Query('city') city?: string,
    @Query('cropName') cropName?: string,
    @Query('status') status?: CropBuyRequestStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.service.findAll({ city, cropName, status, page, limit });
    return ok(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single crop buy request' })
  async findOne(@Param('id') id: string) {
    const request = await this.service.findById(id);
    return ok(request);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update status of a crop buy request' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    const request = await this.service.updateStatus(id, dto.status, false);
    return ok(request);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a crop buy request (admin only)' })
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return ok(null, 'Crop buy request deleted');
  }
}
