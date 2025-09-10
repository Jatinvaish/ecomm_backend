import { Injectable } from '@nestjs/common';
import {
  ApiResponseFormat,
  ApiResponse,
} from 'src/common/utils/common-response';
import { Messages } from 'src/common/utils/messages';
import {
  SelectQuery,
  InsertQuery,
  UpdateQuery,
  DeleteQuery,
} from 'src/db/postgres.client';
import {
  CategoryQueryDto,
  CreateCategoryDto,
  GetParentCategoriesDto,
  UpdateCategoryDto,
} from './dtos/category.dto';
import {
  getTotalCount,
  buildPaginationMeta,
} from 'src/common/utils/api-helpers';

@Injectable()
export class CategoriesRepository {
  private readonly categorySelectFields = `
    c.id, c.name, c.slug, c.description, c.parent_id, c.image_url, c.is_active, 
    c.sort_order, c.created_at, c.updated_at,
    pc.name as parent_name
  `;

  private readonly categorySelectFieldsSimple = `
    id, name, slug, description, parent_id, image_url, is_active, sort_order, created_at, updated_at
  `;

  private readonly categoryTranslationFields = `
    ct.name as translated_name, ct.description as translated_description, ct.slug as translated_slug
  `;

  private buildWhereClause(
    queryDto: CategoryQueryDto,
    params: any[],
    startIndex: number,
    includeTranslations: boolean = false,
  ): { whereClause: string; paramIndex: number } {
    const conditions: string[] = [];
    let paramIndex = startIndex;

    if (queryDto.search && queryDto.search.trim()) {
      if (includeTranslations) {
        conditions.push(`(
          c.name ILIKE $${paramIndex} OR 
          c.slug ILIKE $${paramIndex + 1} OR 
          c.description ILIKE $${paramIndex + 2} OR
          pc.name ILIKE $${paramIndex + 3} OR
          ct.name ILIKE $${paramIndex + 4} OR
          ct.description ILIKE $${paramIndex + 5} OR
          ct.slug ILIKE $${paramIndex + 6}
        )`);
        const searchTerm = `%${queryDto.search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        paramIndex += 7;
      } else {
        conditions.push(`(
          c.name ILIKE $${paramIndex} OR 
          c.slug ILIKE $${paramIndex + 1} OR 
          c.description ILIKE $${paramIndex + 2} OR
          pc.name ILIKE $${paramIndex + 3}
        )`);
        const searchTerm = `%${queryDto.search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        paramIndex += 4;
      }
    }

    if (queryDto.is_active !== undefined) {
      conditions.push(`c.is_active = $${paramIndex++}`);
      params.push(queryDto.is_active === 'true');
    }

    if (queryDto.parent_id !== undefined) {
      if (queryDto.parent_id === null || queryDto.parent_id === 'null') {
        conditions.push(`c.parent_id IS NULL`);
      } else {
        conditions.push(`c.parent_id = $${paramIndex++}`);
        params.push(parseInt(queryDto.parent_id as string, 10));
      }
    }

    if (queryDto.has_products !== undefined) {
      if (queryDto.has_products === 'true') {
        conditions.push(
          `EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)`,
        );
      } else {
        conditions.push(
          `NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)`,
        );
      }
    }

    if (queryDto.language_id !== undefined) {
      conditions.push(`(ct.language_id = $${paramIndex++} OR ct.language_id IS NULL)`);
      params.push(parseInt(queryDto.language_id as string, 10));
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, paramIndex };
  }

  private buildOrderClause(queryDto: CategoryQueryDto): string {
    const sortBy = queryDto.sort_by || 'sort_order';
    const sortDirection = (queryDto.sort_direction || 'asc').toUpperCase();

    // Validate sort direction
    const validDirection = ['ASC', 'DESC'].includes(sortDirection)
      ? sortDirection
      : 'ASC';

    // Map sort fields to actual database columns
    const sortFieldMap: Record<string, string> = {
      name: 'c.name',
      created_at: 'c.created_at',
      updated_at: 'c.updated_at',
      sort_order: 'c.sort_order',
      parent_name: 'pc.name',
      translated_name: 'ct.name',
    };

    const sortField = sortFieldMap[sortBy] || 'c.sort_order';

    // Default secondary sorting
    if (sortBy === 'sort_order') {
      return `ORDER BY ${sortField} ${validDirection}, c.name ASC`;
    } else {
      return `ORDER BY ${sortField} ${validDirection}, c.sort_order ASC, c.name ASC`;
    }
  }

  // --- Public/User/Vendor-facing queries ---
  async findAllActiveCategories(
    queryDto: CategoryQueryDto,
  ): Promise<ApiResponseFormat<any[]>> {
    try {
      const params: any[] = [];
      let paramIndex = 1;

      let sql = `
        SELECT ${this.categorySelectFields}${queryDto.language_id ? `, ${this.categoryTranslationFields}` : ''}
        FROM categories c
        LEFT JOIN categories pc ON c.parent_id = pc.id
      `;

      if (queryDto.language_id) {
        sql += ` LEFT JOIN category_translations ct ON c.id = ct.category_id AND ct.language_id = $${paramIndex++}`;
        params.push(parseInt(queryDto.language_id as string, 10));
      }

      sql += ` WHERE c.is_active = true`;

      // Apply additional filters but keep isActive as true
      const queryWithActiveFilter = { ...queryDto, is_active: 'true' };
      const { whereClause, paramIndex: newParamIndex } = this.buildWhereClause(
        queryWithActiveFilter,
        params,
        paramIndex,
        !!queryDto.language_id,
      );

      // Replace the base WHERE with our enhanced WHERE clause
      if (whereClause && whereClause !== 'WHERE c.is_active = true') {
        sql = sql.replace('WHERE c.is_active = true', whereClause);
      }

      sql += ` ${this.buildOrderClause(queryDto)}`;

      // Add pagination if specified
      if (queryDto.page && queryDto.per_page) {
        const page = Math.max(1, parseInt(queryDto.page.toString(), 10));
        const perPage = Math.min(
          100,
          Math.max(1, parseInt(queryDto.per_page.toString(), 10)),
        );
        const offset = (page - 1) * perPage;

        sql += ` LIMIT $${newParamIndex} OFFSET $${newParamIndex + 1}`;
        params.push(perPage, offset);
      }

      const result = await SelectQuery(sql, params);
      return ApiResponse.success(result);
    } catch (e) {
      console.error('Error in findAllActiveCategories:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async findActiveCategoryById(
    id: number,
    languageId?: number,
  ): Promise<ApiResponseFormat<any>> {
    try {
      let sql = `
        SELECT ${this.categorySelectFields}${languageId ? `, ${this.categoryTranslationFields}` : ''}
        FROM categories c
        LEFT JOIN categories pc ON c.parent_id = pc.id
      `;

      const params: any[] = [id];

      if (languageId) {
        sql += ` LEFT JOIN category_translations ct ON c.id = ct.category_id AND ct.language_id = $2`;
        params.push(languageId);
      }

      sql += ` WHERE c.id = $1 AND c.is_active = true`;

      const result = await SelectQuery(sql, params);
      if (result.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(result[0]);
    } catch (e) {
      console.error('Error in findActiveCategoryById:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async findCategoryHierarchy(
    parentId: number | null = null,
    languageId?: number,
  ): Promise<ApiResponseFormat<any[]>> {
    try {
      let sql = `
        WITH RECURSIVE category_tree AS (
          SELECT ${this.categorySelectFieldsSimple}, 0 as level, 
                 ARRAY[id] as path, name as hierarchy_name
          FROM categories 
          WHERE parent_id ${parentId ? '= $1' : 'IS NULL'} AND is_active = true
          
          UNION ALL
          
          SELECT c.${this.categorySelectFieldsSimple.replace(/(\w+)/g, 'c.$1')}, 
                 ct.level + 1, ct.path || c.id,
                 ct.hierarchy_name || ' > ' || c.name
          FROM categories c
          INNER JOIN category_tree ct ON c.parent_id = ct.id
          WHERE c.is_active = true AND ct.level < 10
        )
        SELECT ct.*, ${languageId ? 'ctr.name as translated_name, ctr.description as translated_description' : 'NULL as translated_name, NULL as translated_description'}
        FROM category_tree ct
      `;

      const params: any[] = [];
      if (parentId) params.push(parentId);

      if (languageId) {
        sql += ` LEFT JOIN category_translations ctr ON ct.id = ctr.category_id AND ctr.language_id = $${params.length + 1}`;
        params.push(languageId);
      }

      sql += ` ORDER BY path, sort_order, name`;

      const result = await SelectQuery(sql, params);
      return ApiResponse.success(result);
    } catch (e) {
      console.error('Error in findCategoryHierarchy:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // --- Admin-facing queries with pagination ---
  async findAllCategoriesAdmin(
    queryDto: CategoryQueryDto,
  ): Promise<ApiResponseFormat<any>> {
    try {
      const params: any[] = [];
      let paramIndex = 1;

      let baseQuery = `
        SELECT ${this.categorySelectFields}${queryDto.language_id ? `, ${this.categoryTranslationFields}` : ''}
        FROM categories c
        LEFT JOIN categories pc ON c.parent_id = pc.id
      `;

      if (queryDto.language_id) {
        baseQuery += ` LEFT JOIN category_translations ct ON c.id = ct.category_id AND ct.language_id = $${paramIndex++}`;
        params.push(parseInt(queryDto.language_id as string, 10));
      }

      const { whereClause, paramIndex: newParamIndex } = this.buildWhereClause(
        queryDto,
        params,
        paramIndex,
        !!queryDto.language_id,
      );
      baseQuery += ` ${whereClause}`;

      const total = await getTotalCount(baseQuery, params);

      let sql = baseQuery + ` ${this.buildOrderClause(queryDto)}`;

      const page = Math.max(1, parseInt(queryDto.page?.toString() || '1', 10));
      const perPage = Math.min(
        100,
        Math.max(1, parseInt(queryDto.per_page?.toString() || '10', 10)),
      );
      const offset = (page - 1) * perPage;

      sql += ` LIMIT $${newParamIndex} OFFSET $${newParamIndex + 1}`;
      params.push(perPage, offset);

      const result = await SelectQuery(sql, params);
      const meta = buildPaginationMeta(total, page, perPage);

      return ApiResponse.success({
        meta,
        categories: result,
      });
    } catch (e) {
      console.error('Error in findAllCategoriesAdmin:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async getParentCategories(
    dto: GetParentCategoriesDto,
  ): Promise<ApiResponseFormat<any>> {
    try {
      const initialCategoryIds: any = dto.ids || [];

      const allCategories = await SelectQuery(`
        SELECT id, name, parent_id FROM categories WHERE is_active = true
      `);

      const idToCategoryMap = new Map<number, any>();
      allCategories.forEach((cat: any) => {
        idToCategoryMap.set(cat.id, cat);
      });

      const getParentCount = (categoryId: number): number => {
        let count = 0;
        let currentCategory = idToCategoryMap.get(categoryId);
        while (currentCategory && currentCategory.parent_id !== null) {
          count++;
          currentCategory = idToCategoryMap.get(currentCategory.parent_id);
        }
        return count;
      };

      if (!initialCategoryIds || initialCategoryIds.length === 0) {
        const allCategoriesWithCount = allCategories.map((cat: any) => ({
          id: cat.id,
          category_name: `${cat.name} (${getParentCount(cat.id)})`,
          parent_id: cat.parent_id,
          parent_category_name: cat.parent_id
            ? idToCategoryMap.get(cat.parent_id)?.name || null
            : null,
        }));
        return ApiResponse.success(allCategoriesWithCount);
      }

      const initialIdSet = new Set<number>(initialCategoryIds);

      const hasRootCategory = initialCategoryIds.some((id) => {
        const category = idToCategoryMap.get(id);
        return category && category.parent_id === null;
      });

      if (hasRootCategory) {
        const allCategoriesExceptInitial = allCategories.filter(
          (cat: any) => !initialIdSet.has(cat.id),
        );

        const result = allCategoriesExceptInitial.map((cat: any) => ({
          id: cat.id,
          category_name: `${cat.name} (${getParentCount(cat.id)})`,
          parent_id: cat.parent_id,
          parent_category_name: cat.parent_id
            ? idToCategoryMap.get(cat.parent_id)?.name || null
            : null,
        }));

        return ApiResponse.success(result);
      }

      const parentCategoryIds = new Set<number>();
      let categoriesToProcess = [...initialCategoryIds];

      while (categoriesToProcess.length > 0) {
        const newCategoriesToProcess: number[] = [];
        for (const categoryId of categoriesToProcess) {
          const category = idToCategoryMap.get(categoryId);
          if (category && category.parent_id !== null) {
            const parentId = category.parent_id;
            if (
              !parentCategoryIds.has(parentId) &&
              !initialIdSet.has(parentId)
            ) {
              parentCategoryIds.add(parentId);
              newCategoriesToProcess.push(parentId);
            }
          }
        }
        categoriesToProcess = newCategoriesToProcess;
      }

      const resultCategories: any[] = [];
      for (const categoryId of Array.from(parentCategoryIds)) {
        const category = idToCategoryMap.get(categoryId);
        if (category) {
          const parentCategoryName: string | null = category.parent_id
            ? idToCategoryMap.get(category.parent_id)?.name || null
            : null;
          if (!initialCategoryIds.includes(category.id)) {
            resultCategories.push({
              id: category.id,
              category_name: `${category.name} (${getParentCount(category.id)})`,
              parent_id: category.parent_id,
              parent_category_name: parentCategoryName,
            });
          }
        }
      }

      return ApiResponse.success(resultCategories);
    } catch (error) {
      console.error('Error fetching parent categories:', error);
      return ApiResponse.error(
        'Failed to retrieve categories or their parents due to an internal error.',
        500,
      );
    }
  }

  async findCategoryByIdAdmin(
    id: number,
    languageId?: number,
  ): Promise<ApiResponseFormat<any>> {
    try {
      let sql = `
        SELECT ${this.categorySelectFields}${languageId ? `, ${this.categoryTranslationFields}` : ''}
        FROM categories c
        LEFT JOIN categories pc ON c.parent_id = pc.id
      `;

      const params: any[] = [id];

      if (languageId) {
        sql += ` LEFT JOIN category_translations ct ON c.id = ct.category_id AND ct.language_id = $2`;
        params.push(languageId);
      }

      sql += ` WHERE c.id = $1`;

      const result = await SelectQuery(sql, params);
      if (result.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(result[0]);
    } catch (e) {
      console.error('Error in findCategoryByIdAdmin:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async findCategoriesForSelect(
    languageId?: number,
  ): Promise<ApiResponseFormat<any[]>> {
    try {
      let sql = `
        SELECT c.id, c.name, c.parent_id${languageId ? ', ct.name as translated_name' : ''}, 
               CASE 
                 WHEN c.parent_id IS NULL THEN ${languageId ? 'COALESCE(ct.name, c.name)' : 'c.name'}
                 ELSE (
                   SELECT ${languageId ? 'COALESCE(pct.name, pc.name)' : 'pc.name'} || ' > ' || ${languageId ? 'COALESCE(ct.name, c.name)' : 'c.name'} 
                   FROM categories pc 
                   ${languageId ? 'LEFT JOIN category_translations pct ON pc.id = pct.category_id AND pct.language_id = $1' : ''}
                   WHERE pc.id = c.parent_id
                 )
               END as display_name
        FROM categories c
      `;

      const params: any[] = [];

      if (languageId) {
        sql += ` LEFT JOIN category_translations ct ON c.id = ct.category_id AND ct.language_id = $1`;
        params.push(languageId);
      }

      sql += `
        WHERE c.is_active = true
        ORDER BY c.parent_id NULLS FIRST, c.sort_order ASC, ${languageId ? 'COALESCE(ct.name, c.name)' : 'c.name'} ASC
      `;

      const result = await SelectQuery(sql, params);
      return ApiResponse.success(result);
    } catch (e) {
      console.error('Error in findCategoriesForSelect:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // --- CRUD Operations ---
  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<ApiResponseFormat<any>> {
    try {
      // Check if parent exists if parent_id is provided
      if (createCategoryDto.parent_id) {
        const parentCheck: any = await this.findCategoryByIdAdmin(
          createCategoryDto.parent_id,
        );
        if (!parentCheck.result) {
          return ApiResponse.badRequest('Parent category does not exist');
        }
      }

      // Check for duplicate slug
      const slugCheck = await SelectQuery(
        'SELECT id FROM categories WHERE slug = $1',
        [createCategoryDto.slug],
      );
      if (slugCheck.length > 0) {
        return ApiResponse.badRequest('Category with this slug already exists');
      }

      const sql = `
        INSERT INTO categories (name, slug, description, parent_id, image_url, is_active, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING ${this.categorySelectFieldsSimple}`;

      const params = [
        createCategoryDto.name,
        createCategoryDto.slug,
        createCategoryDto.description || null,
        createCategoryDto.parent_id || null,
        createCategoryDto.image_url || null,
        createCategoryDto.is_active ?? true,
        createCategoryDto.sort_order ?? 0,
      ];

      const result = await InsertQuery(sql, params);

      // If translations are provided, insert them
      if (createCategoryDto.translations && createCategoryDto.translations.length > 0) {
        for (const translation of createCategoryDto.translations) {
          await InsertQuery(
            `INSERT INTO category_translations (category_id, language_id, name, description, slug) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
              result.rows[0].id,
              translation.language_id,
              translation.name,
              translation.description || null,
              translation.slug,
            ]
          );
        }
      }

      return ApiResponse.created(result.rows[0]);
    } catch (e) {
      console.error('Error in createCategory:', e);
      if (e.code === '23505') {
        return ApiResponse.badRequest('Category with this slug already exists');
      }
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async updateCategory(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<ApiResponseFormat<any>> {
    try {
      const existingCategory: any = await this.findCategoryByIdAdmin(id);
      if (!existingCategory.result) {
        return existingCategory;
      }

      // Check if parent exists if parent_id is being updated
      if (updateCategoryDto.parent_id !== undefined) {
        if (updateCategoryDto.parent_id) {
          if (updateCategoryDto.parent_id === id) {
            return ApiResponse.badRequest('Category cannot be its own parent');
          }

          const parentCheck: any = await this.findCategoryByIdAdmin(
            updateCategoryDto.parent_id,
          );
          if (!parentCheck.result) {
            return ApiResponse.badRequest('Parent category does not exist');
          }

          const circularCheck = await SelectQuery(
            `
            WITH RECURSIVE parent_tree AS (
              SELECT id, parent_id FROM categories WHERE id = $1
              UNION ALL
              SELECT c.id, c.parent_id 
              FROM categories c
              INNER JOIN parent_tree pt ON c.parent_id = pt.id
              WHERE pt.parent_id IS NOT NULL
            )
            SELECT COUNT(*) as count FROM parent_tree WHERE id = $2
          `,
            [updateCategoryDto.parent_id, id],
          );

          if (parseInt(circularCheck[0]?.count || '0', 10) > 0) {
            return ApiResponse.badRequest(
              'Cannot create circular reference in category hierarchy',
            );
          }
        }
      }

      // Check for duplicate slug if slug is being updated
      if (updateCategoryDto.slug) {
        const slugCheck = await SelectQuery(
          'SELECT id FROM categories WHERE slug = $1 AND id != $2',
          [updateCategoryDto.slug, id],
        );
        if (slugCheck.length > 0) {
          return ApiResponse.badRequest(
            'Category with this slug already exists',
          );
        }
      }

      const fieldsToUpdate: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Extract translations before processing main fields
      const { translations, ...mainFields } = updateCategoryDto;

      for (const key in mainFields) {
        if (mainFields.hasOwnProperty(key) && mainFields[key] !== undefined) {
          fieldsToUpdate.push(`${key} = $${paramIndex++}`);
          params.push(mainFields[key]);
        }
      }

      if (fieldsToUpdate.length === 0 && (!translations || translations.length === 0)) {
        return ApiResponse.badRequest(Messages.NO_FIELDS_TO_UPDATE);
      }

      let result: any;

      if (fieldsToUpdate.length > 0) {
        params.push(id);
        const sql = `
          UPDATE categories
          SET ${fieldsToUpdate.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramIndex}
          RETURNING ${this.categorySelectFieldsSimple}`;

        result = await UpdateQuery(sql, params);
        if (result.rows.length === 0) {
          return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
        }
      }

      // Handle translations updates
      if (translations && translations.length > 0) {
        for (const translation of translations) {
          const translationExists = await SelectQuery(
            'SELECT id FROM category_translations WHERE category_id = $1 AND language_id = $2',
            [id, translation.language_id]
          );

          if (translationExists.length > 0) {
            // Update existing translation
            await UpdateQuery(
              `UPDATE category_translations 
               SET name = $1, description = $2, slug = $3, updated_at = CURRENT_TIMESTAMP
               WHERE category_id = $4 AND language_id = $5`,
              [
                translation.name,
                translation.description || null,
                translation.slug,
                id,
                translation.language_id,
              ]
            );
          } else {
            // Insert new translation
            await InsertQuery(
              `INSERT INTO category_translations (category_id, language_id, name, description, slug) 
               VALUES ($1, $2, $3, $4, $5)`,
              [
                id,
                translation.language_id,
                translation.name,
                translation.description || null,
                translation.slug,
              ]
            );
          }
        }
      }

      // Return updated category
      const finalResult = result || await SelectQuery(
        `SELECT ${this.categorySelectFieldsSimple} FROM categories WHERE id = $1`,
        [id]
      );

      return ApiResponse.success(result ? result.rows[0] : finalResult[0]);
    } catch (e) {
      console.error('Error in updateCategory:', e);
      if (e.code === '23505') {
        return ApiResponse.badRequest('Category with this slug already exists');
      }
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async deleteCategory(id: number): Promise<ApiResponseFormat<boolean>> {
    try {
      const existingCategory: any = await this.findCategoryByIdAdmin(id);
      if (!existingCategory.result) {
        return existingCategory;
      }

      // Check if category has child categories
      const childCheck = await SelectQuery(
        'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1',
        [id],
      );
      if (parseInt(childCheck[0]?.count || '0', 10) > 0) {
        return ApiResponse.badRequest(
          'Cannot delete category that has subcategories. Please delete or reassign subcategories first.',
        );
      }

      // Check if category has products
      const productCheck = await SelectQuery(
        'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
        [id],
      );
      if (parseInt(productCheck[0]?.count || '0', 10) > 0) {
        return ApiResponse.badRequest(
          'Cannot delete category that has products. Please reassign or delete products first.',
        );
      }

      // Delete translations first (foreign key constraint)
      await DeleteQuery('DELETE FROM category_translations WHERE category_id = $1', [id]);

      // Delete category
      const sql = `DELETE FROM categories WHERE id = $1`;
      const result = await DeleteQuery(sql, [id]);
      if (result.rowCount === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(true, Messages.RESOURCE_DELETED);
    } catch (e) {
      console.error('Error in deleteCategory:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // --- Translation Methods ---
  async createCategoryTranslation(
    categoryId: number,
    languageId: number,
    translationData: { name: string; description?: string; slug: string },
  ): Promise<ApiResponseFormat<any>> {
    try {
      // Check if category exists
      const categoryExists = await SelectQuery(
        'SELECT id FROM categories WHERE id = $1',
        [categoryId]
      );
      if (categoryExists.length === 0) {
        return ApiResponse.notFound('Category not found');
      }

      // Check if language exists
      const languageExists = await SelectQuery(
        'SELECT id FROM languages WHERE id = $1 AND is_active = true',
        [languageId]
      );
      if (languageExists.length === 0) {
        return ApiResponse.notFound('Language not found or inactive');
      }

      // Check if translation already exists
      const translationExists = await SelectQuery(
        'SELECT id FROM category_translations WHERE category_id = $1 AND language_id = $2',
        [categoryId, languageId]
      );
      if (translationExists.length > 0) {
        return ApiResponse.badRequest('Translation for this language already exists');
      }

      // Check for duplicate slug within the same language
      const slugCheck = await SelectQuery(
        'SELECT id FROM category_translations WHERE language_id = $1 AND slug = $2',
        [languageId, translationData.slug]
      );
      if (slugCheck.length > 0) {
        return ApiResponse.badRequest('Translation with this slug already exists for this language');
      }

      const sql = `
        INSERT INTO category_translations (category_id, language_id, name, description, slug)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`;

      const result = await InsertQuery(sql, [
        categoryId,
        languageId,
        translationData.name,
        translationData.description || null,
        translationData.slug,
      ]);

      return ApiResponse.created(result.rows[0]);
    } catch (e) {
      console.error('Error in createCategoryTranslation:', e);
      if (e.code === '23505') {
        return ApiResponse.badRequest('Translation with this slug already exists for this language');
      }
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async updateCategoryTranslation(
    categoryId: number,
    languageId: number,
    translationData: Partial<{ name: string; description?: string; slug: string }>,
  ): Promise<ApiResponseFormat<any>> {
    try {
      // Check if translation exists
      const translationExists = await SelectQuery(
        'SELECT id FROM category_translations WHERE category_id = $1 AND language_id = $2',
        [categoryId, languageId]
      );
      if (translationExists.length === 0) {
        return ApiResponse.notFound('Translation not found');
      }

      // Check for duplicate slug if slug is being updated
      if (translationData.slug) {
        const slugCheck = await SelectQuery(
          'SELECT id FROM category_translations WHERE language_id = $1 AND slug = $2 AND category_id != $3',
          [languageId, translationData.slug, categoryId]
        );
        if (slugCheck.length > 0) {
          return ApiResponse.badRequest('Translation with this slug already exists for this language');
        }
      }

      const fieldsToUpdate: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      for (const key in translationData) {
        if (translationData.hasOwnProperty(key) && translationData[key] !== undefined) {
          fieldsToUpdate.push(`${key} = ${paramIndex++}`);
          params.push(translationData[key]);
        }
      }

      if (fieldsToUpdate.length === 0) {
        return ApiResponse.badRequest('No fields to update');
      }

      params.push(categoryId, languageId);

      const sql = `
        UPDATE category_translations
        SET ${fieldsToUpdate.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE category_id = ${paramIndex++} AND language_id = ${paramIndex}
        RETURNING *`;

      const result = await UpdateQuery(sql, params);
      if (result.rows.length === 0) {
        return ApiResponse.notFound('Translation not found');
      }

      return ApiResponse.success(result.rows[0]);
    } catch (e) {
      console.error('Error in updateCategoryTranslation:', e);
      if (e.code === '23505') {
        return ApiResponse.badRequest('Translation with this slug already exists for this language');
      }
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async deleteCategoryTranslation(
    categoryId: number,
    languageId: number,
  ): Promise<ApiResponseFormat<boolean>> {
    try {
      const sql = `DELETE FROM category_translations WHERE category_id = $1 AND language_id = $2`;
      const result = await DeleteQuery(sql, [categoryId, languageId]);
      
      if (result.rowCount === 0) {
        return ApiResponse.notFound('Translation not found');
      }
      
      return ApiResponse.success(true, 'Translation deleted successfully');
    } catch (e) {
      console.error('Error in deleteCategoryTranslation:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async getCategoryTranslations(categoryId: number): Promise<ApiResponseFormat<any[]>> {
    try {
      // Check if category exists
      const categoryExists = await SelectQuery(
        'SELECT id FROM categories WHERE id = $1',
        [categoryId]
      );
      if (categoryExists.length === 0) {
        return ApiResponse.notFound('Category not found');
      }

      const sql = `
        SELECT ct.*, l.name as language_name, l.code as language_code
        FROM category_translations ct
        LEFT JOIN languages l ON ct.language_id = l.id
        WHERE ct.category_id = $1
        ORDER BY l.name ASC`;

      const result = await SelectQuery(sql, [categoryId]);
      return ApiResponse.success(result);
    } catch (e) {
      console.error('Error in getCategoryTranslations:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // --- Bulk Operations ---
  async bulkUpdateCategoryStatus(
    categoryIds: number[],
    isActive: boolean,
  ): Promise<ApiResponseFormat<any>> {
    try {
      if (!categoryIds || categoryIds.length === 0) {
        return ApiResponse.badRequest('No category IDs provided');
      }

      const placeholders = categoryIds.map((_, index) => `${index + 2}`).join(',');
      const sql = `
        UPDATE categories 
        SET is_active = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
        RETURNING id, name, is_active`;

      const params = [isActive, ...categoryIds];
      const result = await UpdateQuery(sql, params);

      return ApiResponse.success({
        updated_count: result.rowCount,
        updated_categories: result.rows,
      });
    } catch (e) {
      console.error('Error in bulkUpdateCategoryStatus:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async bulkDeleteCategories(categoryIds: number[]): Promise<ApiResponseFormat<any>> {
    try {
      if (!categoryIds || categoryIds.length === 0) {
        return ApiResponse.badRequest('No category IDs provided');
      }

      // Check for categories with children
      const placeholders = categoryIds.map((_, index) => `${index + 1}`).join(',');
      const childrenCheck = await SelectQuery(
        `SELECT DISTINCT parent_id FROM categories WHERE parent_id IN (${placeholders})`,
        categoryIds
      );

      if (childrenCheck.length > 0) {
        return ApiResponse.badRequest(
          'Some categories have subcategories. Please delete or reassign subcategories first.'
        );
      }

      // Check for categories with products
      const productsCheck = await SelectQuery(
        `SELECT DISTINCT category_id FROM products WHERE category_id IN (${placeholders})`,
        categoryIds
      );

      if (productsCheck.length > 0) {
        return ApiResponse.badRequest(
          'Some categories have products. Please reassign or delete products first.'
        );
      }

      // Delete translations first
      await DeleteQuery(
        `DELETE FROM category_translations WHERE category_id IN (${placeholders})`,
        categoryIds
      );

      // Delete categories
      const sql = `DELETE FROM categories WHERE id IN (${placeholders}) RETURNING id, name`;
      const result = await DeleteQuery(sql, categoryIds);

      return ApiResponse.success({
        deleted_count: result.rowCount,
        deleted_categories: result.rows,
      });
    } catch (e) {
      console.error('Error in bulkDeleteCategories:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async reorderCategories(
    categories: Array<{ id: number; sort_order: number; parent_id?: number }>,
  ): Promise<ApiResponseFormat<any>> {
    try {
      if (!categories || categories.length === 0) {
        return ApiResponse.badRequest('No categories provided for reordering');
      }

      const updatedCategories = [];

      for (const category of categories) {
        // Validate parent_id if provided
        if (category.parent_id !== undefined && category.parent_id !== null) {
          // Check if parent exists
          const parentExists = await SelectQuery(
            'SELECT id FROM categories WHERE id = $1',
            [category.parent_id]
          );
          if (parentExists.length === 0) {
            return ApiResponse.badRequest(`Parent category with ID ${category.parent_id} does not exist`);
          }

          // Check for circular reference
          if (category.parent_id === category.id) {
            return ApiResponse.badRequest(`Category ${category.id} cannot be its own parent`);
          }
        }

        const sql = `
          UPDATE categories 
          SET sort_order = $1, parent_id = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          RETURNING id, name, sort_order, parent_id`;

        const result = await UpdateQuery(sql, [
          category.sort_order,
          category.parent_id || null,
          category.id,
        ]);

        if (result.rows.length > 0) {
          updatedCategories.push(result.rows[0]);
        }
      }

      return ApiResponse.success({
        updated_count: updatedCategories.length,
        updated_categories: updatedCategories,
      });
    } catch (e) {
      console.error('Error in reorderCategories:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // --- Analytics and Reports ---
  async getCategoryStats(): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_categories,
          COUNT(*) FILTER (WHERE is_active = true) as active_categories,
          COUNT(*) FILTER (WHERE parent_id IS NULL) as root_categories,
          COUNT(*) FILTER (WHERE parent_id IS NOT NULL) as sub_categories,
          COUNT(DISTINCT parent_id) FILTER (WHERE parent_id IS NOT NULL) as categories_with_children,
          (SELECT COUNT(*) FROM category_translations) as total_translations,
          (SELECT COUNT(DISTINCT language_id) FROM category_translations) as languages_used
        FROM categories
      `;
      const result = await SelectQuery(sql, []);
      return ApiResponse.success(result[0]);
    } catch (e) {
      console.error('Error in getCategoryStats:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async getCategoriesWithProductCount(): Promise<ApiResponseFormat<any[]>> {
    try {
      const sql = `
        SELECT 
          c.id, c.name, c.slug, c.is_active, c.parent_id,
          pc.name as parent_name,
          COUNT(p.id) as product_count,
          COUNT(p.id) FILTER (WHERE p.is_active = true) as active_product_count
        FROM categories c
        LEFT JOIN categories pc ON c.parent_id = pc.id
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id, c.name, c.slug, c.is_active, c.parent_id, pc.name
        ORDER BY product_count DESC, c.name ASC
      `;
      const result = await SelectQuery(sql, []);
      return ApiResponse.success(result);
    } catch (e) {
      console.error('Error in getCategoriesWithProductCount:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async getCategoryTranslationStats(): Promise<ApiResponseFormat<any[]>> {
    try {
      const sql = `
        SELECT 
          l.id as language_id,
          l.name as language_name,
          l.code as language_code,
          l.is_default,
          COUNT(ct.id) as translated_categories,
          (SELECT COUNT(*) FROM categories WHERE is_active = true) as total_active_categories,
          ROUND(
            (COUNT(ct.id)::numeric / NULLIF((SELECT COUNT(*) FROM categories WHERE is_active = true), 0)) * 100, 
            2
          ) as completion_percentage
        FROM languages l
        LEFT JOIN category_translations ct ON l.id = ct.language_id
        LEFT JOIN categories c ON ct.category_id = c.id AND c.is_active = true
        WHERE l.is_active = true
        GROUP BY l.id, l.name, l.code, l.is_default
        ORDER BY completion_percentage DESC, l.name ASC
      `;
      const result = await SelectQuery(sql, []);
      return ApiResponse.success(result);
    } catch (e) {
      console.error('Error in getCategoryTranslationStats:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // --- Advanced Search and Filtering ---
  async searchCategoriesWithTranslations(
    searchTerm: string,
    languageId?: number,
    includeInactive: boolean = false,
  ): Promise<ApiResponseFormat<any[]>> {
    try {
      let sql = `
        SELECT DISTINCT c.${this.categorySelectFieldsSimple.replace(/(\w+)/g, 'c.$1')},
               pc.name as parent_name,
               ${languageId ? 'ct.name as translated_name, ct.description as translated_description' : 'NULL as translated_name, NULL as translated_description'}
        FROM categories c
        LEFT JOIN categories pc ON c.parent_id = pc.id
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (languageId) {
        sql += ` LEFT JOIN category_translations ct ON c.id = ct.category_id AND ct.language_id = ${paramIndex++}`;
        params.push(languageId);
      }

      const searchPattern = `%${searchTerm.trim()}%`;
      
      if (languageId) {
        sql += `
          WHERE (c.name ILIKE ${paramIndex} OR c.description ILIKE ${paramIndex + 1} OR 
                 ct.name ILIKE ${paramIndex + 2} OR ct.description ILIKE ${paramIndex + 3})
        `;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        paramIndex += 4;
      } else {
        sql += `
          WHERE (c.name ILIKE ${paramIndex} OR c.description ILIKE ${paramIndex + 1})
        `;
        params.push(searchPattern, searchPattern);
        paramIndex += 2;
      }

      if (!includeInactive) {
        sql += ` AND c.is_active = true`;
      }

      sql += ` ORDER BY c.name ASC`;

      const result = await SelectQuery(sql, params);
      return ApiResponse.success(result);
    } catch (e) {
      console.error('Error in searchCategoriesWithTranslations:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }
}