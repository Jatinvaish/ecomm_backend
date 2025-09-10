// src/utils/api-helpers.ts

import { SelectQuery } from "src/db/postgres.client";

// This DTO defines the meta-data returned with a paginated response.
export interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

// This function builds the ORDER BY clause for any query.
export function buildOrderClause(
  queryDto: { order_by?: string; order_direction?: 'ASC' | 'DESC' },
  defaultOrderBy = 'id',
  defaultOrderDirection: 'ASC' | 'DESC' = 'ASC',
): string {
  const orderBy = queryDto.order_by || defaultOrderBy;
  const orderDirection = queryDto.order_direction || defaultOrderDirection;

  // IMPORTANT: For security, ensure `orderBy` is a valid column name
  // to prevent SQL injection. This example assumes `orderBy` is safe.
  // In a real app, you would check against a list of allowed columns.
  return `ORDER BY ${orderBy} ${orderDirection}`;
}

// This function gets the total count of items based on the base query.
export async function getTotalCount(
  baseQuery: string,
  params: any[],
): Promise<number> {
  try {
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`;
    const countResult = await SelectQuery(countQuery, params);
    return parseInt(countResult[0]?.total || '0', 10);
  } catch (error) {
    console.error('Error getting total count:', error);
    return 0;
  }
}

// This function builds the pagination metadata object.
export function buildPaginationMeta(
  total: number,
  page: number,
  perPage: number,
): PaginationMeta {
  const lastPage = Math.ceil(total / perPage) || 1;
  const from = total > 0 ? (page - 1) * perPage + 1 : 0;
  const to = Math.min(page * perPage, total);

  return {
    total,
    per_page: perPage,
    current_page: page,
    last_page: lastPage,
    from,
    to,
  };
}


export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}




export function determineMediaType(resourceType: string, format: string): string {
  if (resourceType === 'image') {
    return 'image';
  }

  if (resourceType === 'video') {
    return 'video';
  }

  if (resourceType === 'raw') {
    // Check format for documents and other files
    const documentFormats = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
    const audioFormats = ['mp3', 'wav', 'ogg', 'aac', 'flac'];
    const archiveFormats = ['zip', 'rar', '7z'];

    if (documentFormats.includes(format.toLowerCase())) {
      return 'document';
    }

    if (audioFormats.includes(format.toLowerCase())) {
      return 'audio';
    }

    if (archiveFormats.includes(format.toLowerCase())) {
      return 'archive';
    }

    return 'document'; // Default for unknown raw files
  }

  return 'document'; // Default fallback
}


export function generateThumbnailUrl(file: any, mediaType: string): string {
  if (mediaType === 'image') {
    // For images, generate a thumbnail URL
    return file.secure_url.replace('/upload/', '/upload/w_300,h_300,c_fill/');
  }

  if (mediaType === 'video') {
    // For videos, generate a thumbnail from the first frame
    return file.secure_url.replace('/upload/', '/upload/so_0,w_300,h_300,c_fill/') + '.jpg';
  }

  // For documents and other files, return the original URL or a placeholder
  return file.secure_url;
}


export function getMimeType(format: string, resourceType: string): string {
  const mimeTypeMap: { [key: string]: string } = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',

    // Videos
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'avi': 'video/avi',
    'mov': 'video/mov',
    'wmv': 'video/wmv',
    'flv': 'video/flv',
    'mkv': 'video/mkv',

    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',

    // Audio
    'mp3': 'audio/mp3',
    'wav': 'audio/wav',
    'aac': 'audio/aac',
    'flac': 'audio/flac',

    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed'
  };

  return mimeTypeMap[format.toLowerCase()] || 'application/octet-stream';
}



export function buildInsertQueryWithBooleanCasting(
  tableName: string,
  columns: string[],
  booleanColumns: string[],
  valueRows: any[][]
): { query: string; values: any[] } {

  const valuesClause = valueRows.map((_, rowIndex) => {
    const params = columns.map((colName, colIndex) => {
      const paramIndex = rowIndex * columns.length + colIndex + 1;

      // Add ::boolean casting for boolean columns
      if (booleanColumns.includes(colName)) {
        return `$${paramIndex}::boolean`;
      }
      return `$${paramIndex}`;
    });

    return `(${params.join(', ')})`;
  }).join(', ');

  const query = `
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES ${valuesClause}
  `;

  return { query, values: valueRows.flat() };
}

export type Currency = { id:number; code:string; symbol:string; decimal_places:number };
export type LeanGallery   = { url:string; thumb:string; alt:string };
export type LeanVariant   = { id:number; name:string; values:Array<{id:number; label:string; hex?:string}> };
export type LeanComb      = {
  id:number; combinationKey:string; sku:string;
  price:number; comparePrice:number;
  stockQuantity:number; stockStatus:string;
  image?:string;
};
export type LeanReview    = {
  id:number; rating:number; title:string; comment:string;
  user:{ id:number; name:string; avatar?:string };
  createdAt:string; verified:boolean; helpful:number; images?:string[];
};
export type LeanRating    = { avg:number; count:number; breakdown:Record<number,number> };

export function mapGallery(rows:any[]):LeanGallery[] {
  return rows.map(r => ({
    url  : r.url,
    thumb: r.thumbnail_url,
    alt  : r.alt_text
  }));
}

export function mapVariants(rows:any[]):LeanVariant[] {
  return rows.map(v => ({
    id   : v.id,
    name : v.name ?? v.attribute_name,
    values: (v.values ?? []).map((val:any) => ({
      id   : val.id,
      label: val.value ?? val.attribute_value,
      hex  : val.color_code ?? undefined
    }))
  }));
}

export function mapCombinations(rows:any[], currencyId:number):LeanComb[] {
  return rows.map(c => ({
    id            : c.id,
    combinationKey: c.combination_key,
    sku           : c.sku,
    price         : c.current_price,
    comparePrice  : c.current_compare_price,
    stockQuantity : c.stock_quantity,
    stockStatus   : c.stock_info?.stock_status ?? 'unknown',
    image         : c.image_url
  }));
}

export function mapReviews(rows:any[]):LeanReview[] {
  return rows.map(r => ({
    id       : r.id,
    rating   : r.rating,
    title    : r.title,
    comment  : r.comment,
    createdAt: r.created_at,
    verified : r.verified_purchase,
    helpful  : r.helpful_votes,
    images   : r.images,
    user     : { id:r.user_id, name:r.user_name, avatar:r.user_avatar }
  }));
}

export function buildRatingStats(raw:any):LeanRating {
  return {
    avg       : parseFloat(raw.avg_rating ?? 0),
    count     : raw.total_reviews ?? 0,
    breakdown : {
      5: raw.five_star  ?? 0,
      4: raw.four_star  ?? 0,
      3: raw.three_star ?? 0,
      2: raw.two_star   ?? 0,
      1: raw.one_star   ?? 0
    }
  };
}

export function calcDiscount(compare:number|null, price:number):{percent:number;savings:number}{
  if (!compare || price >= compare) return { percent:0, savings:0 };
  const savings  = compare - price;
  const percent  = Math.round((savings / compare) * 100);
  return { percent, savings };
}
