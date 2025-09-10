import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { ApiResponseFormat } from 'src/common/utils/common-response';
import {
  CategoryQueryDto,
  CreateCategoryDto,
  GetParentCategoriesDto,
  UpdateCategoryDto,
  CreateCategoryTranslationDto,
  UpdateCategoryTranslationDto,
} from './dtos/category.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  // --- Public/User/Vendor-facing APIs ---
  @Get()
  async getActiveCategories(
    @Query() query: CategoryQueryDto,
  ): Promise<ApiResponseFormat<any[]>> {
    return this.categoriesRepository.findAllActiveCategories(query);
  }

  @Get('hierarchy')
  async getCategoryHierarchy(
    @Query('parent_id') parentId?: string,
    @Query('language_id') languageId?: string,
  ): Promise<ApiResponseFormat<any[]>> {
    const parent = parentId ? parseInt(parentId, 10) : null;
    const language = languageId ? parseInt(languageId, 10) : undefined;
    return this.categoriesRepository.findCategoryHierarchy(parent, language);
  }

  @Get('for-select')
  async getCategoriesForSelect(
    @Query('language_id') languageId?: string,
  ): Promise<ApiResponseFormat<any[]>> {
    const language = languageId ? parseInt(languageId, 10) : undefined;
    return this.categoriesRepository.findCategoriesForSelect(language);
  }

  @Get(':id')
  async getActiveCategory(
    @Param('id') id: string,
    @Query('language_id') languageId?: string,
  ): Promise<ApiResponseFormat<any>> {
    const language = languageId ? parseInt(languageId, 10) : undefined;
    return this.categoriesRepository.findActiveCategoryById(parseInt(id, 10), language);
  }

  // --- Admin-facing APIs ---
  @Post('create')
  @UseGuards(AuthGuard, RoleGuard)
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<ApiResponseFormat<any>> {
    return this.categoriesRepository.createCategory(createCategoryDto);
  }

  @Get('admin/all')
  @UseGuards(AuthGuard, RoleGuard)
  async getAllCategoriesForAdmin(
    @Query() query: CategoryQueryDto,
  ): Promise<ApiResponseFormat<any>> {
    return this.categoriesRepository.findAllCategoriesAdmin(query);
  }

  @Get('admin/stats')
  @UseGuards(AuthGuard, RoleGuard)
  async getCategoryStats(): Promise<ApiResponseFormat<any>> {
    return this.categoriesRepository.getCategoryStats();
  }

  @Get('admin/product-count')
  @UseGuards(AuthGuard, RoleGuard)
  async getCategoriesWithProductCount(): Promise<ApiResponseFormat<any[]>> {
    return this.categoriesRepository.getCategoriesWithProductCount();
  }

  @Post('get-parent-categories')
  @UseGuards(AuthGuard, RoleGuard)
  async getParentCategories(
    @Body() query: GetParentCategoriesDto,
  ): Promise<ApiResponseFormat<any>> {
    return this.categoriesRepository.getParentCategories(query);
  }

  @Get('admin/translation-stats')
  @UseGuards(AuthGuard, RoleGuard)
  async getCategoryTranslationStats(): Promise<ApiResponseFormat<any[]>> {
    return this.categoriesRepository.getCategoryTranslationStats();
  }

  @Get('admin/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async getCategoryAdmin(
    @Param('id') id: string,
    @Query('language_id') languageId?: string,
  ): Promise<ApiResponseFormat<any>> {
    const language = languageId ? parseInt(languageId, 10) : undefined;
    return this.categoriesRepository.findCategoryByIdAdmin(parseInt(id, 10), language);
  }

  // Translation endpoints
  @Get('admin/:id/translations')
  @UseGuards(AuthGuard, RoleGuard)
  async getCategoryTranslations(
    @Param('id') id: string,
  ): Promise<ApiResponseFormat<any[]>> {
    return this.categoriesRepository.getCategoryTranslations(parseInt(id, 10));
  }

  @Post('admin/:id/translations')
  @UseGuards(AuthGuard, RoleGuard)
  async createCategoryTranslation(
    @Param('id') id: string,
    @Body() createTranslationDto: CreateCategoryTranslationDto,
  ): Promise<ApiResponseFormat<any>> {
    return this.categoriesRepository.createCategoryTranslation(
      parseInt(id, 10),
      createTranslationDto.language_id,
      createTranslationDto,
    );
  }

  @Put('admin/:id/translations/:language_id')
  @UseGuards(AuthGuard, RoleGuard)
  async updateCategoryTranslation(
    @Param('id') id: string,
    @Param('language_id') languageId: string,
    @Body() updateTranslationDto: UpdateCategoryTranslationDto,
  ): Promise<ApiResponseFormat<any>> {
    return this.categoriesRepository.updateCategoryTranslation(
      parseInt(id, 10),
      parseInt(languageId, 10),
      updateTranslationDto,
    );
  }

  @Delete('admin/:id/translations/:language_id')
  @UseGuards(AuthGuard, RoleGuard)
  async deleteCategoryTranslation(
    @Param('id') id: string,
    @Param('language_id') languageId: string,
  ): Promise<ApiResponseFormat<boolean>> {
    return this.categoriesRepository.deleteCategoryTranslation(
      parseInt(id, 10),
      parseInt(languageId, 10),
    );
  }

  @Put('admin/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<ApiResponseFormat<any>> {
    return this.categoriesRepository.updateCategory(
      parseInt(id, 10),
      updateCategoryDto,
    );
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async deleteCategory(
    @Param('id') id: string,
  ): Promise<ApiResponseFormat<boolean>> {
    return this.categoriesRepository.deleteCategory(parseInt(id, 10));
  }
}