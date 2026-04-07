import { IsString, IsOptional, IsUrl, ValidateNested, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BusinessLocationDto {
  @ApiProperty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  longitude: number;
}

export class CreateBusinessDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ type: BusinessLocationDto })
  @ValidateNested()
  @Type(() => BusinessLocationDto)
  @IsOptional()
  location?: BusinessLocationDto;
}

export class AssignInfluencerDto {
  @ApiProperty()
  @IsString()
  influencerId: string;
}

export class RejectBusinessDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
