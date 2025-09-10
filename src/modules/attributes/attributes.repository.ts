import { Injectable } from '@nestjs/common';
import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';
import { Messages } from 'src/common/utils/messages';
import { SelectQuery } from 'src/db/postgres.client';

@Injectable()
export class AttributesRepository {
  private readonly attributeSelectFields = 'id, name, slug, type, is_required, is_variation, is_filterable, is_comparable, sort_order, validation_rules, is_active, created_at, updated_at';
  private readonly attributeValueSelectFields = 'id, attribute_id, value, color_code, image_url, sort_order, is_active';

  async findAllAttributes(): Promise<ApiResponseFormat<any[]>> {
    try {
      const sql = `SELECT ${this.attributeSelectFields} FROM attributes WHERE is_active = true ORDER BY sort_order ASC, name ASC`;
      const result = await SelectQuery(sql, []);
      return ApiResponse.success(result);
    } catch (e) {
      console.error('Error in findAllAttributes:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async findAttributeValuesByAttributeId(attributeId: number): Promise<ApiResponseFormat<any[]>> {
    try {
      const sql = `SELECT ${this.attributeValueSelectFields} FROM attribute_values WHERE attribute_id = $1 AND is_active = true ORDER BY sort_order ASC, value ASC`;
      const result = await SelectQuery(sql, [attributeId]);
      return ApiResponse.success(result);
    } catch (e) {
      console.error('Error in findAttributeValuesByAttributeId:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }
}