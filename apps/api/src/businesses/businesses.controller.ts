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
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto, AssignInfluencerDto, RejectBusinessDto } from './businesses.dto';
import { CurrentUser } from '../common/current-user.decorator';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole, BusinessStatus } from '@local-market/shared';
import { ok } from '../common/response.helper';
import { UserDocument } from '../common/user.schema';

@ApiTags('businesses')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  // My business (for BUSINESS role)
  @Get('my')
  @Roles(UserRole.BUSINESS)
  async myBusiness(@CurrentUser() user: UserDocument) {
    const business = await this.businessesService.findByOwner((user as any)._id.toString());
    return ok(business);
  }

  // Create business
  @Post()
  @Roles(UserRole.BUSINESS)
  async create(@CurrentUser() user: UserDocument, @Body() dto: CreateBusinessDto) {
    const business = await this.businessesService.create(user, dto);
    return ok(business, 'Business registered. Awaiting approval.');
  }

  // List all businesses (admin/influencer)
  @Get()
  @Roles(UserRole.ADMIN, UserRole.INFLUENCER)
  async findAll(
    @Query('status') status?: BusinessStatus,
    @Query('influencerId') influencerId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.businessesService.findAll({ status, influencerId, page, limit });
    return ok(result);
  }

  // Get single business
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const business = await this.businessesService.findById(id);
    return ok(business);
  }

  // Update business
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: Partial<CreateBusinessDto>,
  ) {
    const business = await this.businessesService.update(id, user, dto);
    return ok(business);
  }

  // Approve (admin or influencer)
  @Patch(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.INFLUENCER)
  async approve(@Param('id') id: string) {
    const business = await this.businessesService.approve(id);
    return ok(business, 'Business approved');
  }

  // Reject (admin or influencer)
  @Patch(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.INFLUENCER)
  async reject(@Param('id') id: string, @Body() dto: RejectBusinessDto) {
    const business = await this.businessesService.reject(id, dto.reason);
    return ok(business, 'Business rejected');
  }

  // Assign influencer (admin only)
  @Patch(':id/assign-influencer')
  @Roles(UserRole.ADMIN)
  async assignInfluencer(@Param('id') id: string, @Body() dto: AssignInfluencerDto) {
    const business = await this.businessesService.assignInfluencer(id, dto);
    return ok(business, 'Influencer assigned');
  }
}
