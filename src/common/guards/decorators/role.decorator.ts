// src/common/decorators/role.decorator.ts
import { SetMetadata } from '@nestjs/common';

export interface RoleMeta {
  role?: string;
  permissions?: string[];
}

export const Roles = (meta: RoleMeta) => SetMetadata('role', meta.role || '');
export const Permissions = (permissions: string[]) =>
  SetMetadata('permissions', permissions);
