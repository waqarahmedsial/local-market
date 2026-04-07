import { IsString, IsOptional, IsUrl, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BusinessLocationDto {
  @ApiProperty({ minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
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
