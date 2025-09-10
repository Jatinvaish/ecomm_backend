// middleware/api-logging.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InsertQuery } from 'src/db/postgres.client';

@Injectable()
export class ApiLoggingMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const start_time = Date.now();

    res.on('finish', async () => {
      const response_time_ms = Date.now() - start_time;
      
      try {
        await this.logApiRequest({
          endpoint: req.path,
          method: req.method,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          request_headers: req.headers,
          request_body: req.body,
          response_status: res.statusCode,
          response_time_ms,
        });
      } catch (error) {
        console.error('Failed to log API request:', error);
      }
    });

    next();
  }

  private async logApiRequest(log_data: any) {
    const query = `
      INSERT INTO api_request_logs (
        endpoint, method, ip_address, user_agent, request_headers,
        request_body, response_status, response_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    
    await InsertQuery(query, [
      log_data.endpoint,
      log_data.method,
      log_data.ip_address,
      log_data.user_agent,
      JSON.stringify(log_data.request_headers),
      JSON.stringify(log_data.request_body),
      log_data.response_status,
      log_data.response_time_ms
    ]);
  }
}
