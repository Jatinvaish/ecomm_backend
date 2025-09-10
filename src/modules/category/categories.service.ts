import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { ApiResponseFormat } from 'src/common/utils/common-response';
import { CategoryQueryDto, CreateCategoryDto, GetParentCategoriesDto, UpdateCategoryDto } from './dtos/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  // --- Public/User/Vendor-facing APIs ---
  async getActiveCategories(query: CategoryQueryDto): Promise<ApiResponseFormat<any[]>> {
    const response = await this.categoriesRepository.findAllActiveCategories(query);
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  async getActiveCategoryById(id: number): Promise<ApiResponseFormat<any>> {
    const response = await this.categoriesRepository.findActiveCategoryById(id);
    if (response.status_code === 404) {
      throw new NotFoundException(response.message);
    }
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  // --- Admin-facing APIs ---
  async getAllCategoriesForAdmin(query: CategoryQueryDto): Promise<ApiResponseFormat<any>> {
    const response = await this.categoriesRepository.findAllCategoriesAdmin(query);
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  async getParentCategories(query: GetParentCategoriesDto): Promise<ApiResponseFormat<any>> {
    const response = await this.categoriesRepository.getParentCategories(query);
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  
  async getCategoryByIdForAdmin(id: number): Promise<ApiResponseFormat<any>> {
    const response = await this.categoriesRepository.findCategoryByIdAdmin(id);
    if (response.status_code === 404) {
      throw new NotFoundException(response.message);
    }
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<ApiResponseFormat<any>> {
    const response = await this.categoriesRepository.createCategory(createCategoryDto);
    if (response.status_code !== 201) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto): Promise<ApiResponseFormat<any>> {
    const categoryResponse = await this.categoriesRepository.findCategoryByIdAdmin(id);
    if (categoryResponse.status_code === 404) {
      throw new NotFoundException(categoryResponse.message);
    }
    if (categoryResponse.status_code !== 200) {
      throw new InternalServerErrorException(categoryResponse.message);
    }

    const response = await this.categoriesRepository.updateCategory(id, updateCategoryDto);
    if (response.status_code === 400) {
      throw new BadRequestException(response.message);
    }
    if (response.status_code === 404) {
      throw new NotFoundException(response.message);
    }
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  async deleteCategory(id: number): Promise<ApiResponseFormat<boolean>> {
    const categoryResponse = await this.categoriesRepository.findCategoryByIdAdmin(id);
    if (categoryResponse.status_code === 404) {
      throw new NotFoundException(categoryResponse.message);
    }
    if (categoryResponse.status_code !== 200) {
      throw new InternalServerErrorException(categoryResponse.message);
    }

    const response = await this.categoriesRepository.deleteCategory(id);
    if (response.status_code === 404) {
      throw new NotFoundException(response.message);
    }
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }
}
