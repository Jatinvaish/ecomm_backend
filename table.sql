CREATE TABLE currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    decimal_places SMALLINT DEFAULT 2,
    is_base_currency BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    code VARCHAR(5) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100),
    is_default BOOLEAN DEFAULT false,
    is_rtl BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE exchange_rates (
    id SERIAL PRIMARY KEY,
    from_currency_id INTEGER NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
    to_currency_id INTEGER NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
    rate DECIMAL(18, 8) NOT NULL,
    effective_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(from_currency_id, to_currency_id, effective_date)
);

CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone_prefix VARCHAR(10),
    default_currency_id INTEGER REFERENCES currencies(id),
    default_language_id INTEGER REFERENCES languages(id),
    tax_number_format VARCHAR(100),
    postal_code_format VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10),
    type VARCHAR(20) DEFAULT 'state',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    postal_codes TEXT[],
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    phone_verified_at TIMESTAMP WITH TIME ZONE,
    preferred_language_id INTEGER REFERENCES languages(id),
    preferred_currency_id INTEGER REFERENCES currencies(id),
    country_id INTEGER REFERENCES countries(id),
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(10) DEFAULT '24h',
    avatar_url VARCHAR(500),
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    is_active BOOLEAN DEFAULT true,
    is_email_notifications_enabled BOOLEAN DEFAULT true,
    is_sms_notifications_enabled BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(32),
    backup_codes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    location JSONB,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE otp_verifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    email TEXT,
    phone_number VARCHAR(20),
    otp VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email_verification', 'phone_verification', 'password_reset', 'login_2fa')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE user_role_assignments (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    assigned_by INTEGER REFERENCES users(id),
    PRIMARY KEY (user_id, role_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE translations (
    id BIGSERIAL PRIMARY KEY,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    translation_key VARCHAR(255) NOT NULL,
    translation_value TEXT NOT NULL,
    context VARCHAR(100),
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(language_id, translation_key, context)
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    image_url VARCHAR(500),
    icon VARCHAR(100),
    banner_image_url VARCHAR(500),
    meta_title VARCHAR(255),
    meta_description TEXT,
    level INTEGER DEFAULT 1,
    path TEXT,
    sort_order INTEGER DEFAULT 0,
    commission_rate DECIMAL(5, 2),
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    status SMALLINT DEFAULT 1,
    seo_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE category_translations (
    id BIGSERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(category_id, language_id)
);

CREATE TABLE taxes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    rate DECIMAL(5, 2) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('GST', 'VAT', 'SALES_TAX', 'EXCISE', 'IMPORT_DUTY', 'SERVICE_TAX')),
    description TEXT,
    country_id INTEGER REFERENCES countries(id),
    region_id INTEGER REFERENCES regions(id),
    currency_id INTEGER REFERENCES currencies(id) DEFAULT 1,
    is_flexible BOOLEAN DEFAULT false,
    threshold_less DECIMAL(12, 2) DEFAULT 0,
    threshold_greater DECIMAL(12, 2) DEFAULT 0,
    rate_less DECIMAL(5, 2) DEFAULT 0.0,
    rate_greater DECIMAL(5, 2) DEFAULT 0.0,
    is_compound BOOLEAN DEFAULT false,
    compound_order INTEGER DEFAULT 0,
    effective_from DATE,
    effective_until DATE,
    is_inclusive BOOLEAN DEFAULT false,
    applies_to JSONB DEFAULT '["products", "shipping"]',
    exemptions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    story TEXT,
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    website_url VARCHAR(500),
    social_links JSONB,
    country_id INTEGER REFERENCES countries(id),
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    seo_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE brand_translations (
    id BIGSERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    story TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(brand_id, language_id)
);

CREATE TABLE vendor_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    product_limit INTEGER,
    features JSONB,
    pricing JSONB,
    benefits JSONB,
    restrictions JSONB,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier_id INTEGER REFERENCES vendor_tiers(id) ON DELETE SET NULL,
    store_name VARCHAR(255) UNIQUE NOT NULL,
    store_slug VARCHAR(255) UNIQUE NOT NULL,
    business_name VARCHAR(255),
    business_type VARCHAR(50),
    tax_number VARCHAR(100),
    registration_number VARCHAR(100),
    description TEXT,
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    address JSONB,
    contact_info JSONB,
    business_hours JSONB,
    social_links JSONB,
    shipping_policies TEXT,
    return_policies TEXT,
    terms_conditions TEXT,
    avg_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    total_sales DECIMAL(15, 2) DEFAULT 0.00,
    commission_balance DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'inactive')),
    verification_documents JSONB,
    verification_notes TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by INTEGER REFERENCES users(id),
    last_activity_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE vendor_translations (
    id BIGSERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    store_name VARCHAR(255),
    description TEXT,
    shipping_policies TEXT,
    return_policies TEXT,
    terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(vendor_id, language_id)
);


CREATE TABLE search_sync_queue (
    id BIGSERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    action VARCHAR(10) NOT NULL CHECK (action IN ('index', 'update', 'delete')),
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    tax_id INTEGER REFERENCES taxes(id) ON DELETE SET NULL,
    base_currency_id INTEGER NOT NULL REFERENCES currencies(id) DEFAULT 3,
    price DECIMAL(12, 2) NOT NULL,
    compare_price DECIMAL(12, 2),
    cost_price DECIMAL(12, 2),
    margin_percentage DECIMAL(5, 2),
    weight DECIMAL(8, 3),
    dimensions JSONB,
    shipping_class VARCHAR(50),
    min_order_quantity INTEGER DEFAULT 1,
    max_order_quantity INTEGER,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    track_quantity BOOLEAN DEFAULT true,
    sold_individually BOOLEAN DEFAULT false,
    virtual_product BOOLEAN DEFAULT false,
    downloadable BOOLEAN DEFAULT false,
    download_limit INTEGER,
    download_expiry INTEGER,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    search_keywords TEXT[],
    tags TEXT[],
    featured_image_url VARCHAR(500),
    gallery_urls TEXT[],
    is_active BOOLEAN DEFAULT TRUE.
    video_urls TEXT[],
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived', 'out_of_stock')),
    visibility VARCHAR(20) DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden', 'password_protected')),
    password_protection VARCHAR(255),
    is_featured BOOLEAN DEFAULT false,
    is_bestseller BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    is_on_sale BOOLEAN DEFAULT false,
    sale_starts_at TIMESTAMP WITH TIME ZONE,
    sale_ends_at TIMESTAMP WITH TIME ZONE,
    publish_at TIMESTAMP WITH TIME ZONE,
    avg_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    wishlist_count INTEGER DEFAULT 0,
    search_vector tsvector,
    seo_data JSONB,
    product_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE product_translations (
    id BIGSERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500),
    description TEXT,
    short_description TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    search_keywords TEXT[],
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(product_id, language_id)
);

CREATE TABLE product_prices (
    id BIGSERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    currency_id INTEGER NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
    price DECIMAL(12, 2) NOT NULL,
    compare_price DECIMAL(12, 2),
    cost_price DECIMAL(12, 2),
    is_auto_converted BOOLEAN DEFAULT false,
    effective_from DATE,
    effective_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(product_id, currency_id)
);

CREATE TABLE product_gallery (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'document', '360_view')),
    url VARCHAR(1000) NOT NULL,
    thumbnail_url VARCHAR(1000),
    alt_text VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE attributes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'number', 'boolean', 'date', 'color', 'image', 'select', 'multiselect')),
    is_required BOOLEAN DEFAULT false,
    is_variation BOOLEAN DEFAULT false,
    is_filterable BOOLEAN DEFAULT false,
    is_comparable BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    validation_rules JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE attribute_values (
    id SERIAL PRIMARY KEY,
    attribute_id INTEGER NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    color_code VARCHAR(7),
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(attribute_id, value)
);

CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_id INTEGER  NULL REFERENCES attributes(id),
    name VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE product_variant_values (
    id SERIAL PRIMARY KEY,
    variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_value_id INTEGER  NULL REFERENCES attribute_values(id),
    value VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE product_variant_combinations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) ,
    barcode VARCHAR(100),
    base_currency_id INTEGER NOT NULL REFERENCES currencies(id) DEFAULT 3,
    price DECIMAL(12, 2),
    compare_price DECIMAL(12, 2),
    cost_price DECIMAL(12, 2),
    weight DECIMAL(8, 3),
    dimensions JSONB,
    image_url VARCHAR(500),
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE product_variant_combination_values (
    id SERIAL PRIMARY KEY,
    combination_id INTEGER NOT NULL REFERENCES product_variant_combinations(id) ON DELETE CASCADE,
    variant_value_id INTEGER NOT NULL REFERENCES product_variant_values(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(combination_id, variant_value_id)
);

CREATE TABLE product_variant_prices (
    id BIGSERIAL PRIMARY KEY,
    combination_id INTEGER NOT NULL REFERENCES product_variant_combinations(id) ON DELETE CASCADE,
    currency_id INTEGER NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
    price DECIMAL(12, 2) NOT NULL,
    compare_price DECIMAL(12, 2),
    cost_price DECIMAL(12, 2),
    is_auto_converted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(combination_id, currency_id)
);

CREATE TABLE product_specifications (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    group_name VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    unit VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);


CREATE TABLE wishlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) DEFAULT 'My Wishlist',
    is_public BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE wishlist_items (
    id BIGSERIAL PRIMARY KEY,
    wishlist_id INTEGER NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    combination_id INTEGER REFERENCES product_variant_combinations(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(wishlist_id, product_id, combination_id)
);

CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city_id INTEGER REFERENCES cities(id),
    postal_code VARCHAR(20),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    coordinates POINT,
    operating_hours JSONB,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE product_inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    combination_id INTEGER REFERENCES product_variant_combinations(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    low_stock_threshold INTEGER DEFAULT 5,
    track_inventory BOOLEAN DEFAULT true,
    last_stock_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(product_id, combination_id, warehouse_id)
);

CREATE TABLE inventory_movements (
    id BIGSERIAL PRIMARY KEY,
    inventory_id INTEGER NOT NULL REFERENCES product_inventory(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer', 'reserved', 'unreserved')),
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    notes TEXT,
    unit_cost DECIMAL(12, 2),
    total_cost DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    promo_code VARCHAR(50) UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('PERCENTAGE_ORDER', 'FIXED_ORDER', 'PERCENTAGE_PRODUCT', 'FIXED_PRODUCT', 'BOGO', 'FREE_SHIPPING', 'BUNDLE', 'TIERED')),
    value DECIMAL(10, 2) NOT NULL,
    currency_id INTEGER REFERENCES currencies(id) DEFAULT 1,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    usage_limit_per_customer INTEGER DEFAULT 1,
    current_usage_count INTEGER DEFAULT 0,
    minimum_order_amount DECIMAL(12, 2),
    maximum_discount_amount DECIMAL(12, 2),
    applicable_countries INTEGER[],
    applicable_customer_groups INTEGER[],
    stackable BOOLEAN DEFAULT false,
    auto_apply BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'scheduled')),
    conditions JSONB,
    actions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE promotion_translations (
    id BIGSERIAL PRIMARY KEY,
    promotion_id INTEGER NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(promotion_id, language_id)
);

