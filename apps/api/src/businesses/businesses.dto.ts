import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
