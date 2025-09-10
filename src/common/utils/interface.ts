export interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

export interface PaginatedResult<T> {
  result: T[];
  meta: PaginationMeta;
}


export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

// Define the desired output structure for each category
export interface CategoryOutput {
  id: number;
  category_name: string;
  parent_id: number | null;
  parent_category_name: string | null;
}



export interface CreateProductRequestDto {
  name: string;
  description?: string;
  short_description?: string;
  sku?: string;
  category_id?: number;
  brand_id?: number;
  tax_id?: number;
  price: number;
  compare_price?: number;
  cost_price?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  meta_title?: string;
  meta_description?: string;
  slug?: string;
  status?: 'draft' | 'active' | 'archived';
  visibility?: 'visible' | 'hidden';
  is_featured?: boolean;
  is_physical?: boolean;
  variants?: {
    name: string;
    sort_order?: number;
    values: {
      value: string;
      sort_order?: number;
    }[];
  }[];
  specifications?: {
    name: string;
    value: string;
    sort_order?: number;
  }[];
  variant_combinations?: {
    variant_value_ids: number[];
    sku?: string;
    price?: number;
    compare_price?: number;
    cost_price?: number;
    weight?: number;
    image_url?: string;
    is_active?: boolean;
  }[];
  gallery?: {
    media_type: 'image' | 'video';
    url: string;
    alt_text?: string;
    sort_order?: number;
    is_primary?: boolean;
  }[];
}

export interface UpdateProductRequestDto {
  name?: string;
  description?: string;
  short_description?: string;
  sku?: string;
  category_id?: number;
  brand_id?: number;
  tax_id?: number;
  price?: number;
  compare_price?: number;
  cost_price?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  meta_title?: string;
  meta_description?: string;
  slug?: string;
  status?: 'draft' | 'active' | 'archived';
  visibility?: 'visible' | 'hidden';
  is_featured?: boolean;
  is_physical?: boolean;
  variants?: {
    name: string;
    sort_order?: number;
    values: {
      value: string;
      sort_order?: number;
    }[];
  }[];
  specifications?: {
    name: string;
    value: string;
    sort_order?: number;
  }[];
  variant_combinations?: {
    variant_value_ids: number[];
    sku?: string;
    price?: number;
    compare_price?: number;
    cost_price?: number;
    weight?: number;
    image_url?: string;
    is_active?: boolean;
  }[];
  gallery?: {
    media_type: 'image' | 'video';
    url: string;
    alt_text?: string;
    sort_order?: number;
    is_primary?: boolean;
  }[];
}

export  interface ProductQueryDto {
  search?: string;
  category_id?: number;
  brand_id?: number;
  vendor_id?: number;
  status?: 'draft' | 'active' | 'archived';
  visibility?: 'visible' | 'hidden';
  is_featured?: boolean;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export  interface BulkUpdateStatusDto {
  product_ids: number[];
  status: 'draft' | 'active' | 'archived';
}




export interface Product {
  id: number;
  uuid: string;
  vendor_id: number;
  name: string;
  slug: string;
  description?: string;
  vendor_name?: string;
  short_description?: string;
  sku?: string;
  barcode?: string;
  category_id?: number;
  brand_id?: number;
  tax_id?: number;
  base_currency_id: number;
  price: number;
  compare_price?: number;
  cost_price?: number;
  margin_percentage?: number;
  weight?: number;
  dimensions?: any;
  shipping_class?: string;
  min_order_quantity: number;
  max_order_quantity?: number;
  stock_quantity: number;
  low_stock_threshold: number;
  track_quantity: boolean;
  sold_individually: boolean;
  virtual_product: boolean;
  downloadable: boolean;
  download_limit?: number;
  download_expiry?: Date;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  search_keywords?: any;
  tags?: any;
  featured_image_url?: string;
  gallery_urls?: any;
  video_urls?: any;
  status: string;
  visibility: string;
  password_protection?: string;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  is_on_sale: boolean;
  sale_starts_at?: Date;
  sale_ends_at?: Date;
  publish_at?: Date;
  avg_rating?: number;
  total_reviews: number;
  total_sales: number;
  view_count: number;
  wishlist_count: number;
  seo_data?: any;
  product_data?: any;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductWithDetails extends Product {
  gallery?: any[];
  translations?: any[];
  prices?: any[];
  attributes?: any[];
  variants?: any[];
  variant_combinations?: any[];
  specifications?: any[];
}

export  interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