CREATE TABLE promotion_rules (
    id SERIAL PRIMARY KEY,
    promotion_id INTEGER NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('MIN_ORDER_VALUE', 'SPECIFIC_PRODUCTS', 'SPECIFIC_CATEGORIES', 'USER_SEGMENT', 'FIRST_ORDER', 'BIRTHDAY', 'LOCATION')),
    operator VARCHAR(20) DEFAULT 'equals' CHECK (operator IN ('equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'not_in')),
    rule_value JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    promotion_id INTEGER NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    usage_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_single_use BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE customer_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    conditions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE user_customer_groups (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES customer_groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    PRIMARY KEY (user_id, group_id)
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    guest_email VARCHAR(255),
    currency_id INTEGER NOT NULL REFERENCES currencies(id),
    exchange_rate DECIMAL(18, 8) DEFAULT 1.0,
    language_id INTEGER REFERENCES languages(id),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned', 'failed')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'failed', 'refunded', 'cancelled')),
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled', 'shipped', 'delivered')),
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    shipping_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    billing_address JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    shipping_method VARCHAR(100),
    tracking_numbers TEXT[],
    notes TEXT,
    internal_notes TEXT,
    tags TEXT[],
    source VARCHAR(50) DEFAULT 'web',
    device_type VARCHAR(20),
    ip_address INET,
    user_agent TEXT,
    utm_data JSONB,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refunded_amount DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    notes TEXT,
    notified_customer BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE promotion_usage (
    id SERIAL PRIMARY KEY,
    promotion_id INTEGER NOT NULL REFERENCES promotions(id) ON DELETE RESTRICT,
    coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    discount_amount DECIMAL(12, 2) NOT NULL,
    currency_id INTEGER NOT NULL REFERENCES currencies(id),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'shipping' CHECK (type IN ('shipping', 'billing', 'both')),
    company VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city_id INTEGER REFERENCES cities(id),
    city_name VARCHAR(100) NOT NULL,
    region_id INTEGER REFERENCES regions(id),
    region_name VARCHAR(100),
    country_id INTEGER NOT NULL REFERENCES countries(id),
    postal_code VARCHAR(20) NOT NULL,
    phone_number VARCHAR(20),
    instructions TEXT,
    landmark VARCHAR(255),
    coordinates POINT,
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    nickname VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE shipping_zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    countries INTEGER[] NOT NULL,
    regions INTEGER[],
    cities INTEGER[],
    postal_codes TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE shipping_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    carrier VARCHAR(100),
    service_code VARCHAR(50),
    zone_id INTEGER NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
    calculation_type VARCHAR(20) DEFAULT 'fixed' CHECK (calculation_type IN ('fixed', 'weight_based', 'price_based', 'free')),
    base_cost DECIMAL(10, 2) DEFAULT 0,
    per_kg_cost DECIMAL(10, 2) DEFAULT 0,
    per_item_cost DECIMAL(10, 2) DEFAULT 0,
    percentage_cost DECIMAL(5, 2) DEFAULT 0,
    currency_id INTEGER NOT NULL REFERENCES currencies(id),
    min_weight DECIMAL(8, 3),
    max_weight DECIMAL(8, 3),
    min_order_amount DECIMAL(12, 2),
    max_order_amount DECIMAL(12, 2),
    estimated_days_min INTEGER,
    estimated_days_max INTEGER,
    tracking_available BOOLEAN DEFAULT false,
    insurance_available BOOLEAN DEFAULT false,
    requires_signature BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE shipping_method_translations (
    id BIGSERIAL PRIMARY KEY,
    method_id INTEGER NOT NULL REFERENCES shipping_methods(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(method_id, language_id)
);

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    subject VARCHAR(255),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    last_message_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(user_id, vendor_id, product_id, order_id)
);

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    attachments JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('ORDER_UPDATE', 'NEW_MESSAGE', 'PROMOTION', 'SYSTEM_ALERT', 'PAYMENT', 'SHIPPING', 'REVIEW', 'WISHLIST')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    link VARCHAR(500),
    action_data JSONB,
    channels TEXT[] DEFAULT '{web}',
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE notification_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'web')),
    subject VARCHAR(255),
    template_content TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE shipping_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    api_endpoint VARCHAR(500),
    api_key VARCHAR(255),
    tracking_url_template VARCHAR(500),
    supported_countries INTEGER[],
    webhook_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE vendor_orders (
    id SERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    vendor_order_number VARCHAR(50),
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    shipping_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    commission_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    notes TEXT,
    tracking_number VARCHAR(100),
    shipping_provider_id INTEGER REFERENCES shipping_providers(id),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    vendor_order_id INTEGER REFERENCES vendor_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    combination_id INTEGER REFERENCES product_variant_combinations(id) ON DELETE SET NULL,
    product_name VARCHAR(500) NOT NULL,
    product_sku VARCHAR(100),
    variant_details JSONB,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    weight DECIMAL(8, 3),
    dimensions JSONB,
    product_snapshot JSONB,
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'fulfilled', 'shipped', 'delivered', 'returned', 'cancelled')),
    return_status VARCHAR(50) CHECK (return_status IN ('none', 'requested', 'approved', 'rejected', 'received', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);
CREATE TABLE product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_item_id BIGINT REFERENCES order_items(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    pros TEXT,
    cons TEXT,
    images TEXT[],
    videos TEXT[],
    helpful_votes INTEGER DEFAULT 0,
    verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    moderation_notes TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    reply_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(product_id, user_id, order_item_id)
);

CREATE TABLE review_votes (
    id BIGSERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(review_id, user_id)
);

CREATE TABLE shopping_carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    currency_id INTEGER NOT NULL REFERENCES currencies(id),
    language_id INTEGER REFERENCES languages(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    combination_id INTEGER REFERENCES product_variant_combinations(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2),
    total_price DECIMAL(12, 2),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(cart_id, product_id, combination_id)
);

CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('card', 'bank_transfer', 'digital_wallet', 'cash', 'crypto')),
    provider VARCHAR(100),
    supported_countries INTEGER[],
    supported_currencies INTEGER[],
    configuration JSONB,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE payment_transactions (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id),
    provider_transaction_id VARCHAR(255),
    provider_payment_id VARCHAR(255) UNIQUE,
    transaction_type VARCHAR(20) DEFAULT 'payment' CHECK (transaction_type IN ('payment', 'refund', 'partial_refund', 'chargeback')),
    amount DECIMAL(12, 2) NOT NULL,
    currency_id INTEGER NOT NULL REFERENCES currencies(id),
    exchange_rate DECIMAL(18, 8) DEFAULT 1.0,
    base_amount DECIMAL(12, 2),
    gateway_fee DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(12, 2),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired', 'refunded')),
    gateway_response JSONB,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    webhook_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE refunds (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    payment_transaction_id BIGINT NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
    order_item_id BIGINT REFERENCES order_items(id) ON DELETE RESTRICT,
    refund_type VARCHAR(20) DEFAULT 'full' CHECK (refund_type IN ('full', 'partial', 'shipping', 'tax')),
    provider_refund_id VARCHAR(255) UNIQUE,
    amount DECIMAL(12, 2) NOT NULL,
    currency_id INTEGER NOT NULL REFERENCES currencies(id),
    reason TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    gateway_response JSONB,
    failure_reason TEXT,
    requested_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE returns (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    return_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason VARCHAR(100) NOT NULL,
    detailed_reason TEXT,
    return_type VARCHAR(20) DEFAULT 'refund' CHECK (return_type IN ('refund', 'exchange', 'store_credit')),
    status VARCHAR(50) DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'received', 'processed', 'completed')),
    total_amount DECIMAL(12, 2),
    refund_amount DECIMAL(12, 2),
    restocking_fee DECIMAL(10, 2) DEFAULT 0,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    images TEXT[],
    tracking_number VARCHAR(100),
    notes TEXT,
    admin_notes TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by INTEGER REFERENCES users(id),
    received_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE return_items (
    id BIGSERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('new', 'good', 'damaged', 'defective')),
    reason VARCHAR(100),
    refund_amount DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE webhook_events (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    headers JSONB,
    status VARCHAR(50) DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored')),
    processing_attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    response_data JSONB,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE vendor_bank_details (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER UNIQUE NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    account_type VARCHAR(20) DEFAULT 'savings' CHECK (account_type IN ('savings', 'current', 'business')),
    bank_name VARCHAR(255) NOT NULL,
    bank_code VARCHAR(20),
    branch_name VARCHAR(255),
    branch_code VARCHAR(20),
    account_holder_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    routing_number VARCHAR(20),
    swift_code VARCHAR(20),
    iban VARCHAR(50),
    ifsc_code VARCHAR(20),
    tax_id VARCHAR(50),
    is_verified BOOLEAN DEFAULT false,
    verification_documents JSONB,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE payouts (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    payout_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    currency_id INTEGER NOT NULL REFERENCES currencies(id),
    amount DECIMAL(12, 2) NOT NULL,
    fee_amount DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(12, 2) NOT NULL,
    exchange_rate DECIMAL(18, 8) DEFAULT 1.0,
    method VARCHAR(20) DEFAULT 'bank_transfer' CHECK (method IN ('bank_transfer', 'paypal', 'stripe', 'manual')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    provider_payout_id VARCHAR(255),
    gateway_response JSONB,
    failure_reason TEXT,
    notes TEXT,
    scheduled_for DATE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE commissions (
    id SERIAL PRIMARY KEY,
    order_item_id BIGINT UNIQUE NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    payout_id INTEGER REFERENCES payouts(id) ON DELETE SET NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    base_amount DECIMAL(12, 2) NOT NULL,
    commission_amount DECIMAL(12, 2) NOT NULL,
    currency_id INTEGER NOT NULL REFERENCES currencies(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'due', 'paid', 'held', 'cancelled')),
    hold_until DATE,
    hold_reason TEXT,
    notes TEXT,
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    event_properties JSONB,
    user_properties JSONB,
    device_info JSONB,
    location_info JSONB,
    referrer VARCHAR(500),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    page_url VARCHAR(1000),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT')),
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    record_uuid UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    session_id VARCHAR(255),
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_html TEXT NOT NULL,
    template_text TEXT,
    variables JSONB,
    category VARCHAR(50),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE email_template_translations (
    id BIGSERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    template_html TEXT NOT NULL,
    template_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(template_id, language_id)
);

CREATE TABLE email_queue (
    id BIGSERIAL PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    from_email VARCHAR(255),
    reply_to VARCHAR(255),
    cc_emails TEXT[],
    bcc_emails TEXT[],
    subject VARCHAR(255) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    template_id INTEGER REFERENCES email_templates(id),
    template_data JSONB,
    priority INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    attempts INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    provider_message_id VARCHAR(255),
    tracking_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(255) NOT NULL,
    setting_value JSONB,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_encrypted BOOLEAN DEFAULT false,
    validation_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(category, setting_key)
);

CREATE TABLE cms_pages (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    excerpt TEXT,
    featured_image VARCHAR(500),
    template VARCHAR(100),
    layout VARCHAR(100),
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    author_id INTEGER REFERENCES users(id),
    parent_id INTEGER REFERENCES cms_pages(id) ON DELETE CASCADE,
    menu_order INTEGER DEFAULT 0,
    password_protection VARCHAR(255),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'password', 'draft')),
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    publish_at TIMESTAMP WITH TIME ZONE,
    seo_data JSONB,
    custom_fields JSONB,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE cms_page_translations (
    id BIGSERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(255),
    content TEXT,
    excerpt TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(page_id, language_id)
);

CREATE TABLE menus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL, 
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
);

CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    target VARCHAR(10) DEFAULT '_self',
    icon VARCHAR(100),  
    css_class VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    badge_count INTEGER DEFAULT 0,  
    badge_color VARCHAR(20) DEFAULT 'secondary',  
    is_active BOOLEAN DEFAULT true,
    permissions VARCHAR(500), 
    description TEXT,  
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
);
CREATE TABLE menu_item_translations (
    id BIGSERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(menu_item_id, language_id)
);

CREATE TABLE product_collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    type VARCHAR(20) DEFAULT 'manual' CHECK (type IN ('manual', 'smart', 'seasonal')),
    conditions JSONB,
    sort_method VARCHAR(20) DEFAULT 'manual' CHECK (sort_method IN ('manual', 'best_selling', 'price_asc', 'price_desc', 'newest', 'oldest')),
    max_products INTEGER,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE collection_products (
    id BIGSERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES product_collections(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(collection_id, product_id)
);

CREATE TABLE product_cross_sells (
    id BIGSERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    cross_sell_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'related' CHECK (type IN ('related', 'upsell', 'cross_sell', 'frequently_bought')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(product_id, cross_sell_product_id)
);

CREATE TABLE tax_rates_by_location (
    id SERIAL PRIMARY KEY,
    tax_id INTEGER NOT NULL REFERENCES taxes(id) ON DELETE CASCADE,
    country_id INTEGER REFERENCES countries(id),
    region_id INTEGER REFERENCES regions(id),
    city_id INTEGER REFERENCES cities(id),
    postal_codes TEXT[],
    rate DECIMAL(5, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE loyalty_programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'points' CHECK (type IN ('points', 'cashback', 'tiered')),
    earn_rate DECIMAL(8, 4) NOT NULL,
    redeem_rate DECIMAL(8, 4) NOT NULL,
    min_redeem_points INTEGER DEFAULT 100,
    max_redeem_points INTEGER,
    point_expiry_days INTEGER DEFAULT 365,
    welcome_bonus INTEGER DEFAULT 0,
    referral_bonus INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE user_loyalty_points (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id INTEGER NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
    points INTEGER NOT NULL,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE user_loyalty_balances (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id INTEGER NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    pending_points INTEGER DEFAULT 0,
    redeemed_points INTEGER DEFAULT 0,
    expired_points INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    PRIMARY KEY (user_id, program_id)
);

CREATE TABLE gift_cards (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    initial_amount DECIMAL(12, 2) NOT NULL,
    current_balance DECIMAL(12, 2) NOT NULL,
    currency_id INTEGER NOT NULL REFERENCES currencies(id),
    issued_to_user_id INTEGER REFERENCES users(id),
    issued_to_email VARCHAR(255),
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE gift_card_transactions (
    id BIGSERIAL PRIMARY KEY,
    gift_card_id INTEGER NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('issued', 'redeemed', 'refunded', 'expired')),
    amount DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    combination_id INTEGER REFERENCES product_variant_combinations(id) ON DELETE SET NULL,
    subscription_plan_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired', 'pending')),
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    billing_amount DECIMAL(12, 2) NOT NULL,
    currency_id INTEGER NOT NULL REFERENCES currencies(id),
    quantity INTEGER DEFAULT 1,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    next_billing_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    billing_address JSONB,
    shipping_address JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE subscription_orders (
    id BIGSERIAL PRIMARY KEY,
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE product_bundles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    bundle_type VARCHAR(20) DEFAULT 'fixed' CHECK (bundle_type IN ('fixed', 'dynamic', 'mix_match')),
    discount_type VARCHAR(20) DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed', 'none')),
    discount_value DECIMAL(10, 2) DEFAULT 0,
    min_items INTEGER DEFAULT 2,
    max_items INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE bundle_products (
    id BIGSERIAL PRIMARY KEY,
    bundle_id INTEGER NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    is_required BOOLEAN DEFAULT true,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(bundle_id, product_id)
);

CREATE TABLE product_questions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    answered_by INTEGER REFERENCES users(id),
    answered_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE abandoned_carts (
    id BIGSERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    total_value DECIMAL(12, 2),
    currency_id INTEGER REFERENCES currencies(id),
    recovery_token VARCHAR(255) UNIQUE,
    recovered_at TIMESTAMP WITH TIME ZONE,
    recovery_order_id BIGINT REFERENCES orders(id),
    email_sent_count INTEGER DEFAULT 0,
    last_email_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE product_views (
    id BIGSERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE search_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    filters_applied JSONB,
    sort_applied VARCHAR(50),
    clicked_product_ids INTEGER[],
    no_results BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE integrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    configuration JSONB NOT NULL,
    credentials JSONB,
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255),
    sync_frequency VARCHAR(20) DEFAULT 'manual' CHECK (sync_frequency IN ('manual', 'hourly', 'daily', 'weekly')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    next_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'idle' CHECK (sync_status IN ('idle', 'running', 'completed', 'failed')),
    error_log TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    prefix VARCHAR(20) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    permissions JSONB NOT NULL DEFAULT '[]',
    rate_limit INTEGER DEFAULT 1000,
    allowed_ips INET[],
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count BIGINT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE api_request_logs (
    id BIGSERIAL PRIMARY KEY,
    api_key_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    request_headers JSONB,
    request_body JSONB,
    response_status INTEGER NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, record_uuid, new_values)
        VALUES (
            COALESCE(current_setting('app.current_user_id', 't')::INTEGER, NEW.created_by),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id::TEXT,
            CASE WHEN TG_TABLE_SCHEMA = 'public' AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = TG_TABLE_NAME AND column_name = 'uuid') THEN NEW.uuid ELSE NULL END,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, record_uuid, old_values, new_values)
        VALUES (
            COALESCE(current_setting('app.current_user_id', 't')::INTEGER, NEW.updated_by),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id::TEXT,
            CASE WHEN TG_TABLE_SCHEMA = 'public' AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = TG_TABLE_NAME AND column_name = 'uuid') THEN NEW.uuid ELSE NULL END,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, record_uuid, old_values)
        VALUES (
            current_setting('app.current_user_id', 't')::INTEGER,
            TG_OP,
            TG_TABLE_NAME,
            OLD.id::TEXT,
            CASE WHEN TG_TABLE_SCHEMA = 'public' AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = TG_TABLE_NAME AND column_name = 'uuid') THEN OLD.uuid ELSE NULL END,
            to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.short_description, '') || ' ' ||
        COALESCE(NEW.sku, '') || ' ' ||
        COALESCE(array_to_string(NEW.search_keywords, ' '), '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_category_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path := NEW.id::TEXT;
        NEW.level := 1;
    ELSE
        SELECT path, level INTO parent_path, NEW.level
        FROM categories WHERE id = NEW.parent_id;
        NEW.path := parent_path || '.' || NEW.id::TEXT;
        NEW.level := NEW.level + 1;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION calculate_commission_amount()
RETURNS TRIGGER AS $$
DECLARE
    vendor_commission_rate DECIMAL(5,2);
BEGIN
    SELECT vt.commission_rate INTO vendor_commission_rate
    FROM vendors v
    JOIN vendor_tiers vt ON v.tier_id = vt.id
    WHERE v.id = NEW.vendor_id;

    NEW.commission_rate := COALESCE(vendor_commission_rate, 0);
    NEW.commission_amount := NEW.base_amount * (NEW.commission_rate / 100);

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_inventory_quantities()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE product_inventory
        SET quantity = quantity + NEW.quantity
        WHERE id = NEW.inventory_id AND NEW.movement_type = 'in';

        UPDATE product_inventory
        SET quantity = quantity - NEW.quantity
        WHERE id = NEW.inventory_id AND NEW.movement_type = 'out';

        UPDATE product_inventory
        SET reserved_quantity = reserved_quantity + NEW.quantity
        WHERE id = NEW.inventory_id AND NEW.movement_type = 'reserved';

        UPDATE product_inventory
        SET reserved_quantity = reserved_quantity - NEW.quantity
        WHERE id = NEW.inventory_id AND NEW.movement_type = 'unreserved';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';


CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER products_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION log_changes();
CREATE TRIGGER users_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION log_changes();
CREATE TRIGGER orders_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON orders FOR EACH ROW EXECUTE FUNCTION log_changes();
CREATE TRIGGER vendors_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON vendors FOR EACH ROW EXECUTE FUNCTION log_changes();


CREATE TRIGGER product_search_vector_trigger BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();
CREATE TRIGGER category_path_trigger BEFORE INSERT OR UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_category_path();
CREATE TRIGGER commission_calculation_trigger BEFORE INSERT OR UPDATE ON commissions FOR EACH ROW EXECUTE FUNCTION calculate_commission_amount();
CREATE TRIGGER inventory_movement_trigger AFTER INSERT ON inventory_movements FOR EACH ROW EXECUTE FUNCTION update_inventory_quantities();


CREATE INDEX idx_products_search_vector ON products USING gin(search_vector);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_currency ON products(base_currency_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_updated_at ON products(updated_at);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_path ON categories USING gin(string_to_array(path, '.'));
CREATE INDEX idx_categories_level ON categories(level);

CREATE INDEX idx_product_gallery_product_id ON product_gallery(product_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variant_values_variant_id ON product_variant_values(variant_id);
CREATE INDEX idx_product_variant_combinations_product_id ON product_variant_combinations(product_id);
CREATE INDEX idx_product_specifications_product_id ON product_specifications(product_id);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_currency ON orders(currency_id);
CREATE INDEX idx_orders_total_amount ON orders(total_amount);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_vendor_order_id ON order_items(vendor_order_id);

CREATE INDEX idx_vendor_orders_order_id ON vendor_orders(order_id);


-- CREATE TABLE product_attributes (
--     id BIGSERIAL PRIMARY KEY,
--     product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
--     attribute_id INTEGER NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
--     attribute_value_id INTEGER REFERENCES attribute_values(id) ON DELETE CASCADE,
--     custom_value TEXT,
--     is_variation BOOLEAN DEFAULT false,
--     sort_order INTEGER DEFAULT 0,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--     created_by INTEGER,
--     updated_by INTEGER,
--     UNIQUE(product_id, attribute_id)
-- );

INSERT INTO currencies (code, name, symbol, decimal_places, is_base_currency, is_active) VALUES
('USD', 'US Dollar', '$', 2, true, true),
('EUR', 'Euro', '€', 2, false, true),
('INR', 'Indian Rupee', '₹', 2, false, true);

INSERT INTO languages (code, name, native_name, is_default, is_active) VALUES
('en', 'English', 'English', true, true),
('es', 'Spanish', 'Español', false, true);

INSERT INTO countries (code, name, phone_prefix, default_currency_id, default_language_id, is_active) VALUES
('US', 'United States', '+1', 1, 1, true),
('IN', 'India', '+91', 3, 1, true),
('ES', 'Spain', '+34', 2, 2, true);

INSERT INTO regions (country_id, name, code, type, is_active) VALUES
(1, 'California', 'CA', 'state', true),
(1, 'New York', 'NY', 'state', true),
(2, 'Gujarat', 'GJ', 'state', true),
(2, 'Maharashtra', 'MH', 'state', true);

INSERT INTO cities (region_id, name, postal_codes, timezone, is_active) VALUES
(1, 'Los Angeles', ARRAY['90001', '90002', '90210'], 'America/Los_Angeles', true),
(2, 'New York City', ARRAY['10001', '10002', '10003'], 'America/New_York', true),
(3, 'Ahmedabad', ARRAY['380001', '380002'], 'Asia/Kolkata', true),
(4, 'Mumbai', ARRAY['400001', '400002'], 'Asia/Kolkata', true);

INSERT INTO exchange_rates (from_currency_id, to_currency_id, rate, effective_date) VALUES
(1, 2, 0.85, CURRENT_DATE),
(1, 3, 83.50, CURRENT_DATE),
(2, 1, 1.18, CURRENT_DATE),
(2, 3, 98.24, CURRENT_DATE),
(3, 1, 0.012, CURRENT_DATE),
(3, 2, 0.010, CURRENT_DATE);
 
INSERT INTO roles (name, slug, description, permissions, is_system_role, is_active) VALUES
('Super Admin', 'super-admin', 'Full system access', '{"all": true}', true, true),
('Vendor', 'vendor', 'Vendor access', '{"products": ["create", "read", "update"], "orders": ["read", "update"]}', true, true),
('Customer', 'customer', 'Customer access', '{"profile": ["read", "update"], "orders": ["read"]}', true, true);

INSERT INTO users (full_name, email, password_hash, phone_number, preferred_language_id, preferred_currency_id, country_id, is_active) VALUES
('Admin User', 'admin@store.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZMJqhN8/LeZMJqh', '+1234567890', 1, 1, 1, true),
('John Doe', 'john@customer.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZMJqhN8/LeZMJqh', '+1987654321', 1, 1, 1, true),
('Jane Smith', 'jane@vendor.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZMJqhN8/LeZMJqh', '+1555666777', 1, 1, 1, true),
('Raj Patel', 'raj@vendor.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZMJqhN8/LeZMJqh', '+919876543210', 1, 3, 2, true);

INSERT INTO user_role_assignments (user_id, role_id, assigned_by) VALUES
(1, 1, 1),
(2, 3, 1),
(3, 2, 1),
(4, 2, 1);

INSERT INTO vendor_tiers (name, slug, commission_rate, product_limit, is_active) VALUES
('Basic', 'basic', 15.00, 100, true),
('Premium', 'premium', 10.00, 500, true),
('Enterprise', 'enterprise', 5.00, null, true);

INSERT INTO vendors (user_id, tier_id, store_name, store_slug, business_name, description, status, is_featured) VALUES
(3, 1, 'Jane Electronics Store', 'jane-electronics', 'Jane Electronics LLC', 'Quality electronics and gadgets', 'approved', false),
(4, 2, 'Raj Fashion Hub', 'raj-fashion', 'Raj Fashion Pvt Ltd', 'Latest fashion and clothing', 'approved', true);

INSERT INTO categories (name, slug, description, is_featured, is_active) VALUES
('Electronics', 'electronics', 'Electronic devices and accessories', true, true),
('Fashion', 'fashion', 'Clothing and fashion accessories', true, true),
('Smartphones', 'smartphones', 'Mobile phones and smartphones', false, true),
('Laptops', 'laptops', 'Portable computers', false, true),
('Mens Clothing', 'mens-clothing', 'Clothing for men', false, true);

UPDATE categories SET parent_id = 1 WHERE slug IN ('smartphones', 'laptops');
UPDATE categories SET parent_id = 2 WHERE slug = 'mens-clothing';

INSERT INTO brands (name, slug, description, is_featured, is_active) VALUES
('Apple', 'apple', 'Premium technology brand', true, true),
('Samsung', 'samsung', 'Global electronics company', true, true),
('Nike', 'nike', 'Sports and lifestyle brand', true, true),
('Dell', 'dell', 'Computer technology company', false, true);

INSERT INTO taxes (name, code, rate, type, country_id, is_active) VALUES
('US Sales Tax', 'US_SALES', 8.50, 'SALES_TAX', 1, true),
('Indian GST', 'IN_GST', 18.00, 'GST', 2, true);

INSERT INTO attributes (name, slug, type, is_variation, is_filterable, is_comparable, sort_order) VALUES
('Color', 'color', 'color', true, true, true, 1),
('Size', 'size', 'select', true, true, true, 2),
('Storage', 'storage', 'select', true, true, true, 3),
('Material', 'material', 'select', false, true, true, 4),
('Brand', 'brand', 'select', false, true, true, 5),
('Weight', 'weight', 'number', false, true, true, 6);

INSERT INTO attribute_values (attribute_id, value, color_code, sort_order) VALUES
(1, 'Black', '#000000', 1),
(1, 'White', '#FFFFFF', 2),
(1, 'Blue', '#0066CC', 3),
(1, 'Red', '#FF0000', 4),
(1, 'Silver', '#C0C0C0', 5),
(2, 'XS', null, 1),
(2, 'S', null, 2),
(2, 'M', null, 3),
(2, 'L', null, 4),
(2, 'XL', null, 5),
(2, 'XXL', null, 6),
(2, '7', null, 7),
(2, '8', null, 8),
(2, '9', null, 9),
(2, '10', null, 10),
(2, '11', null, 11),
(3, '64GB', null, 1),
(3, '128GB', null, 2),
(3, '256GB', null, 3),
(3, '512GB', null, 4),
(3, '1TB', null, 5),
(4, 'Cotton', null, 1),
(4, 'Polyester', null, 2),
(4, 'Leather', null, 3),
(4, 'Aluminum', null, 4),
(4, 'Plastic', null, 5);






INSERT INTO products (vendor_id, name, slug, description, short_description, sku, category_id, brand_id, tax_id, price, compare_price, cost_price, weight, dimensions, stock_quantity, low_stock_threshold, status, visibility, is_featured, is_bestseller, is_new_arrival, is_on_sale, sale_starts_at, sale_ends_at, meta_title, meta_description, search_keywords, tags, featured_image_url, gallery_urls, video_urls, is_active) VALUES
(1, 'iPhone 15 Pro', 'iphone-15-pro',
'<p>The iPhone 15 Pro features a titanium design with Action Button and USB-C. Available in multiple storage options and colors.</p><ul><li>A17 Pro chip</li><li>Pro camera system</li><li>Action Button</li><li>USB-C connectivity</li></ul>',
'Latest iPhone with titanium design and A17 Pro chip',
'APPLE-IP15P', 3, 1, 1, 999.00, 1099.00, 750.00, 0.187,
'{"length": 159.9, "width": 76.7, "height": 8.25}', 0, 5,
'active', 'visible', true, true, true, true,
CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days',
'iPhone 15 Pro - Latest Apple Smartphone', 'Buy iPhone 15 Pro with titanium design, A17 Pro chip, and advanced camera system',
ARRAY['iphone', 'apple', 'smartphone', 'a17 pro', 'titanium'],
ARRAY['smartphone', 'premium', 'apple', 'new'],
'https://example.com/images/iphone-15-pro-main.jpg',
ARRAY['https://example.com/images/iphone-15-pro-1.jpg', 'https://example.com/images/iphone-15-pro-2.jpg'],
ARRAY['https://example.com/videos/iphone-15-pro-demo.mp4'],
true),
(2, 'Nike Dri-FIT T-Shirt', 'nike-dri-fit-tshirt',
'<p>Stay cool and comfortable with Nike Dri-FIT technology. Perfect for workouts and everyday wear.</p><ul><li>Dri-FIT moisture-wicking technology</li><li>100% polyester</li><li>Regular fit</li><li>Machine washable</li></ul>',
'Moisture-wicking t-shirt for active lifestyle',
'NIKE-DFIT-TEE', 5, 3, 1, 35.00, 45.00, 18.00, 0.150,
'{"chest": 50, "length": 72, "sleeve": 20}', 0, 10,
'active', 'visible', false, false, false, true,
CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '15 days',
'Nike Dri-FIT T-Shirt - Athletic Wear', 'Comfortable Nike Dri-FIT t-shirt with moisture-wicking technology',
ARRAY['nike', 'tshirt', 'dri-fit', 'athletic', 'polyester'],
ARRAY['sportswear', 'sale', 'summer'],
'https://example.com/images/nike-tshirt-main.jpg',
ARRAY['https://example.com/images/nike-tshirt-1.jpg', 'https://example.com/images/nike-tshirt-2.jpg', 'https://example.com/images/nike-tshirt-3.jpg'],
ARRAY[]::TEXT[],
true),
(2, 'Samsung Galaxy S24', 'samsung-galaxy-s24',
'<p>Experience the latest in mobile innovation with Galaxy S24. Powered by advanced AI and exceptional camera capabilities.</p><ul><li>50MP main camera</li><li>Snapdragon 8 Gen 3</li><li>120Hz AMOLED display</li><li>5000mAh battery</li></ul>',
'Latest Samsung flagship with AI-powered features',
'SAM-GS24-256', 3, 2, 2, 849.00, 999.00, 600.00, 0.168,
'{"length": 147.0, "width": 70.6, "height": 7.6}', 30, 5,
'active', 'visible', true, false, false, false, null, null,
'Samsung Galaxy S24 - AI Smartphone', 'Samsung Galaxy S24 with AI features, 50MP camera, and 120Hz display',
ARRAY['samsung', 'galaxy', 'android', 'ai', 'camera'],
ARRAY['smartphone', 'android', 'premium'],
'https://example.com/images/galaxy-s24-main.jpg',
ARRAY['https://example.com/images/galaxy-s24-1.jpg', 'https://example.com/images/galaxy-s24-2.jpg'],
ARRAY['https://example.com/videos/galaxy-s24-review.mp4'],
true),
(1, 'MacBook Air M2', 'macbook-air-m2',
'<p>Supercharged by M2 chip. The redesigned MacBook Air is more portable than ever and weighs just 2.7 pounds.</p><ul><li>M2 chip with 8-core CPU</li><li>Up to 18 hours battery life</li><li>13.6-inch Liquid Retina display</li><li>1080p FaceTime HD camera</li></ul>',
'Ultra-thin laptop powered by M2 chip',
'APPLE-MBA-M2', 4, 1, 1, 1199.00, 1299.00, 850.00, 1.24,
'{"length": 304.1, "width": 215.0, "height": 11.3}', 0, 3,
'active', 'visible', true, true, false, false, null, null,
'MacBook Air M2 - Ultra-thin Laptop', 'Apple MacBook Air with M2 chip, 13.6-inch display, and all-day battery life',
ARRAY['macbook', 'apple', 'laptop', 'm2', 'portable'],
ARRAY['laptop', 'premium', 'apple', 'portable'],
'https://example.com/images/macbook-air-main.jpg',
ARRAY['https://example.com/images/macbook-air-1.jpg', 'https://example.com/images/macbook-air-2.jpg', 'https://example.com/images/macbook-air-3.jpg'],
ARRAY[]::TEXT[],
true),
(2, 'Nike Air Max 270', 'nike-air-max-270',
'<p>The Air Max 270 delivers visible Max Air cushioning and all-day comfort. Features breathable mesh and synthetic materials.</p><ul><li>Max Air unit in heel</li><li>Breathable mesh upper</li><li>Synthetic overlays</li><li>Rubber outsole</li></ul>',
'Comfortable running shoes with Max Air cushioning',
'NIKE-AM270', 5, 3, 1, 150.00, 180.00, 85.00, 0.350,
'{"length": 315, "width": 115, "height": 110}', 0, 20,
'active', 'visible', false, true, false, false, null, null,
'Nike Air Max 270 - Running Shoes', 'Nike Air Max 270 running shoes with Max Air cushioning and breathable design',
ARRAY['nike', 'air max', 'running shoes', 'cushioning'],
ARRAY['shoes', 'running', 'comfort'],
'https://example.com/images/air-max-270-main.jpg',
ARRAY['https://example.com/images/air-max-270-1.jpg', 'https://example.com/images/air-max-270-2.jpg'],
ARRAY[]::TEXT[],
true);

INSERT INTO product_attributes (product_id, attribute_id, attribute_value_id, is_variation) VALUES
(1, 1, NULL, true),
(1, 3, NULL, true),
(1, 4, 4, false),
(1, 6, NULL, false),
(2, 1, NULL, true),
(2, 2, NULL, true),
(2, 4, 2, false),
(3, 1, 1, false),
(3, 3, 3, false),
(3, 4, 4, false),
(4, 3, NULL, true),
(4, 1, 2, false),
(4, 4, 4, false),
(5, 2, NULL, true),
(5, 1, 1, false),
(5, 4, 3, false);

UPDATE product_attributes SET custom_value = '187g' WHERE product_id = 1 AND attribute_id = 6;

INSERT INTO product_variants (product_id, name, sort_order) VALUES
(1, 'Color', 1),
(1, 'Storage', 2),
(2, 'Color', 1),
(2, 'Size', 2),
(4, 'Storage', 1),
(5, 'Size', 1);

INSERT INTO product_variant_values (variant_id, value, sort_order) VALUES
(1, 'Natural Titanium', 1),
(1, 'Blue Titanium', 2),
(1, 'White Titanium', 3),
(1, 'Black Titanium', 4),
(2, '128GB', 1),
(2, '256GB', 2),
(2, '512GB', 3),
(2, '1TB', 4),
(3, 'Black', 1),
(3, 'White', 2),
(3, 'Blue', 3),
(3, 'Red', 4),
(4, 'S', 1),
(4, 'M', 2),
(4, 'L', 3),
(4, 'XL', 4),
(4, 'XXL', 5),
(5, '256GB', 1),
(5, '512GB', 2),
(5, '1TB', 3),
(6, '7', 1),
(6, '8', 2),
(6, '9', 3),
(6, '10', 4),
(6, '11', 5);

INSERT INTO product_variant_combinations (product_id, sku, price, compare_price, cost_price, weight, stock_quantity, low_stock_threshold) VALUES
(1, 'APPLE-IP15P-128-NAT', 999.00, 1099.00, 750.00, 0.187, 15, 3),
(1, 'APPLE-IP15P-256-NAT', 1099.00, 1199.00, 825.00, 0.187, 12, 3),
(1, 'APPLE-IP15P-512-NAT', 1299.00, 1399.00, 975.00, 0.187, 8, 2),
(1, 'APPLE-IP15P-1TB-NAT', 1499.00, 1599.00, 1125.00, 0.187, 5, 2),
(1, 'APPLE-IP15P-128-BLU', 999.00, 1099.00, 750.00, 0.187, 12, 3),
(1, 'APPLE-IP15P-256-BLU', 1099.00, 1199.00, 825.00, 0.187, 10, 3),
(1, 'APPLE-IP15P-512-BLU', 1299.00, 1399.00, 975.00, 0.187, 6, 2),
(1, 'APPLE-IP15P-128-WHT', 999.00, 1099.00, 750.00, 0.187, 8, 2),
(1, 'APPLE-IP15P-256-WHT', 1099.00, 1199.00, 825.00, 0.187, 7, 2),
(1, 'APPLE-IP15P-128-BLK', 999.00, 1099.00, 750.00, 0.187, 10, 3),
(2, 'NIKE-DFIT-BLK-S', 35.00, 45.00, 18.00, 0.150, 25, 5),
(2, 'NIKE-DFIT-BLK-M', 35.00, 45.00, 18.00, 0.155, 30, 5),
(2, 'NIKE-DFIT-BLK-L', 35.00, 45.00, 18.00, 0.160, 35, 5),
(2, 'NIKE-DFIT-BLK-XL', 35.00, 45.00, 18.00, 0.165, 20, 5),
(2, 'NIKE-DFIT-WHT-S', 35.00, 45.00, 18.00, 0.150, 20, 5),
(2, 'NIKE-DFIT-WHT-M', 35.00, 45.00, 18.00, 0.155, 25, 5),
(2, 'NIKE-DFIT-WHT-L', 35.00, 45.00, 18.00, 0.160, 28, 5),
(2, 'NIKE-DFIT-BLU-M', 35.00, 45.00, 18.00, 0.155, 15, 5),
(2, 'NIKE-DFIT-BLU-L', 35.00, 45.00, 18.00, 0.160, 18, 5),
(2, 'NIKE-DFIT-RED-M', 35.00, 45.00, 18.00, 0.155, 12, 5),
(4, 'APPLE-MBA-M2-256', 1199.00, 1299.00, 850.00, 1.240, 15, 3),
(4, 'APPLE-MBA-M2-512', 1399.00, 1499.00, 1000.00, 1.240, 10, 2),
(4, 'APPLE-MBA-M2-1TB', 1799.00, 1899.00, 1300.00, 1.240, 5, 1),
(5, 'NIKE-AM270-BLK-7', 150.00, 180.00, 85.00, 0.340, 15, 3),
(5, 'NIKE-AM270-BLK-8', 150.00, 180.00, 85.00, 0.345, 20, 5),
(5, 'NIKE-AM270-BLK-9', 150.00, 180.00, 85.00, 0.350, 25, 5),
(5, 'NIKE-AM270-BLK-10', 150.00, 180.00, 85.00, 0.355, 22, 5),
(5, 'NIKE-AM270-BLK-11', 150.00, 180.00, 85.00, 0.360, 18, 4);

INSERT INTO product_variant_combination_values (combination_id, variant_value_id) VALUES
(1, 1), (1, 5),
(2, 1), (2, 6),
(3, 1), (3, 7),
(4, 1), (4, 8),
(5, 2), (5, 5),
(6, 2), (6, 6),
(7, 2), (7, 7),
(8, 3), (8, 5),
(9, 3), (9, 6),
(10, 4), (10, 5),
(11, 9), (11, 13),
(12, 9), (12, 14),
(13, 9), (13, 15),
(14, 9), (14, 16),
(15, 10), (15, 13),
(16, 10), (16, 14),
(17, 10), (17, 15),
(18, 11), (18, 14),
(19, 11), (19, 15),
(20, 12), (20, 14),
(21, 18),
(22, 19),
(23, 20),
(24, 21),
(25, 22),
(26, 23),
(27, 24),
(28, 25);

INSERT INTO product_prices (product_id, currency_id, price, compare_price, is_auto_converted) VALUES
(1, 2, 849.15, 934.15, true),
(2, 2, 29.75, 38.25, true),
(3, 2, 721.65, 848.15, true),
(4, 2, 1019.15, 1104.15, true),
(5, 2, 127.50, 153.00, true);

INSERT INTO product_variant_prices (combination_id, currency_id, price, compare_price, cost_price) VALUES
(1, 1, 999.00, 1099.00, 750.00),
(1, 3, 83415.00, 91750.00, 62625.00),
(2, 1, 1099.00, 1199.00, 825.00),
(2, 3, 91750.00, 100165.00, 68887.50),
(3, 1, 1299.00, 1399.00, 975.00),
(3, 3, 108415.00, 116750.00, 81375.00),
(11, 1, 35.00, 45.00, 18.00),
(12, 1, 35.00, 45.00, 18.00),
(13, 1, 35.00, 45.00, 18.00),
(15, 1, 35.00, 45.00, 18.00),
(16, 1, 35.00, 45.00, 18.00),
(21, 1, 1199.00, 1299.00, 850.00),
(22, 1, 1399.00, 1499.00, 1000.00),
(23, 1, 1799.00, 1899.00, 1300.00);


INSERT INTO product_gallery (product_id, media_type, url, thumbnail_url, alt_text, title, sort_order, is_primary) VALUES
(1, 'image', 'https://example.com/images/iphone-15-pro-natural-1.jpg', 'https://example.com/images/thumbs/iphone-15-pro-natural-1.jpg', 'iPhone 15 Pro Natural Titanium Front', 'iPhone 15 Pro Natural Titanium', 1, true),
(1, 'image', 'https://example.com/images/iphone-15-pro-natural-2.jpg', 'https://example.com/images/thumbs/iphone-15-pro-natural-2.jpg', 'iPhone 15 Pro Natural Titanium Back', 'iPhone 15 Pro Back View', 2, false),
(1, 'video', 'https://example.com/videos/iphone-15-pro-review.mp4', 'https://example.com/images/thumbs/iphone-video-thumb.jpg', 'iPhone 15 Pro Review Video', 'iPhone 15 Pro Features', 3, false),
(1, '360_view', 'https://example.com/360/iphone-15-pro.html', 'https://example.com/images/thumbs/360-view.jpg', 'iPhone 15 Pro 360 View', '360° Product View', 4, false),
(2, 'image', 'https://example.com/images/nike-tshirt-black-1.jpg', 'https://example.com/images/thumbs/nike-tshirt-black-1.jpg', 'Nike Dri-FIT T-Shirt Black', 'Nike T-Shirt Black', 1, true),
(2, 'image', 'https://example.com/images/nike-tshirt-lifestyle.jpg', 'https://example.com/images/thumbs/nike-tshirt-lifestyle.jpg', 'Nike T-Shirt Lifestyle Shot', 'Lifestyle Image', 2, false),
(3, 'image', 'https://example.com/images/galaxy-s24-black-1.jpg', 'https://example.com/images/thumbs/galaxy-s24-black-1.jpg', 'Samsung Galaxy S24 Black', 'Galaxy S24 Front', 1, true),
(3, 'image', 'https://example.com/images/galaxy-s24-camera.jpg', 'https://example.com/images/thumbs/galaxy-s24-camera.jpg', 'Galaxy S24 Camera System', 'Camera Detail', 2, false),
(4, 'image', 'https://example.com/images/macbook-air-m2-1.jpg', 'https://example.com/images/thumbs/macbook-air-m2-1.jpg', 'MacBook Air M2 Silver', 'MacBook Air M2', 1, true),
(4, 'image', 'https://example.com/images/macbook-air-m2-open.jpg', 'https://example.com/images/thumbs/macbook-air-m2-open.jpg', 'MacBook Air M2 Open', 'MacBook Open View', 2, false),
(5, 'image', 'https://example.com/images/air-max-270-black-1.jpg', 'https://example.com/images/thumbs/air-max-270-black-1.jpg', 'Nike Air Max 270 Black', 'Air Max 270 Side View', 1, true),
(5, 'image', 'https://example.com/images/air-max-270-sole.jpg', 'https://example.com/images/thumbs/air-max-270-sole.jpg', 'Air Max 270 Sole Detail', 'Air Max Sole', 2, false);

INSERT INTO product_specifications (product_id, group_name, name, value, unit, sort_order) VALUES
(1, 'Display', 'Screen Size', '6.1', 'inches', 1),
(1, 'Display', 'Resolution', '2556 x 1179', 'pixels', 2),
(1, 'Display', 'Technology', 'Super Retina XDR OLED', null, 3),
(1, 'Performance', 'Chip', 'A17 Pro', null, 1),
(1, 'Performance', 'RAM', '8', 'GB', 2),
(1, 'Camera', 'Main Camera', '48', 'MP', 1),
(1, 'Camera', 'Ultra Wide', '12', 'MP', 2),
(1, 'Camera', 'Telephoto', '12', 'MP', 3),
(1, 'Battery', 'Video Playback', '23', 'hours', 1),
(1, 'Connectivity', 'USB', 'USB-C', null, 1),
(1, 'Connectivity', '5G', 'Yes', null, 2),
(2, 'Material', 'Fabric', '100% Polyester', null, 1),
(2, 'Material', 'Technology', 'Dri-FIT', null, 2),
(2, 'Care', 'Washing', 'Machine Washable', null, 1),
(2, 'Care', 'Temperature', 'Cold Water', null, 2),
(2, 'Fit', 'Style', 'Regular Fit', null, 1),
(3, 'Display', 'Screen Size', '6.2', 'inches', 1),
(3, 'Display', 'Resolution', '2340 x 1080', 'pixels', 2),
(3, 'Display', 'Refresh Rate', '120', 'Hz', 3),
(3, 'Performance', 'Processor', 'Snapdragon 8 Gen 3', null, 1),
(3, 'Performance', 'RAM', '8', 'GB', 2),
(3, 'Performance', 'Storage', '256', 'GB', 3),
(3, 'Camera', 'Main Camera', '50', 'MP', 1),
(3, 'Battery', 'Capacity', '4000', 'mAh', 1),
(4, 'Display', 'Screen Size', '13.6', 'inches', 1),
(4, 'Display', 'Resolution', '2560 x 1664', 'pixels', 2),
(4, 'Display', 'Technology', 'Liquid Retina', null, 3),
(4, 'Performance', 'Chip', 'Apple M2', null, 1),
(4, 'Performance', 'CPU Cores', '8', 'cores', 2),
(4, 'Performance', 'GPU Cores', '8', 'cores', 3),
(4, 'Memory', 'Unified Memory', '8', 'GB', 1),
(4, 'Battery', 'Life', '18', 'hours', 1),
(4, 'Connectivity', 'Thunderbolt', '2 ports', null, 1),
(4, 'Connectivity', 'MagSafe', 'Yes', null, 2);

UPDATE product_prices SET price = 999.00, compare_price = 1099.00 WHERE product_id = 1 AND currency_id = 1;
UPDATE product_prices SET price = 83415.00, compare_price = 91750.00 WHERE product_id = 1 AND currency_id = 3;
UPDATE product_prices SET price = 1199.00, compare_price = 1299.00 WHERE product_id = 4 AND currency_id = 1;
UPDATE product_prices SET price = 99915.00, compare_price = 108415.00 WHERE product_id = 4 AND currency_id = 3;
UPDATE product_prices SET price = 35.00, compare_price = 45.00 WHERE product_id = 2 AND currency_id = 1;
UPDATE product_prices SET price = 849.00, compare_price = 949.00 WHERE product_id = 3 AND currency_id = 1;
UPDATE product_prices SET price = 150.00, compare_price = 180.00 WHERE product_id = 5 AND currency_id = 1;




INSERT INTO shopping_carts (id, user_id, session_id, currency_id, language_id, expires_at, created_at, updated_at) VALUES
(1, 2, 'session_123', 1, 1, CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 4, 'session_456', 1, 1, CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE cart_items SET unit_price = 999.00, total_price = 999.00, combination_id = 1 WHERE cart_id = 1 AND product_id = 1;
UPDATE cart_items SET unit_price = 150.00, total_price = 300.00, combination_id = 26 WHERE cart_id = 1 AND product_id = 5;
UPDATE cart_items SET unit_price = 849.00, total_price = 849.00 WHERE cart_id = 2 AND product_id = 3;

INSERT INTO cart_items (cart_id, product_id, combination_id, quantity, unit_price, total_price) VALUES
(1, 2, 12, 1, 35.00, 35.00),
(2, 4, 21, 1, 1199.00, 1199.00);

UPDATE order_items SET combination_id = 26, unit_price = 150.00, total_price = 300.00 WHERE product_id = 5;
UPDATE order_items SET combination_id = 1, unit_price = 999.00, total_price = 999.00 WHERE product_id = 1;

INSERT INTO product_reviews (product_id, user_id, rating, title, comment, pros, cons, images, verified_purchase, is_approved) VALUES
(4, 2, 5, 'Amazing laptop for developers', 'The M2 chip is incredibly fast and the battery lasts all day. Perfect for coding and creative work.',
'Fast performance, excellent battery life, beautiful display', 'Limited ports, expensive storage upgrades',
ARRAY['https://example.com/reviews/macbook-review-1.jpg'], true, true),
(2, 4, 4, 'Good quality athletic wear', 'Nice material and fits well. The Dri-FIT technology really works during workouts.',
'Comfortable fit, moisture-wicking, good quality', 'Color fades slightly after multiple washes',
ARRAY[]::TEXT[], true, true),
(1, 2, 5, 'Best iPhone yet', 'The titanium build feels premium and the camera system is outstanding. Action button is very useful.',
'Premium build, excellent cameras, fast performance, great battery life', 'Very expensive, no charger included',
ARRAY['https://example.com/reviews/iphone-review-1.jpg', 'https://example.com/reviews/iphone-review-2.jpg'], true, true);

INSERT INTO abandoned_carts (cart_id, user_id, email, total_value, currency_id, recovery_token, email_sent_count, last_email_sent_at) VALUES
(1, 2, 'john@customer.com', 1334.00, 1, 'recover_abc123xyz', 1, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(2, 4, 'raj@vendor.com', 2048.00, 3, 'recover_def456uvw', 0, NULL);

INSERT INTO product_views (product_id, user_id, session_id, ip_address, viewed_at, duration_seconds) VALUES
(1, 2, 'session_123', '192.168.1.100', CURRENT_TIMESTAMP - INTERVAL '1 hour', 245),
(1, 4, 'session_456', '192.168.1.101', CURRENT_TIMESTAMP - INTERVAL '2 hours', 180),
(1, NULL, 'session_789', '192.168.1.102', CURRENT_TIMESTAMP - INTERVAL '30 minutes', 120),
(3, 2, 'session_123', '192.168.1.100', CURRENT_TIMESTAMP - INTERVAL '45 minutes', 95),
(4, 4, 'session_456', '192.168.1.101', CURRENT_TIMESTAMP - INTERVAL '3 hours', 310),
(2, NULL, 'session_999', '192.168.1.103', CURRENT_TIMESTAMP - INTERVAL '15 minutes', 65),
(5, 2, 'session_123', '192.168.1.100', CURRENT_TIMESTAMP - INTERVAL '1 day', 155);



INSERT INTO search_logs (user_id, session_id, query, results_count, filters_applied, sort_applied, clicked_product_ids, no_results) VALUES
(2, 'session_123', 'iPhone 15', 2, '{"brand": ["Apple"], "price_range": [800, 1200]}', 'price_asc', ARRAY[1, 3], false),
(4, 'session_456', 'Nike shoes', 1, '{"category": ["shoes"], "size": ["9", "10"]}', 'popularity', ARRAY[5], false),
(NULL, 'session_789', 'laptop MacBook', 1, '{}', 'newest', ARRAY[4], false),
(2, 'session_123', 'wireless headphones', 0, '{"brand": ["Apple", "Sony"]}', 'price_desc', ARRAY[]::integer[], true),
(4, 'session_456', 't-shirt cotton', 1, '{"material": ["cotton"]}', 'price_asc', ARRAY[2], false);



UPDATE products SET stock_quantity =
  (SELECT COALESCE(SUM(pi.quantity), 0)
  FROM product_inventory pi
    WHERE pi.product_id = products.id)
WHERE id IN (1, 2, 4, 5);

UPDATE product_inventory SET quantity = 30, low_stock_threshold = 5 WHERE product_id = 3;

UPDATE products SET view_count = (
     SELECT COUNT(*) FROM product_views pv WHERE pv.product_id = products.id
) WHERE id IN (1, 2, 3, 4, 5);

UPDATE products SET
     avg_rating = (
     SELECT ROUND(AVG(rating)::numeric, 2)
    FROM product_reviews pr
        WHERE pr.product_id = products.id AND pr.is_approved = true
     ),
     total_reviews = (
     SELECT COUNT(*)
    FROM product_reviews pr
    WHERE pr.product_id = products.id AND pr.is_approved = true
     )
WHERE id IN (1, 2, 3, 4, 5);

INSERT INTO product_translations (product_id, language_id, name, slug, description, short_description, meta_title, meta_description, search_keywords, tags) VALUES
(1, 2, 'iPhone 15 Pro', 'iphone-15-pro-es',
'<p>El iPhone 15 Pro presenta un diseño de titanio con botón de acción y USB-C.</p>',
'Último iPhone con diseño de titanio y chip A17 Pro',
'iPhone 15 Pro - Último smartphone de Apple',
'Compra iPhone 15 Pro con diseño de titanio, chip A17 Pro y sistema de cámara avanzado',
ARRAY['iphone', 'apple', 'smartphone', 'a17 pro', 'titanio'],
ARRAY['smartphone', 'premium', 'apple', 'nuevo']),
(2, 2, 'Camiseta Nike Dri-FIT', 'camiseta-nike-dri-fit',
'<p>Mantente fresco y cómodo con la tecnología Nike Dri-FIT.</p>',
'Camiseta que absorbe la humedad para un estilo de vida activo',
'Camiseta Nike Dri-FIT - Ropa Deportiva',
'Camiseta cómoda Nike Dri-FIT con tecnología que absorbe la humedad',
ARRAY['nike', 'camiseta', 'dri-fit', 'atlético', 'poliéster'],
ARRAY['deportiva', 'rebaja', 'verano']);

INSERT INTO category_translations (category_id, language_id, name, description, slug) VALUES
(1, 2, 'Electrónicos', 'Dispositivos electrónicos y accesorios', 'electronicos'),
(2, 2, 'Moda', 'Ropa y accesorios de moda', 'moda'),
(3, 2, 'Teléfonos Inteligentes', 'Teléfonos móviles y smartphones', 'telefonos-inteligentes'),
(4, 2, 'Portátiles', 'Computadoras portátiles', 'portatiles'),
(5, 2, 'Ropa Masculina', 'Ropa para hombres', 'ropa-masculina');

INSERT INTO brand_translations (brand_id, language_id, name, description, slug) VALUES
(1, 2, 'Apple', 'Marca de tecnología premium', 'apple'),
(2, 2, 'Samsung', 'Empresa global de electrónicos', 'samsung'),
(3, 2, 'Nike', 'Marca de deportes y estilo de vida', 'nike'),
(4, 2, 'Dell', 'Empresa de tecnología informática', 'dell');

INSERT INTO product_collections (name, slug, description, type, conditions, sort_method, is_featured, is_active) VALUES
('Best Sellers', 'best-sellers', 'Our most popular products', 'smart', '{"is_bestseller": true}', 'best_selling', true, true),
('New Arrivals', 'new-arrivals', 'Latest products in our store', 'smart', '{"is_new_arrival": true}', 'newest', true, true),
('Sale Items', 'sale-items', 'Products currently on sale', 'smart', '{"is_on_sale": true}', 'price_desc', false, true),
('Premium Collection', 'premium-collection', 'Hand-picked premium products', 'manual', '{}', 'manual', true, true),
('Tech Essentials', 'tech-essentials', 'Must-have technology products', 'manual', '{}', 'manual', false, true);

INSERT INTO collection_products (collection_id, product_id, sort_order, is_featured) VALUES
(1, 1, 1, true),
(1, 3, 2, false),
(1, 5, 3, false),
(2, 1, 1, true),
(2, 2, 2, false),
(3, 2, 1, true),
(4, 1, 1, true),
(4, 4, 2, true),
(4, 3, 3, false),
(5, 1, 1, true),
(5, 3, 2, false),
(5, 4, 3, false);

INSERT INTO product_cross_sells (product_id, cross_sell_product_id, type, sort_order) VALUES
(1, 4, 'upsell', 1),
(1, 3, 'cross_sell', 1),
(4, 1, 'cross_sell', 1),
(3, 1, 'cross_sell', 1),
(2, 5, 'frequently_bought', 1),
(5, 2, 'frequently_bought', 1);

INSERT INTO product_bundles (name, slug, description, bundle_type, discount_type, discount_value, min_items, is_active) VALUES
('Apple Ecosystem Bundle', 'apple-ecosystem', 'iPhone + MacBook combo deal', 'fixed', 'percentage', 5.00, 2, true),
('Nike Athletic Set', 'nike-athletic-set', 'Complete athletic wear bundle', 'fixed', 'fixed', 25.00, 2, true),
('Tech Starter Pack', 'tech-starter-pack', 'Essential tech products for beginners', 'mix_match', 'percentage', 10.00, 2, true);

INSERT INTO bundle_products (bundle_id, product_id, quantity, is_required, discount_percentage, sort_order) VALUES
(1, 1, 1, true, 0, 1),
(1, 4, 1, true, 0, 2),
(2, 2, 1, true, 0, 1),
(2, 5, 1, true, 0, 2),
(3, 1, 1, false, 0, 1),
(3, 3, 1, false, 0, 2),
(3, 4, 1, false, 0, 3);




INSERT INTO warehouses (vendor_id, name, code, address_line1, city_id, is_primary, is_active) VALUES
(1, 'Jane Main Warehouse', 'JMW-001', '123 Tech Street', 1, true, true),
(2, 'Raj Fashion Center', 'RFC-001', '456 Fashion Avenue', 3, true, true);




-- NEW ADDED 

CREATE INDEX idx_menus_role_active ON menus(role, is_active);
CREATE INDEX idx_menu_items_menu_parent ON menu_items(menu_id, parent_id);
CREATE INDEX idx_menu_items_sort_order ON menu_items(menu_id, parent_id, sort_order);
CREATE INDEX idx_menu_items_active ON menu_items(is_active);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
 
INSERT INTO menus (name, location, role, is_active, created_by) VALUES
('Super Admin Main Menu', 'sidebar', 'super_admin', true, 1);

INSERT INTO menu_items (menu_id, title, url, icon, sort_order, is_active, created_by) VALUES
(1, 'Dashboard', '/super-admin', 'LayoutDashboard', 1, true, 1),
(1, 'System Management', '/super-admin/system', 'Settings', 2, true, 1),
(1, 'User Management', '/super-admin/users', 'Users', 3, true, 1),
(1, 'Analytics', '/super-admin/analytics', 'BarChart3', 4, true, 1),
(1, 'Reports', '/super-admin/reports', 'FileText', 5, true, 1),
(1, 'Audit Logs', '/super-admin/audit', 'Activity', 6, true, 1),
(1, 'Settings', '/super-admin/settings', 'Settings', 7, true, 1);

INSERT INTO menu_items (menu_id, parent_id, title, url, icon, sort_order, is_active, created_by) VALUES
(1, 2, 'System Settings', '/super-admin/system/settings', 'Cog', 1, true, 1),
(1, 2, 'Database Management', '/super-admin/system/database', 'Database', 2, true, 1),
(1, 2, 'System Logs', '/super-admin/system/logs', 'FileText', 3, true, 1),
(1, 2, 'Backup & Restore', '/super-admin/system/backup', 'HardDrive', 4, true, 1);

INSERT INTO menu_items (menu_id, parent_id, title, url, icon, sort_order, is_active, badge_count, created_by) VALUES
(1, 3, 'All Users', '/super-admin/users', 'Users', 1, true, 0, 1),
(1, 3, 'Admins', '/super-admin/users/admins', 'UserCheck', 2, true, 5, 1),
(1, 3, 'Vendors', '/super-admin/users/vendors', 'Store', 3, true, 12, 1),
(1, 3, 'Customers', '/super-admin/users/customers', 'User', 4, true, 0, 1),
(1, 3, 'Roles & Permissions', '/super-admin/users/roles', 'Shield', 5, true, 0, 1);

INSERT INTO menus (name, location, role, is_active, created_by) VALUES
('Admin Main Menu', 'sidebar', 'admin', true, 1);

INSERT INTO menu_items (menu_id, title, url, icon, sort_order, is_active, created_by) VALUES
(2, 'Dashboard', '/admin', 'LayoutDashboard', 1, true, 1),
(2, 'Vendors', '/admin/vendors', 'Users', 2, true, 1),
(2, 'Products', '/admin/products', 'Package', 3, true, 1),
(2, 'Orders', '/admin/orders', 'ShoppingCart', 4, true, 1),
(2, 'Reviews', '/admin/reviews', 'Star', 5, true, 1),
(2, 'Payouts', '/admin/payouts', 'CreditCard', 6, true, 1),
(2, 'Analytics', '/admin/analytics', 'BarChart3', 7, true, 1),
(2, 'Categories', '/admin/categories', 'Folder', 8, true, 1),
(2, 'Taxes', '/admin/taxes', 'Calculator', 9, true, 1),
(2, 'Settings', '/admin/settings', 'Settings', 10, true, 1);

INSERT INTO menu_items (menu_id, parent_id, title, url, icon, sort_order, is_active, created_by) VALUES
(2, (SELECT id FROM menu_items WHERE menu_id = 2 AND title = 'Products'), 'All Products', '/admin/products', 'List', 1, true, 1),
(2, (SELECT id FROM menu_items WHERE menu_id = 2 AND title = 'Products'), 'Add Product', '/admin/products/add', 'Plus', 2, true, 1),
(2, (SELECT id FROM menu_items WHERE menu_id = 2 AND title = 'Products'), 'Product Categories', '/admin/products/categories', 'Folder', 3, true, 1),
(2, (SELECT id FROM menu_items WHERE menu_id = 2 AND title = 'Products'), 'Bulk Import', '/admin/products/import', 'Upload', 4, true, 1);

INSERT INTO menu_items (menu_id, parent_id, title, url, icon, sort_order, is_active, badge_count, created_by) VALUES
(2, (SELECT id FROM menu_items WHERE menu_id = 2 AND title = 'Orders'), 'All Orders', '/admin/orders', 'List', 1, true, 0, 1),
(2, (SELECT id FROM menu_items WHERE menu_id = 2 AND title = 'Orders'), 'Pending Orders', '/admin/orders/pending', 'Clock', 2, true, 15, 1),
(2, (SELECT id FROM menu_items WHERE menu_id = 2 AND title = 'Orders'), 'Processing', '/admin/orders/processing', 'Loader', 3, true, 8, 1),
(2, (SELECT id FROM menu_items WHERE menu_id = 2 AND title = 'Orders'), 'Completed', '/admin/orders/completed', 'CheckCircle', 4, true, 0, 1),
(2, (SELECT id FROM menu_items WHERE menu_id = 2 AND title = 'Orders'), 'Cancelled', '/admin/orders/cancelled', 'XCircle', 5, true, 2, 1);

INSERT INTO menus (name, location, role, is_active, created_by) VALUES
('Vendor Main Menu', 'sidebar', 'vendor', true, 1);

INSERT INTO menu_items (menu_id, title, url, icon, sort_order, is_active, created_by) VALUES
(3, 'Dashboard', '/vendor', 'LayoutDashboard', 1, true, 1),
(3, 'Products', '/vendor/products', 'Package', 2, true, 1),
(3, 'Orders', '/vendor/orders', 'ShoppingCart', 3, true, 1),
(3, 'Customers', '/vendor/customers', 'Users', 4, true, 1),
(3, 'Reviews', '/vendor/reviews', 'Star', 5, true, 1),
(3, 'Payouts', '/vendor/payouts', 'CreditCard', 6, true, 1),
(3, 'Analytics', '/vendor/analytics', 'BarChart3', 7, true, 1),
(3, 'Settings', '/vendor/settings', 'Settings', 8, true, 1);

INSERT INTO menu_items (menu_id, parent_id, title, url, icon, sort_order, is_active, created_by) VALUES
(3, (SELECT id FROM menu_items WHERE menu_id = 3 AND title = 'Products'), 'All Products', '/vendor/products', 'List', 1, true, 1),
(3, (SELECT id FROM menu_items WHERE menu_id = 3 AND title = 'Products'), 'Add Product', '/vendor/products/add', 'Plus', 2, true, 1),
(3, (SELECT id FROM menu_items WHERE menu_id = 3 AND title = 'Products'), 'Product Categories', '/vendor/products/categories', 'Folder', 3, true, 1),
(3, (SELECT id FROM menu_items WHERE menu_id = 3 AND title = 'Products'), 'Inventory', '/vendor/products/inventory', 'Package2', 4, true, 1);

INSERT INTO menu_items (menu_id, parent_id, title, url, icon, sort_order, is_active, badge_count, created_by) VALUES
(3, (SELECT id FROM menu_items WHERE menu_id = 3 AND title = 'Orders'), 'All Orders', '/vendor/orders', 'List', 1, true, 0, 1),
(3, (SELECT id FROM menu_items WHERE menu_id = 3 AND title = 'Orders'), 'New Orders', '/vendor/orders/new', 'Clock', 2, true, 5, 1),
(3, (SELECT id FROM menu_items WHERE menu_id = 3 AND title = 'Orders'), 'Processing', '/vendor/orders/processing', 'Loader', 3, true, 3, 1),
(3, (SELECT id FROM menu_items WHERE menu_id = 3 AND title = 'Orders'), 'Shipped', '/vendor/orders/shipped', 'Truck', 4, true, 0, 1),
(3, (SELECT id FROM menu_items WHERE menu_id = 3 AND title = 'Orders'), 'Delivered', '/vendor/orders/delivered', 'CheckCircle', 5, true, 0, 1);

CREATE OR REPLACE VIEW menu_hierarchy AS
WITH RECURSIVE menu_tree AS (
    SELECT 
        m.id as menu_id,
        m.name as menu_name,
        m.role,
        mi.id,
        mi.parent_id,
        mi.title,
        mi.url,
        mi.icon,
        mi.badge_count,
        mi.badge_color,
        mi.sort_order,
        mi.is_active,
        0 as level,
        ARRAY[mi.sort_order] as path
    FROM menus m
    JOIN menu_items mi ON m.id = mi.menu_id
    WHERE mi.parent_id IS NULL AND m.is_active = true AND mi.is_active = true
    
    UNION ALL
    
    SELECT 
        mt.menu_id,
        mt.menu_name,
        mt.role,
        mi.id,
        mi.parent_id,
        mi.title,
        mi.url,
        mi.icon,
        mi.badge_count,
        mi.badge_color,
        mi.sort_order,
        mi.is_active,
        mt.level + 1,
        mt.path || mi.sort_order
    FROM menu_tree mt
    JOIN menu_items mi ON mt.id = mi.parent_id
    WHERE mi.is_active = true
)
SELECT * FROM menu_tree ORDER BY role, path;
CREATE OR REPLACE FUNCTION get_menu_json(user_role VARCHAR(50))
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'title', title,
            'url', url,
            'icon', icon,
            'badge_count', badge_count,
            'badge_color', badge_color,
            'children', (
                SELECT json_agg(
                    json_build_object(
                        'id', child.id,
                        'title', child.title,
                        'url', child.url,
                        'icon', child.icon,
                        'badge_count', child.badge_count,
                        'badge_color', child.badge_color
                    ) ORDER BY child.sort_order
                )
                FROM menu_hierarchy child
                WHERE child.parent_id = parent.id
            )
        ) ORDER BY sort_order
    ) INTO result
    FROM menu_hierarchy parent
    WHERE role = user_role AND level = 0;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ALTER TABLE product_variants
-- ADD COLUMN attribute_id INTEGER NOT NULL REFERENCES attributes(id) ON DELETE CASCADE;
 
--  ALTER TABLE product_variant_values
-- ADD COLUMN attribute_value_id INTEGER NOT NULL REFERENCES attribute_values(id) ON DELETE CASCADE;
-- is are still remaining 
-- helper
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

 
-- INSERT INTO product_inventory (product_id, combination_id, warehouse_id, quantity, reserved_quantity, low_stock_threshold) VALUES
-- (1, 1, 1, 15, 2, 3),
-- (1, 2, 1, 12, 1, 3),
-- (1, 3, 1, 8, 0, 2),
-- (1, 5, 1, 12, 1, 3),
-- (1, 6, 1, 10, 0, 3),
-- (1, 8, 1, 8, 1, 2),
-- (1, 10, 1, 10, 2, 3),
-- (2, 11, 2, 25, 3, 5),
-- (2, 12, 2, 30, 5, 5),
-- (2, 13, 2, 35, 8, 5),
-- (2, 14, 2, 20, 2, 5),
-- (2, 15, 2, 20, 1, 5),
-- (2, 16, 2, 25, 4, 5),
-- (2, 17, 2, 28, 3, 5),
-- (2, 18, 2, 15, 2, 5),
-- (2, 19, 2, 18, 1, 5),
-- (2, 20, 2, 12, 0, 5),
-- (4, 21, 1, 15, 2, 3),
-- (4, 22, 1, 10, 1, 2),
-- (4, 23, 1, 5, 0, 1),
-- (5, 24, 2, 15, 1, 3),
-- (5, 25, 2, 20, 3, 5),
-- (5, 26, 2, 25, 5, 5),
-- (5, 27, 2, 22, 4, 5),
-- (5, 28, 2, 18, 2, 4);

-- INSERT INTO inventory_movements (inventory_id, movement_type, quantity, reference_type, reference_id, notes, unit_cost, total_cost) VALUES
-- (1, 'in', 17, 'purchase_order', 1001, 'Initial stock receipt', 750.00, 12750.00),
-- (2, 'in', 13, 'purchase_order', 1001, 'Initial stock receipt', 825.00, 10725.00),
-- (5, 'in', 13, 'purchase_order', 1001, 'Initial stock receipt', 750.00, 9750.00),
-- (1, 'out', 2, 'order', 1, 'Sold to customer', 750.00, 1500.00),
-- (2, 'out', 1, 'order', 2, 'Sold to customer', 825.00, 825.00),
-- (1, 'reserved', 2, 'order', 3, 'Reserved for pending order', 0, 0),
-- (5, 'reserved', 1, 'order', 4, 'Reserved for pending order', 0, 0);

-- INSERT INTO search_logs (user_id, session_id, query, results_count, filters_applied, sort_applied, clicked_product_ids, no_results) VALUES
-- (2, 'session_123', 'iPhone 15', 2, '{"brand": ["Apple"], "price_range": [800, 1200]}', 'price_asc', ARRAY[1, 3], false),
-- (4, 'session_456', 'Nike shoes', 1, '{"category": ["shoes"], "size": ["9", "10"]}', 'popularity', ARRAY[5], false),
-- (NULL, 'session_789', 'laptop MacBook', 1, '{}', 'newest', ARRAY[4], false),
-- (2, 'session_123', 'wireless headphones', 0, '{"brand": ["Apple", "Sony"]}', 'price_desc', **ARRAY[]::integer[]**, true),
-- (4, 'session_456', 't-shirt cotton', 1, '{"material": ["cotton"]}', 'price_asc', ARRAY[2], false);

-- UPDATE products SET stock_quantity =
--   (SELECT COALESCE(SUM(pi.quantity), 0)
--  FROM product_inventory pi
--  WHERE pi.product_id = products.id)
-- WHERE id IN (1, 2, 4, 5);

-- UPDATE product_inventory SET quantity = 30, low_stock_threshold = 5 WHERE product_id = 3;

-- UPDATE products SET view_count = (
--   SELECT COUNT(*) FROM product_views pv WHERE pv.product_id = products.id
-- ) WHERE id IN (1, 2, 3, 4, 5);

-- UPDATE products SET
--      avg_rating = (
--      SELECT ROUND(AVG(rating)::numeric, 2)
--      FROM product_reviews pr
--     WHERE pr.product_id = products.id AND pr.is_approved = true
--     ),
--      total_reviews = (
--      SELECT COUNT(*)
--      FROM product_reviews pr
--      WHERE pr.product_id = products.id AND pr.is_approved = true
--      )
-- WHERE id IN (1, 2, 3, 4, 5);

-- INSERT INTO product_translations (product_id, language_id, name, slug, description, short_description, meta_title, meta_description, search_keywords, tags) VALUES
-- (1, 2, 'iPhone 15 Pro', 'iphone-15-pro-es',
-- '<p>El iPhone 15 Pro presenta un diseño de titanio con botón de acción y USB-C.</p>',
-- 'Último iPhone con diseño de titanio y chip A17 Pro',
-- 'iPhone 15 Pro - Último smartphone de Apple',
-- 'Compra iPhone 15 Pro con diseño de titanio, chip A17 Pro y sistema de cámara avanzado',
-- ARRAY['iphone', 'apple', 'smartphone', 'a17 pro', 'titanio'],
-- ARRAY['smartphone', 'premium', 'apple', 'nuevo']),
-- (2, 2, 'Camiseta Nike Dri-FIT', 'camiseta-nike-dri-fit',
-- '<p>Mantente fresco y cómodo con la tecnología Nike Dri-FIT.</p>',
-- 'Camiseta que absorbe la humedad para un estilo de vida activo',
-- 'Camiseta Nike Dri-FIT - Ropa Deportiva',
-- 'Camiseta cómoda Nike Dri-FIT con tecnología que absorbe la humedad',
-- ARRAY['nike', 'camiseta', 'dri-fit', 'atlético', 'poliéster'],
-- ARRAY['deportiva', 'rebaja', 'verano']);

--     INSERT INTO category_translations (category_id, language_id, name, description, slug) VALUES
--     (1, 2, 'Electrónicos', 'Dispositivos electrónicos y accesorios', 'electronicos'),
--     (2, 2, 'Moda', 'Ropa y accesorios de moda', 'moda'),
--     (3, 2, 'Teléfonos Inteligentes', 'Teléfonos móviles y smartphones', 'telefonos-inteligentes'),
--     (4, 2, 'Portátiles', 'Computadoras portátiles', 'portatiles'),
--     (5, 2, 'Ropa Masculina', 'Ropa para hombres', 'ropa-masculina');

--     INSERT INTO brand_translations (brand_id, language_id, name, description, slug) VALUES
--     (1, 2, 'Apple', 'Marca de tecnología premium', 'apple'),
--     (2, 2, 'Samsung', 'Empresa global de electrónicos', 'samsung'),
--     (3, 2, 'Nike', 'Marca de deportes y estilo de vida', 'nike'),
--     (4, 2, 'Dell', 'Empresa de tecnología informática', 'dell');

--     INSERT INTO product_collections (name, slug, description, type, conditions, sort_method, is_featured, is_active) VALUES
--     ('Best Sellers', 'best-sellers', 'Our most popular products', 'smart', '{"is_bestseller": true}', 'best_selling', true, true),
--     ('New Arrivals', 'new-arrivals', 'Latest products in our store', 'smart', '{"is_new_arrival": true}', 'newest', true, true),
--     ('Sale Items', 'sale-items', 'Products currently on sale', 'smart', '{"is_on_sale": true}', 'price_desc', false, true),
--     ('Premium Collection', 'premium-collection', 'Hand-picked premium products', 'manual', '{}', 'manual', true, true),
--     ('Tech Essentials', 'tech-essentials', 'Must-have technology products', 'manual', '{}', 'manual', false, true);

--     INSERT INTO collection_products (collection_id, product_id, sort_order, is_featured) VALUES
--     (1, 1, 1, true),
--     (1, 3, 2, false),
--     (1, 5, 3, false),
--     (2, 1, 1, true),
--     (2, 2, 2, false),
--     (3, 2, 1, true),
--     (4, 1, 1, true),
--     (4, 4, 2, true),
--     (4, 3, 3, false),
--     (5, 1, 1, true),
--     (5, 3, 2, false),
--     (5, 4, 3, false);

--     INSERT INTO product_cross_sells (product_id, cross_sell_product_id, type, sort_order) VALUES
--     (1, 4, 'upsell', 1),
--     (1, 3, 'cross_sell', 1),
--     (4, 1, 'cross_sell', 1),
--     (3, 1, 'cross_sell', 1),
--     (2, 5, 'frequently_bought', 1),
--     (5, 2, 'frequently_bought', 1);

--     INSERT INTO product_bundles (name, slug, description, bundle_type, discount_type, discount_value, min_items, is_active) VALUES
--     ('Apple Ecosystem Bundle', 'apple-ecosystem', 'iPhone + MacBook combo deal', 'fixed', 'percentage', 5.00, 2, true),
--     ('Nike Athletic Set', 'nike-athletic-set', 'Complete athletic wear bundle', 'fixed', 'fixed', 25.00, 2, true),
--     ('Tech Starter Pack', 'tech-starter-pack', 'Essential tech products for beginners', 'mix_match', 'percentage', 10.00, 2, true);

--     INSERT INTO bundle_products (bundle_id, product_id, quantity, is_required, discount_percentage, sort_order) VALUES
--     (1, 1, 1, true, 0, 1),
--     (1, 4, 1, true, 0, 2),
--     (2, 2, 1, true, 0, 1),
--     (2, 5, 1, true, 0, 2),
--     (3, 1, 1, false, 0, 1),
--     (3, 3, 1, false, 0, 2),
--     (3, 4, 1, false, 0, 3);

--     INSERT INTO product_questions (product_id, user_id, question, answer, answered_by, answered_at, is_public, helpful_votes) VALUES
--     (1, 2, 'Does this iPhone come with a charger?', 'Yes, it comes with a USB-C to Lightning cable but no power adapter.', 3, CURRENT_TIMESTAMP - INTERVAL '2 days', true, 5),
--     (1, 4, 'What is the battery life like?', 'The iPhone 15 Pro offers up to 23 hours of video playback.', 1, CURRENT_TIMESTAMP - INTERVAL '1 day', true, 3),
--     (2, 2, 'Is this shirt suitable for running?', 'Yes, the Dri-FIT technology makes it perfect for running and other athletic activities.', 4, CURRENT_TIMESTAMP - INTERVAL '3 hours', true, 2),
--     (4, 2, 'Can I upgrade the RAM later?', 'No, the RAM is soldered and cannot be upgraded. Choose your configuration carefully.', 1, CURRENT_TIMESTAMP - INTERVAL '1 day', true, 8),
--     (5, 4, 'Do these run true to size?', NULL, NULL, NULL, true, 0);

--     INSERT INTO user_addresses (user_id, type, first_name, last_name, address_line1, city_name, country_id, postal_code, is_default) VALUES
--     (2, 'both', 'John', 'Doe', '789 Main Street', 'Los Angeles', 1, '90210', true),
--     (3, 'both', 'Jane', 'Smith', '321 Oak Avenue', 'New York City', 1, '10001', true),
--     (4, 'both', 'Raj', 'Patel', '654 Commerce Road', 'Ahmedabad', 2, '380001', true);

--     INSERT INTO shipping_zones (name, countries, is_active) VALUES
--     ('US Domestic', ARRAY[1], true),
--     ('India Domestic', ARRAY[2], true),
--     ('International', ARRAY[1,2,3], true);

--     INSERT INTO shipping_methods (name, zone_id, calculation_type, base_cost, currency_id, estimated_days_min, estimated_days_max, is_active) VALUES
--     ('Standard Shipping', 1, 'fixed', 5.99, 1, 3, 7, true),
--     ('Express Shipping', 1, 'fixed', 15.99, 1, 1, 2, true),
--     ('Free Shipping', 2, 'free', 0.00, 3, 5, 10, true);

--     INSERT INTO promotions (name, slug, type, value, currency_id, start_date, end_date, minimum_order_amount, status) VALUES
--     ('Welcome 10%', 'welcome-10', 'PERCENTAGE_ORDER', 10.00, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 50.00, 'active'),
--     ('Free Shipping Over $100', 'free-ship-100', 'FREE_SHIPPING', 0.00, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 100.00, 'active');
--     console.log(`🚀 ~ 
 
-- INSERT INTO product_inventory (product_id, combination_id, warehouse_id, quantity, reserved_quantity, low_stock_threshold) VALUES
-- (1, 1, 1, 15, 2, 3),
-- (1, 2, 1, 12, 1, 3),
-- (1, 3, 1, 8, 0, 2),
-- (1, 5, 1, 12, 1, 3),
-- (1, 6, 1, 10, 0, 3),
-- (1, 8, 1, 8, 1, 2),
-- (1, 10, 1, 10, 2, 3),
-- (2, 11, 2, 25, 3, 5),
-- (2, 12, 2, 30, 5, 5),
-- (2, 13, 2, 35, 8, 5),
-- (2, 14, 2, 20, 2, 5),
-- (2, 15, 2, 20, 1, 5),
-- (2, 16, 2, 25, 4, 5),
-- (2, 17, 2, 28, 3, 5),
-- (2, 18, 2, 15, 2, 5),
-- (2, 19, 2, 18, 1, 5),
-- (2, 20, 2, 12, 0, 5),
-- (4, 21, 1, 15, 2, 3),
-- (4, 22, 1, 10, 1, 2),
-- (4, 23, 1, 5, 0, 1),
-- (5, 24, 2, 15, 1, 3),
-- (5, 25, 2, 20, 3, 5),
-- (5, 26, 2, 25, 5, 5),
-- (5, 27, 2, 22, 4, 5),
-- (5, 28, 2, 18, 2, 4);

-- INSERT INTO inventory_movements (inventory_id, movement_type, quantity, reference_type, reference_id, notes, unit_cost, total_cost) VALUES
-- (1, 'in', 17, 'purchase_order', 1001, 'Initial stock receipt', 750.00, 12750.00),
-- (2, 'in', 13, 'purchase_order', 1001, 'Initial stock receipt', 825.00, 10725.00),
-- (5, 'in', 13, 'purchase_order', 1001, 'Initial stock receipt', 750.00, 9750.00),
-- (1, 'out', 2, 'order', 1, 'Sold to customer', 750.00, 1500.00),
-- (2, 'out', 1, 'order', 2, 'Sold to customer', 825.00, 825.00),
-- (1, 'reserved', 2, 'order', 3, 'Reserved for pending order', 0, 0),
-- (5, 'reserved', 1, 'order', 4, 'Reserved for pending order', 0, 0);

-- INSERT INTO search_logs (user_id, session_id, query, results_count, filters_applied, sort_applied, clicked_product_ids, no_results) VALUES
-- (2, 'session_123', 'iPhone 15', 2, '{"brand": ["Apple"], "price_range": [800, 1200]}', 'price_asc', ARRAY[1, 3], false),
-- (4, 'session_456', 'Nike shoes', 1, '{"category": ["shoes"], "size": ["9", "10"]}', 'popularity', ARRAY[5], false),
-- (NULL, 'session_789', 'laptop MacBook', 1, '{}', 'newest', ARRAY[4], false),
-- (2, 'session_123', 'wireless headphones', 0, '{"brand": ["Apple", "Sony"]}', 'price_desc', **ARRAY[]::integer[]**, true),
-- (4, 'session_456', 't-shirt cotton', 1, '{"material": ["cotton"]}', 'price_asc', ARRAY[2], false);

-- UPDATE products SET stock_quantity =
--   (SELECT COALESCE(SUM(pi.quantity), 0)
--  FROM product_inventory pi
--  WHERE pi.product_id = products.id)
-- WHERE id IN (1, 2, 4, 5);

-- UPDATE product_inventory SET quantity = 30, low_stock_threshold = 5 WHERE product_id = 3;

-- UPDATE products SET view_count = (
--   SELECT COUNT(*) FROM product_views pv WHERE pv.product_id = products.id
-- ) WHERE id IN (1, 2, 3, 4, 5);

-- UPDATE products SET
--      avg_rating = (
--      SELECT ROUND(AVG(rating)::numeric, 2)
--      FROM product_reviews pr
--     WHERE pr.product_id = products.id AND pr.is_approved = true
--     ),
--      total_reviews = (
--      SELECT COUNT(*)
--      FROM product_reviews pr
--      WHERE pr.product_id = products.id AND pr.is_approved = true
--      )
-- WHERE id IN (1, 2, 3, 4, 5);

-- INSERT INTO product_translations (product_id, language_id, name, slug, description, short_description, meta_title, meta_description, search_keywords, tags) VALUES
-- (1, 2, 'iPhone 15 Pro', 'iphone-15-pro-es',
-- '<p>El iPhone 15 Pro presenta un diseño de titanio con botón de acción y USB-C.</p>',
-- 'Último iPhone con diseño de titanio y chip A17 Pro',
-- 'iPhone 15 Pro - Último smartphone de Apple',
-- 'Compra iPhone 15 Pro con diseño de titanio, chip A17 Pro y sistema de cámara avanzado',
-- ARRAY['iphone', 'apple', 'smartphone', 'a17 pro', 'titanio'],
-- ARRAY['smartphone', 'premium', 'apple', 'nuevo']),
-- (2, 2, 'Camiseta Nike Dri-FIT', 'camiseta-nike-dri-fit',
-- '<p>Mantente fresco y cómodo con la tecnología Nike Dri-FIT.</p>',
-- 'Camiseta que absorbe la humedad para un estilo de vida activo',
-- 'Camiseta Nike Dri-FIT - Ropa Deportiva',
-- 'Camiseta cómoda Nike Dri-FIT con tecnología que absorbe la humedad',
-- ARRAY['nike', 'camiseta', 'dri-fit', 'atlético', 'poliéster'],
-- ARRAY['deportiva', 'rebaja', 'verano']);

--     INSERT INTO category_translations (category_id, language_id, name, description, slug) VALUES
--     (1, 2, 'Electrónicos', 'Dispositivos electrónicos y accesorios', 'electronicos'),
--     (2, 2, 'Moda', 'Ropa y accesorios de moda', 'moda'),
--     (3, 2, 'Teléfonos Inteligentes', 'Teléfonos móviles y smartphones', 'telefonos-inteligentes'),
--     (4, 2, 'Portátiles', 'Computadoras portátiles', 'portatiles'),
--     (5, 2, 'Ropa Masculina', 'Ropa para hombres', 'ropa-masculina');

--     INSERT INTO brand_translations (brand_id, language_id, name, description, slug) VALUES
--     (1, 2, 'Apple', 'Marca de tecnología premium', 'apple'),
--     (2, 2, 'Samsung', 'Empresa global de electrónicos', 'samsung'),
--     (3, 2, 'Nike', 'Marca de deportes y estilo de vida', 'nike'),
--     (4, 2, 'Dell', 'Empresa de tecnología informática', 'dell');

--     INSERT INTO product_collections (name, slug, description, type, conditions, sort_method, is_featured, is_active) VALUES
--     ('Best Sellers', 'best-sellers', 'Our most popular products', 'smart', '{"is_bestseller": true}', 'best_selling', true, true),
--     ('New Arrivals', 'new-arrivals', 'Latest products in our store', 'smart', '{"is_new_arrival": true}', 'newest', true, true),
--     ('Sale Items', 'sale-items', 'Products currently on sale', 'smart', '{"is_on_sale": true}', 'price_desc', false, true),
--     ('Premium Collection', 'premium-collection', 'Hand-picked premium products', 'manual', '{}', 'manual', true, true),
--     ('Tech Essentials', 'tech-essentials', 'Must-have technology products', 'manual', '{}', 'manual', false, true);

--     INSERT INTO collection_products (collection_id, product_id, sort_order, is_featured) VALUES
--     (1, 1, 1, true),
--     (1, 3, 2, false),
--     (1, 5, 3, false),
--     (2, 1, 1, true),
--     (2, 2, 2, false),
--     (3, 2, 1, true),
--     (4, 1, 1, true),
--     (4, 4, 2, true),
--     (4, 3, 3, false),
--     (5, 1, 1, true),
--     (5, 3, 2, false),
--     (5, 4, 3, false);

--     INSERT INTO product_cross_sells (product_id, cross_sell_product_id, type, sort_order) VALUES
--     (1, 4, 'upsell', 1),
--     (1, 3, 'cross_sell', 1),
--     (4, 1, 'cross_sell', 1),
--     (3, 1, 'cross_sell', 1),
--     (2, 5, 'frequently_bought', 1),
--     (5, 2, 'frequently_bought', 1);

--     INSERT INTO product_bundles (name, slug, description, bundle_type, discount_type, discount_value, min_items, is_active) VALUES
--     ('Apple Ecosystem Bundle', 'apple-ecosystem', 'iPhone + MacBook combo deal', 'fixed', 'percentage', 5.00, 2, true),
--     ('Nike Athletic Set', 'nike-athletic-set', 'Complete athletic wear bundle', 'fixed', 'fixed', 25.00, 2, true),
--     ('Tech Starter Pack', 'tech-starter-pack', 'Essential tech products for beginners', 'mix_match', 'percentage', 10.00, 2, true);

--     INSERT INTO bundle_products (bundle_id, product_id, quantity, is_required, discount_percentage, sort_order) VALUES
--     (1, 1, 1, true, 0, 1),
--     (1, 4, 1, true, 0, 2),
--     (2, 2, 1, true, 0, 1),
--     (2, 5, 1, true, 0, 2),
--     (3, 1, 1, false, 0, 1),
--     (3, 3, 1, false, 0, 2),
--     (3, 4, 1, false, 0, 3);

--     INSERT INTO product_questions (product_id, user_id, question, answer, answered_by, answered_at, is_public, helpful_votes) VALUES
--     (1, 2, 'Does this iPhone come with a charger?', 'Yes, it comes with a USB-C to Lightning cable but no power adapter.', 3, CURRENT_TIMESTAMP - INTERVAL '2 days', true, 5),
--     (1, 4, 'What is the battery life like?', 'The iPhone 15 Pro offers up to 23 hours of video playback.', 1, CURRENT_TIMESTAMP - INTERVAL '1 day', true, 3),
--     (2, 2, 'Is this shirt suitable for running?', 'Yes, the Dri-FIT technology makes it perfect for running and other athletic activities.', 4, CURRENT_TIMESTAMP - INTERVAL '3 hours', true, 2),
--     (4, 2, 'Can I upgrade the RAM later?', 'No, the RAM is soldered and cannot be upgraded. Choose your configuration carefully.', 1, CURRENT_TIMESTAMP - INTERVAL '1 day', true, 8),
--     (5, 4, 'Do these run true to size?', NULL, NULL, NULL, true, 0);

--     INSERT INTO user_addresses (user_id, type, first_name, last_name, address_line1, city_name, country_id, postal_code, is_default) VALUES
--     (2, 'both', 'John', 'Doe', '789 Main Street', 'Los Angeles', 1, '90210', true),
--     (3, 'both', 'Jane', 'Smith', '321 Oak Avenue', 'New York City', 1, '10001', true),
--     (4, 'both', 'Raj', 'Patel', '654 Commerce Road', 'Ahmedabad', 2, '380001', true);

--     INSERT INTO shipping_zones (name, countries, is_active) VALUES
--     ('US Domestic', ARRAY[1], true),
--     ('India Domestic', ARRAY[2], true),
--     ('International', ARRAY[1,2,3], true);

--     INSERT INTO shipping_methods (name, zone_id, calculation_type, base_cost, currency_id, estimated_days_min, estimated_days_max, is_active) VALUES
--     ('Standard Shipping', 1, 'fixed', 5.99, 1, 3, 7, true),
--     ('Express Shipping', 1, 'fixed', 15.99, 1, 1, 2, true),
--     ('Free Shipping', 2, 'free', 0.00, 3, 5, 10, true);

--     INSERT INTO promotions (name, slug, type, value, currency_id, start_date, end_date, minimum_order_amount, status) VALUES
--     ('Welcome 10%', 'welcome-10', 'PERCENTAGE_ORDER', 10.00, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 50.00, 'active'),
--     ('Free Shipping Over $100', 'free-ship-100', 'FREE_SHIPPING', 0.00, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 100.00, 'active');:`, 
 
-- INSERT INTO product_inventory (product_id, combination_id, warehouse_id, quantity, reserved_quantity, low_stock_threshold) VALUES
-- (1, 1, 1, 15, 2, 3),
-- (1, 2, 1, 12, 1, 3),
-- (1, 3, 1, 8, 0, 2),
-- (1, 5, 1, 12, 1, 3),
-- (1, 6, 1, 10, 0, 3),
-- (1, 8, 1, 8, 1, 2),
-- (1, 10, 1, 10, 2, 3),
-- (2, 11, 2, 25, 3, 5),
-- (2, 12, 2, 30, 5, 5),
-- (2, 13, 2, 35, 8, 5),
-- (2, 14, 2, 20, 2, 5),
-- (2, 15, 2, 20, 1, 5),
-- (2, 16, 2, 25, 4, 5),
-- (2, 17, 2, 28, 3, 5),
-- (2, 18, 2, 15, 2, 5),
-- (2, 19, 2, 18, 1, 5),
-- (2, 20, 2, 12, 0, 5),
-- (4, 21, 1, 15, 2, 3),
-- (4, 22, 1, 10, 1, 2),
-- (4, 23, 1, 5, 0, 1),
-- (5, 24, 2, 15, 1, 3),
-- (5, 25, 2, 20, 3, 5),
-- (5, 26, 2, 25, 5, 5),
-- (5, 27, 2, 22, 4, 5),
-- (5, 28, 2, 18, 2, 4);

-- INSERT INTO inventory_movements (inventory_id, movement_type, quantity, reference_type, reference_id, notes, unit_cost, total_cost) VALUES
-- (1, 'in', 17, 'purchase_order', 1001, 'Initial stock receipt', 750.00, 12750.00),
-- (2, 'in', 13, 'purchase_order', 1001, 'Initial stock receipt', 825.00, 10725.00),
-- (5, 'in', 13, 'purchase_order', 1001, 'Initial stock receipt', 750.00, 9750.00),
-- (1, 'out', 2, 'order', 1, 'Sold to customer', 750.00, 1500.00),
-- (2, 'out', 1, 'order', 2, 'Sold to customer', 825.00, 825.00),
-- (1, 'reserved', 2, 'order', 3, 'Reserved for pending order', 0, 0),
-- (5, 'reserved', 1, 'order', 4, 'Reserved for pending order', 0, 0);

-- INSERT INTO search_logs (user_id, session_id, query, results_count, filters_applied, sort_applied, clicked_product_ids, no_results) VALUES
-- (2, 'session_123', 'iPhone 15', 2, '{"brand": ["Apple"], "price_range": [800, 1200]}', 'price_asc', ARRAY[1, 3], false),
-- (4, 'session_456', 'Nike shoes', 1, '{"category": ["shoes"], "size": ["9", "10"]}', 'popularity', ARRAY[5], false),
-- (NULL, 'session_789', 'laptop MacBook', 1, '{}', 'newest', ARRAY[4], false),
-- (2, 'session_123', 'wireless headphones', 0, '{"brand": ["Apple", "Sony"]}', 'price_desc', **ARRAY[]::integer[]**, true),
-- (4, 'session_456', 't-shirt cotton', 1, '{"material": ["cotton"]}', 'price_asc', ARRAY[2], false);

-- UPDATE products SET stock_quantity =
--   (SELECT COALESCE(SUM(pi.quantity), 0)
--  FROM product_inventory pi
--  WHERE pi.product_id = products.id)
-- WHERE id IN (1, 2, 4, 5);

-- UPDATE product_inventory SET quantity = 30, low_stock_threshold = 5 WHERE product_id = 3;

-- UPDATE products SET view_count = (
--   SELECT COUNT(*) FROM product_views pv WHERE pv.product_id = products.id
-- ) WHERE id IN (1, 2, 3, 4, 5);

-- UPDATE products SET
--      avg_rating = (
--      SELECT ROUND(AVG(rating)::numeric, 2)
--      FROM product_reviews pr
--     WHERE pr.product_id = products.id AND pr.is_approved = true
--     ),
--      total_reviews = (
--      SELECT COUNT(*)
--      FROM product_reviews pr
--      WHERE pr.product_id = products.id AND pr.is_approved = true
--      )
-- WHERE id IN (1, 2, 3, 4, 5);

-- INSERT INTO product_translations (product_id, language_id, name, slug, description, short_description, meta_title, meta_description, search_keywords, tags) VALUES
-- (1, 2, 'iPhone 15 Pro', 'iphone-15-pro-es',
-- '<p>El iPhone 15 Pro presenta un diseño de titanio con botón de acción y USB-C.</p>',
-- 'Último iPhone con diseño de titanio y chip A17 Pro',
-- 'iPhone 15 Pro - Último smartphone de Apple',
-- 'Compra iPhone 15 Pro con diseño de titanio, chip A17 Pro y sistema de cámara avanzado',
-- ARRAY['iphone', 'apple', 'smartphone', 'a17 pro', 'titanio'],
-- ARRAY['smartphone', 'premium', 'apple', 'nuevo']),
-- (2, 2, 'Camiseta Nike Dri-FIT', 'camiseta-nike-dri-fit',
-- '<p>Mantente fresco y cómodo con la tecnología Nike Dri-FIT.</p>',
-- 'Camiseta que absorbe la humedad para un estilo de vida activo',
-- 'Camiseta Nike Dri-FIT - Ropa Deportiva',
-- 'Camiseta cómoda Nike Dri-FIT con tecnología que absorbe la humedad',
-- ARRAY['nike', 'camiseta', 'dri-fit', 'atlético', 'poliéster'],
-- ARRAY['deportiva', 'rebaja', 'verano']);

--     INSERT INTO category_translations (category_id, language_id, name, description, slug) VALUES
--     (1, 2, 'Electrónicos', 'Dispositivos electrónicos y accesorios', 'electronicos'),
--     (2, 2, 'Moda', 'Ropa y accesorios de moda', 'moda'),
--     (3, 2, 'Teléfonos Inteligentes', 'Teléfonos móviles y smartphones', 'telefonos-inteligentes'),
--     (4, 2, 'Portátiles', 'Computadoras portátiles', 'portatiles'),
--     (5, 2, 'Ropa Masculina', 'Ropa para hombres', 'ropa-masculina');

--     INSERT INTO brand_translations (brand_id, language_id, name, description, slug) VALUES
--     (1, 2, 'Apple', 'Marca de tecnología premium', 'apple'),
--     (2, 2, 'Samsung', 'Empresa global de electrónicos', 'samsung'),
--     (3, 2, 'Nike', 'Marca de deportes y estilo de vida', 'nike'),
--     (4, 2, 'Dell', 'Empresa de tecnología informática', 'dell');

--     INSERT INTO product_collections (name, slug, description, type, conditions, sort_method, is_featured, is_active) VALUES
--     ('Best Sellers', 'best-sellers', 'Our most popular products', 'smart', '{"is_bestseller": true}', 'best_selling', true, true),
--     ('New Arrivals', 'new-arrivals', 'Latest products in our store', 'smart', '{"is_new_arrival": true}', 'newest', true, true),
--     ('Sale Items', 'sale-items', 'Products currently on sale', 'smart', '{"is_on_sale": true}', 'price_desc', false, true),
--     ('Premium Collection', 'premium-collection', 'Hand-picked premium products', 'manual', '{}', 'manual', true, true),
--     ('Tech Essentials', 'tech-essentials', 'Must-have technology products', 'manual', '{}', 'manual', false, true);

--     INSERT INTO collection_products (collection_id, product_id, sort_order, is_featured) VALUES
--     (1, 1, 1, true),
--     (1, 3, 2, false),
--     (1, 5, 3, false),
--     (2, 1, 1, true),
--     (2, 2, 2, false),
--     (3, 2, 1, true),
--     (4, 1, 1, true),
--     (4, 4, 2, true),
--     (4, 3, 3, false),
--     (5, 1, 1, true),
--     (5, 3, 2, false),
--     (5, 4, 3, false);

--     INSERT INTO product_cross_sells (product_id, cross_sell_product_id, type, sort_order) VALUES
--     (1, 4, 'upsell', 1),
--     (1, 3, 'cross_sell', 1),
--     (4, 1, 'cross_sell', 1),
--     (3, 1, 'cross_sell', 1),
--     (2, 5, 'frequently_bought', 1),
--     (5, 2, 'frequently_bought', 1);

--     INSERT INTO product_bundles (name, slug, description, bundle_type, discount_type, discount_value, min_items, is_active) VALUES
--     ('Apple Ecosystem Bundle', 'apple-ecosystem', 'iPhone + MacBook combo deal', 'fixed', 'percentage', 5.00, 2, true),
--     ('Nike Athletic Set', 'nike-athletic-set', 'Complete athletic wear bundle', 'fixed', 'fixed', 25.00, 2, true),
--     ('Tech Starter Pack', 'tech-starter-pack', 'Essential tech products for beginners', 'mix_match', 'percentage', 10.00, 2, true);

--     INSERT INTO bundle_products (bundle_id, product_id, quantity, is_required, discount_percentage, sort_order) VALUES
--     (1, 1, 1, true, 0, 1),
--     (1, 4, 1, true, 0, 2),
--     (2, 2, 1, true, 0, 1),
--     (2, 5, 1, true, 0, 2),
--     (3, 1, 1, false, 0, 1),
--     (3, 3, 1, false, 0, 2),
--     (3, 4, 1, false, 0, 3);

--     INSERT INTO product_questions (product_id, user_id, question, answer, answered_by, answered_at, is_public, helpful_votes) VALUES
--     (1, 2, 'Does this iPhone come with a charger?', 'Yes, it comes with a USB-C to Lightning cable but no power adapter.', 3, CURRENT_TIMESTAMP - INTERVAL '2 days', true, 5),
--     (1, 4, 'What is the battery life like?', 'The iPhone 15 Pro offers up to 23 hours of video playback.', 1, CURRENT_TIMESTAMP - INTERVAL '1 day', true, 3),
--     (2, 2, 'Is this shirt suitable for running?', 'Yes, the Dri-FIT technology makes it perfect for running and other athletic activities.', 4, CURRENT_TIMESTAMP - INTERVAL '3 hours', true, 2),
--     (4, 2, 'Can I upgrade the RAM later?', 'No, the RAM is soldered and cannot be upgraded. Choose your configuration carefully.', 1, CURRENT_TIMESTAMP - INTERVAL '1 day', true, 8),
--     (5, 4, 'Do these run true to size?', NULL, NULL, NULL, true, 0);

--     INSERT INTO user_addresses (user_id, type, first_name, last_name, address_line1, city_name, country_id, postal_code, is_default) VALUES
--     (2, 'both', 'John', 'Doe', '789 Main Street', 'Los Angeles', 1, '90210', true),
--     (3, 'both', 'Jane', 'Smith', '321 Oak Avenue', 'New York City', 1, '10001', true),
--     (4, 'both', 'Raj', 'Patel', '654 Commerce Road', 'Ahmedabad', 2, '380001', true);

--     INSERT INTO shipping_zones (name, countries, is_active) VALUES
--     ('US Domestic', ARRAY[1], true),
--     ('India Domestic', ARRAY[2], true),
--     ('International', ARRAY[1,2,3], true);

--     INSERT INTO shipping_methods (name, zone_id, calculation_type, base_cost, currency_id, estimated_days_min, estimated_days_max, is_active) VALUES
--     ('Standard Shipping', 1, 'fixed', 5.99, 1, 3, 7, true),
--     ('Express Shipping', 1, 'fixed', 15.99, 1, 1, 2, true),
--     ('Free Shipping', 2, 'free', 0.00, 3, 5, 10, true);

--     INSERT INTO promotions (name, slug, type, value, currency_id, start_date, end_date, minimum_order_amount, status) VALUES
--     ('Welcome 10%', 'welcome-10', 'PERCENTAGE_ORDER', 10.00, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 50.00, 'active'),
--     ('Free Shipping Over $100', 'free-ship-100', 'FREE_SHIPPING', 0.00, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 100.00, 'active');)



--============================================== 08-09-2025 ==================================================
-- ====================== DO NOT USE THIS IN PRODUCTION =================================
-- INSERT INTO payment_methods (name, code, type, provider, supported_countries, supported_currencies, configuration, is_active, sort_order) VALUES
-- ('Credit/Debit Card (Stripe)', 'stripe_card', 'card', 'Stripe', '{1,2,3}', '{1,2,3}', '{"public_key": "pk_test_...", "secret_key": "sk_test_...", "webhook_secret": "whsec_..."}', true, 1),
-- ('UPI/Cards (Razorpay)', 'razorpay', 'digital_wallet', 'Razorpay', '{1}', '{1}', '{"key_id": "rzp_test_...", "key_secret": "...", "webhook_secret": "..."}', true, 2),
-- ('Cash on Delivery', 'cod', 'cash', 'Manual', '{1,2,3}', '{1,2,3}', '{"max_amount": 50000}', false, 3);
--  ====================== DO NOT USE THIS IN PRODUCTION =================================

-- INSERT INTO languages (code, name, is_default, is_active) VALUES 
-- ('en', 'English', true, true),
-- ('hi', 'Hindi', false, true)
-- ON CONFLICT (code) DO NOTHING;


-- INSERT INTO shipping_providers (name, code, api_endpoint, supported_countries, is_active) VALUES
-- ('Delivery', 'delivery', 'https://api.delivery.com/v1/', '{1,2,3}', true),
-- ('ShipRocket', 'shiprocket', 'https://apiv2.shiprocket.in/v1/external/', '{1}', false);


-- INSERT INTO integrations (name, type, provider, configuration, credentials, is_active) VALUES
-- ('Stripe Payment', 'payment', 'stripe', '{"webhook_endpoint": "/webhooks/stripe"}', '{"api_key": "sk_test_...", "webhook_secret": "whsec_..."}', true),
-- ('Razorpay Payment', 'payment', 'razorpay', '{"webhook_endpoint": "/webhooks/razorpay"}', '{"key_id": "rzp_test_...", "key_secret": "..."}', true),
-- ('SMS Service', 'notification', 'twilio', '{}', '{"account_sid": "AC...", "auth_token": "..."}', true);

-- API Keys table data  
-- INSERT INTO api_keys (name, key_hash, prefix, permissions, rate_limit, is_active) VALUES
-- ('Internal Service', 'hashed_key_here', 'sk_int', '["orders.read", "orders.write", "products.read"]', 10000, true);

 
-- INSERT INTO payment_methods (name, code, type, provider, is_active, sort_order) VALUES
-- ('Credit Card', 'stripe_card', 'card', 'stripe', true, 1),
-- ('Razorpay', 'razorpay', 'digital_wallet', 'razorpay', true, 2),
-- ('Cash on Delivery', 'cod', 'cash', null, true, 3);
--============================================== 08-09-2025 ==================================================
