export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum SyncAction {
  INDEX = 'index',
  DELETE = 'delete',
}

export enum SyncStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  OUT_OF_STOCK = 'out_of_stock'
}

export enum ProductVisibility {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  PASSWORD_PROTECTED = 'password_protected'
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  VIEW_360 = '360_view'
}

export enum AttributeType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  COLOR = 'color',
  IMAGE = 'image',
  SELECT = 'select',
  MULTISELECT = 'multiselect'
}

export enum TaxType {
  GST = 'GST',
  VAT = 'VAT',
  SALES_TAX = 'SALES_TAX',
  EXCISE = 'EXCISE',
  IMPORT_DUTY = 'IMPORT_DUTY',
  SERVICE_TAX = 'SERVICE_TAX'
}
