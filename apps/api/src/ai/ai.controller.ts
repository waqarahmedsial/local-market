import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ok } from '../common/response.helper';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class NormalizeDto {
  @ApiProperty() @IsString() text: string;
}

class TextImportDto {
  @ApiProperty() @IsString() text: string;
  @ApiProperty() @IsString() businessId: string;
}

class ImageImportDto {
  @ApiProperty() @IsString() imageUrl: string;
  @ApiProperty() @IsString() businessId: string;
}

class VoiceImportDto {
  @ApiProperty() @IsString() audioUrl: string;
  @ApiProperty() @IsString() businessId: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('normalize')
  async normalize(@Body() dto: NormalizeDto) {
    const result = await this.aiService.normalizeText(dto.text);
    return ok(result);
  }

  @Post('import/text')
  async importText(@Body() dto: TextImportDto) {
    const result = await this.aiService.importFromText(dto.text);
    return ok(result);
  }

  @Post('import/image')
  async importImage(@Body() dto: ImageImportDto) {
    const result = await this.aiService.importFromImage(dto.imageUrl);
    return ok(result);
  }

  @Post('import/voice')
  async importVoice(@Body() dto: VoiceImportDto) {
    const result = await this.aiService.importFromVoice(dto.audioUrl);
    return ok(result);
  }
}
