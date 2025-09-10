import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { MasterApisService } from './master-apis.service';
import { AuthUtils } from 'src/common/utils/auth.utils';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { ApiResponse } from 'src/common/utils/common-response';

@Controller('master-apis')
@UseGuards(AuthGuard, RoleGuard)
export class MasterApisController {
  constructor(private readonly masterApisService: MasterApisService) {}

  @Get('country')
  async getUserDetails(
    @Headers('authorization') authHeader: string,
  ): Promise<{ result: any; message: string; status_code: number }> {
    const userId = AuthUtils.getUserIdFromToken(authHeader);

    if (!userId) {
      return ApiResponse.badRequest('Valid authorization token is required');
    }
    // Pass userId to service if needed
    return this.masterApisService.getAllCountries();
  }
 
}
