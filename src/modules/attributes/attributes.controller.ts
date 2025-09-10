import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { AttributesRepository } from './attributes.repository';
import { ApiResponseFormat } from 'src/common/utils/common-response';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesRepository: AttributesRepository) {}

  @Get()
  async getAllAttributes(): Promise<ApiResponseFormat<any[]>> {
    return this.attributesRepository.findAllAttributes();
  }

  @Get(':id/values')
  async getAttributeValuesByAttributeId(@Param('id') id: string): Promise<ApiResponseFormat<any[]>> {
    const attributeId = parseInt(id, 10);
    return this.attributesRepository.findAttributeValuesByAttributeId(attributeId);
  }
}