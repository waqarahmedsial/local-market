import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/current-user.decorator';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@local-market/shared';
import { ok } from '../common/response.helper';
import { UserDocument } from '../common/user.schema';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('influencers')
  @Roles(UserRole.ADMIN)
  async getInfluencers() {
    const influencers = await this.usersService.findByRole(UserRole.INFLUENCER);
    return ok(influencers);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: UserDocument,
    @Body() dto: { name?: string; avatarUrl?: string },
  ) {
    const updated = await this.usersService.update((user as any)._id.toString(), dto);
    return ok(updated);
  }
}
