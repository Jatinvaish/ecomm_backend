import { Injectable } from '@nestjs/common';
import { ApiResponse } from 'src/common/utils/common-response';
import { Messages } from 'src/common/utils/messages';
import { SelectQuery } from 'src/db/postgres.client';
import { MasterAPISSQL } from './master-apis.sql';

@Injectable()
export class MasterApisService {
  async getAllCountries(): Promise<{
    result: any;
    message: string;
    status_code: number;
  }> {
    try {
      const result = await SelectQuery(MasterAPISSQL.getAllContries);
      return ApiResponse.success(
        result,
        'Countries fetched successfully',
      );
    } catch (error) {
      console.log('🚀 ~ MasterApisService ~ getAllCountries ~ error:', error);
      return ApiResponse.error(error?.message);
    }
  }
}
