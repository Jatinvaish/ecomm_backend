// repositories/payment.repository.ts
import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { InsertQuery, SelectQuery, UpdateQuery } from 'src/db/postgres.client';

@Injectable()
export class PaymentRepository {
  async createPaymentTransaction(transaction_data: any, client?: PoolClient) {
    const query = `
      INSERT INTO payment_transactions (
        order_id, user_id, payment_method_id, amount, currency_id, 
        status, transaction_type, provider_payment_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      transaction_data?.order_id,
      transaction_data?.user_id,
      transaction_data?.payment_method_id,
      transaction_data?.amount,
      transaction_data?.currency_id || 3,
      transaction_data?.status,
      transaction_data?.transaction_type || 'payment',
      transaction_data?.provider_payment_id
    ];

    if (client) {
      const result = await client.query(query, values);
      return result.rows[0];
    } else {
      const result = await InsertQuery(query, values);
      return result.rows[0];
    }
  }

  async getPaymentMethods() {
    const query = `
      SELECT * FROM payment_methods 
      WHERE is_active = true 
      ORDER BY sort_order ASC
    `;
    return await SelectQuery(query);
  }

  async getPaymentMethodById(payment_method_id: number) {
    const query = `
      SELECT * FROM payment_methods 
      WHERE id = $1 AND is_active = true
    `;
    const result = await SelectQuery(query, [payment_method_id]);
    return result[0];
  }

  async getPaymentMethodByCode(code: string) {
    const query = `
      SELECT * FROM payment_methods 
      WHERE code = $1 AND is_active = true
    `;
    const result = await SelectQuery(query, [code]);
    return result[0];
  }

  async updatePaymentTransactionStatus(transaction_id: number, status: string, gateway_response?: any) {
    const query = `
      UPDATE payment_transactions 
      SET status = $1, gateway_response = $2, processed_at = NOW(), updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await UpdateQuery(query, [
      status,
      gateway_response ? JSON.stringify(gateway_response) : null,
      transaction_id
    ]);
    return result.rows[0];
  }

  async findTransactionByProviderPaymentId(provider_payment_id: string) {
    const query = `
      SELECT pt.*, o.id as order_id, o.user_id
      FROM payment_transactions pt
      LEFT JOIN orders o ON pt.order_id = o.id
      WHERE pt.provider_payment_id = $1
    `;
    const result = await SelectQuery(query, [provider_payment_id]);
    return result[0];
  }
}
