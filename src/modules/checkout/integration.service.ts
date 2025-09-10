// services/integration.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { SelectQuery } from 'src/db/postgres.client';

@Injectable()
export class IntegrationService {
  async getIntegrationCredentials(provider: string, type: string) {
    const query = `
      SELECT credentials, configuration 
      FROM integrations 
      WHERE provider = $1 AND type = $2 AND is_active = true
      LIMIT 1
    `;
    const result = await SelectQuery(query, [provider, type]);
    return result[0] || null;
  }

  async getPaymentConfig(provider: string) {
    return this.getIntegrationCredentials(provider, 'payment');
  }

  async getShippingConfig(provider: string) {
    return this.getIntegrationCredentials(provider, 'shipping');
  }
}
