import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

// Create and export the pool instance
export const pool = new Pool({
  connectionString,
  max: 20, // Maximum number of clients in the pool
  // idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  // connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  // maxUses: 7500, // Close a connection after it has been used this many times
});

// Handle pool errors
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Basic query functions for simple operations
export async function SelectQuery<T extends QueryResultRow>(
  text: string,
  params?: any[]
): Promise<T[]> {
  try {
    const result = await pool.query<T>(text, params);
    return result.rows;
  } catch (error) {
    console.error('SelectQuery error:', { text, params, error });
    throw error;
  }
}

export async function InsertQuery(
  text: string,
  params?: any[]
): Promise<QueryResult> {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('InsertQuery error:', { text, params, error });
    throw error;
  }
}

export async function UpdateQuery(
  text: string,
  params?: any[]
): Promise<QueryResult> {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('UpdateQuery error:', { text, params, error });
    throw error;
  }
}

export async function DeleteQuery(
  text: string,
  params?: any[]
): Promise<QueryResult> {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('DeleteQuery error:', { text, params, error });
    throw error;
  }
}

export async function ExecuteStoredProcedure<T extends QueryResultRow>(
  procedureName: string,
  params?: any[]
): Promise<T[]> {
  try {
    const placeholders = params?.map((_, i) => `$${i + 1}`).join(', ') || '';
    const result = await pool.query<T>(`CALL ${procedureName}(${placeholders})`, params);
    return result.rows;
  } catch (error) {
    console.error('ExecuteStoredProcedure error:', { procedureName, params, error });
    throw error;
  }
}

// Enhanced transaction support - useful for complex operations like in ProductsRepository
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback error:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

// Batch operations for better performance
export async function BatchInsert(
  tableName: string,
  columns: string[],
  values: any[][],
  onConflict?: string
): Promise<QueryResult> {
  if (!values.length) return { rows: [], rowCount: 0 } as QueryResult;

  const placeholders = values
    .map((row, i) =>
      `(${row.map((_, j) => `$${i * row.length + j + 1}`).join(', ')})`
    )
    .join(', ');

  const flatValues = values.flat();
  const conflictClause = onConflict ? ` ON CONFLICT ${onConflict}` : '';

  const query = `
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES ${placeholders}${conflictClause}
    RETURNING *
  `;

  try {
    return await pool.query(query, flatValues);
  } catch (error) {
    console.error('BatchInsert error:', { tableName, columns, error });
    throw error;
  }
}

// Batch update using CASE statements
export async function BatchUpdate(
  tableName: string,
  updates: Array<{ id: number; data: Record<string, any> }>,
  idColumn: string = 'id'
): Promise<QueryResult> {
  if (!updates.length) return { rows: [], rowCount: 0 } as QueryResult;

  const allColumns = new Set<string>();
  updates.forEach(update => {
    Object.keys(update.data).forEach(col => allColumns.add(col));
  });

  const columns = Array.from(allColumns);
  const ids = updates.map(u => u.id);

  const setClauses = columns.map((col, colIndex) => {
    const caseStatements = updates
      .map((update, updateIndex) => {
        const value = update.data[col];
        if (value !== undefined) {
          return `WHEN $${updateIndex + 1} THEN $${ids.length + colIndex * updates.length + updateIndex + 1}`;
        }
        return null;
      })
      .filter(Boolean)
      .join(' ');

    return caseStatements ?
      `${col} = CASE ${idColumn} ${caseStatements} ELSE ${col} END` :
      null;
  }).filter(Boolean);

  if (!setClauses.length) return { rows: [], rowCount: 0 } as QueryResult;

  const params = [
    ...ids,
    ...columns.flatMap(col =>
      updates.map(update => update.data[col])
    ).filter(val => val !== undefined)
  ];

  const query = `
    UPDATE ${tableName}
    SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE ${idColumn} = ANY($1)
    RETURNING *
  `;

  try {
    return await pool.query(query, [ids, ...params.slice(ids.length)]);
  } catch (error) {
    console.error('BatchUpdate error:', { tableName, error });
    throw error;
  }
}

// Paginated query helper
export async function PaginatedQuery<T extends QueryResultRow>(
  baseQuery: string,
  countQuery: string,
  params: any[],
  page: number = 1,
  limit: number = 10
): Promise<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}> {
  const offset = (page - 1) * limit;

  try {
    // Execute count and data queries in parallel
    const [countResult, dataResult] = await Promise.all([
      pool.query<{ total: string }>(countQuery, params),
      pool.query<T>(`${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit);

    return {
      items: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    };
  } catch (error) {
    console.error('PaginatedQuery error:', { baseQuery, countQuery, params, error });
    throw error;
  }
}

// Upsert helper (INSERT ... ON CONFLICT DO UPDATE)
export async function UpsertQuery(
  tableName: string,
  data: Record<string, any>,
  conflictColumns: string[],
  updateColumns?: string[]
): Promise<QueryResult> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`);

  const conflictClause = conflictColumns.join(', ');
  const updateCols = updateColumns || columns.filter(col => !conflictColumns.includes(col));
  const updateClause = updateCols
    .map(col => `${col} = EXCLUDED.${col}`)
    .join(', ');

  const query = `
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES (${placeholders.join(', ')})
    ON CONFLICT (${conflictClause})
    DO UPDATE SET ${updateClause}, updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  try {
    return await pool.query(query, values);
  } catch (error) {
    console.error('UpsertQuery error:', { tableName, data, error });
    throw error;
  }
}

// Bulk upsert for multiple records
export async function BulkUpsert(
  tableName: string,
  records: Record<string, any>[],
  conflictColumns: string[],
  updateColumns?: string[]
): Promise<QueryResult> {
  if (!records.length) return { rows: [], rowCount: 0 } as QueryResult;

  try {
    // Separate records with and without IDs
    const recordsWithIds = records.filter(r => r.id !== undefined && r.id !== null);
    const recordsWithoutIds = records.filter(r => r.id === undefined || r.id === null);

    let result: QueryResult = { rows: [], rowCount: 0 } as QueryResult;

    // Handle records without IDs (pure inserts with conflict resolution)
    if (recordsWithoutIds.length > 0) {
      const insertResult = await handleInsertRecords(tableName, recordsWithoutIds, conflictColumns, updateColumns);
      result.rows.push(...insertResult.rows);
      result.rowCount = (result.rowCount || 0) + (insertResult.rowCount || 0);
    }

    // Handle records with IDs (updates or inserts)
    if (recordsWithIds.length > 0) {
      const upsertResult = await handleUpsertRecords(tableName, recordsWithIds, conflictColumns, updateColumns);
      result.rows.push(...upsertResult.rows);
      result.rowCount = (result.rowCount || 0) + (upsertResult.rowCount || 0);
    }

    return result;

  } catch (error) {
    console.error('BulkUpsert detailed error:', {
      tableName,
      recordCount: records.length,
      conflictColumns,
      updateColumns,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function handleInsertRecords(
  tableName: string,
  records: Record<string, any>[],
  conflictColumns: string[],
  updateColumns?: string[]
): Promise<QueryResult> {
  const allColumns = new Set<string>();
  records.forEach(record => {
    Object.keys(record).forEach(col => allColumns.add(col));
  });

  const columns = Array.from(allColumns);
  const values = records.flatMap(record =>
    columns.map(col => record[col] ?? null)
  );

  const placeholders = records
    .map((_, i) =>
      `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`
    )
    .join(', ');

  const conflictClause = conflictColumns.join(', ');
  const updateCols = updateColumns || columns.filter(col => !conflictColumns.includes(col));
  const updateClause = updateCols
    .map(col => `${col} = EXCLUDED.${col}`)
    .join(', ');

  const query = `
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES ${placeholders}
    ON CONFLICT (${conflictClause})
    DO UPDATE SET ${updateClause}, updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  console.log('Insert Query:', query);
  console.log('Insert Values:', values);

  return await pool.query(query, values);
}

// Handle records with IDs (individual upserts)
async function handleUpsertRecords(
  tableName: string,
  records: Record<string, any>[],
  conflictColumns: string[],
  updateColumns?: string[]
): Promise<QueryResult> {
  const allResults: any[] = [];
  let totalRowCount = 0;

  for (const record of records) {
    try {
      // Try to update first
      const updateColumns_filtered = updateColumns || Object.keys(record).filter(col => col !== 'id' && !conflictColumns.includes(col));

      if (updateColumns_filtered.length > 0) {
        const setClauses = updateColumns_filtered.map((col, i) => `${col} = $${i + 2}`).join(', ');
        const updateQuery = `
          UPDATE ${tableName} 
          SET ${setClauses}, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $1 
          RETURNING *
        `;

        const updateValues = [record.id, ...updateColumns_filtered.map(col => record[col] ?? null)];
        const updateResult = await pool.query(updateQuery, updateValues);

        if (updateResult.rowCount > 0) {
          allResults.push(...updateResult.rows);
          totalRowCount += updateResult.rowCount;
          continue;
        }
      }

      // If update didn't affect any rows, try insert
      const columns = Object.keys(record);
      const values = columns.map(col => record[col] ?? null);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

      const insertQuery = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (id) DO NOTHING
        RETURNING *
      `;

      const insertResult = await pool.query(insertQuery, values);
      allResults.push(...insertResult.rows);
      totalRowCount += insertResult.rowCount || 0;

    } catch (recordError) {
      console.error(`Error processing record with ID ${record.id}:`, recordError);
      throw recordError;
    }
  }

  return { rows: allResults, rowCount: totalRowCount } as QueryResult;
}
export async function BulkUpsertWithClient(
  client: PoolClient,
  tableName: string,
  records: Record<string, any>[],
  conflictColumns: string[],
  updateColumns?: string[],
): Promise<QueryResult> {
  if (!records.length) return { rows: [], rowCount: 0 } as QueryResult;

  /* ---------- stable column order ---------- */
  const columns = Object.keys(records[0]);          // use first record only

  /* verify shape */
  records.forEach((r, i) => {
    const missing = columns.filter(c => !(c in r));
    if (missing.length) {
      throw new Error(`record #${i} missing fields: ${missing.join(', ')}`);
    }
  });

  /* ---------- build VALUES & parameters ---------- */
  const values: any[] = [];
  const rowSql: string[] = [];

  records.forEach((rec, rowIdx) => {
    const placeholders = columns.map(
      (_c, colIdx) => `$${rowIdx * columns.length + colIdx + 1}`,
    );
    rowSql.push(`(${placeholders.join(',')})`);
    columns.forEach(col => values.push(rec[col] ?? null));
  });

  /* ---------- update / where clause ---------- */
  const updCols = updateColumns ?? columns.filter(c => !conflictColumns.includes(c));

  const setSql = [
    ...updCols.map(c => `${c}=EXCLUDED.${c}`),
    'updated_at=CURRENT_TIMESTAMP',
  ].join(', ');

  const whereSql = updCols
    .map(c => `${tableName}.${c} IS DISTINCT FROM EXCLUDED.${c}`)
    .join(' OR ');

  /* ---------- final SQL text ---------- */
  const sql = `
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES ${rowSql.join(', ')}
    ON CONFLICT (${conflictColumns.join(', ')})
    DO UPDATE SET ${setSql}
    WHERE ${whereSql};
  `;

  return client.query(sql, values);
}
/* remember what is already prepared */
BulkUpsert.cache = new Set<string>();

/* naive type inference – tailor to your schema if needed */
function inferPgType(col: string): string {
  if (col.endsWith('_id')) return 'int';
  if (col === 'price' || col.endsWith('_price') || col.endsWith('_percentage')) return 'numeric';
  if (col.startsWith('is_')) return 'boolean';
  if (col.endsWith('_at') || col.startsWith('effective_')) return 'timestamptz';
  return 'text';                        // fallback
}


// Search with full-text search support
export async function FullTextSearch<T extends QueryResultRow>(
  tableName: string,
  searchColumns: string[],
  searchTerm: string,
  additionalWhere?: string,
  additionalParams?: any[],
  orderBy?: string,
  limit?: number,
  offset?: number
): Promise<T[]> {
  const searchVector = searchColumns.map(col => `coalesce(${col}, '')`).join(` || ' ' || `);
  const tsQuery = `plainto_tsquery('english', $1)`;

  let params = [searchTerm];
  let whereClause = `to_tsvector('english', ${searchVector}) @@ ${tsQuery}`;

  if (additionalWhere) {
    whereClause += ` AND ${additionalWhere}`;
    if (additionalParams) {
      params = [...params, ...additionalParams];
    }
  }

  let query = `
    SELECT *, ts_rank(to_tsvector('english', ${searchVector}), ${tsQuery}) as search_rank
    FROM ${tableName}
    WHERE ${whereClause}
  `;

  if (orderBy) {
    query += ` ORDER BY ${orderBy}`;
  } else {
    query += ` ORDER BY search_rank DESC`;
  }

  if (limit) {
    query += ` LIMIT ${limit}`;
  }

  if (offset) {
    query += ` OFFSET ${offset}`;
  }

  try {
    const result = await pool.query<T>(query, params);
    return result.rows;
  } catch (error) {
    console.error('FullTextSearch error:', { tableName, searchTerm, error });
    throw error;
  }
}

// Health check for database connection
export async function healthCheck(): Promise<{ healthy: boolean; message: string }> {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    return {
      healthy: true,
      message: `Database connected successfully at ${result.rows[0].current_time}`
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Database connection failed: ${error}`
    };
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('Database pool has been closed.');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
}

// Export pool for advanced usage (like in ProductsRepository)
export { pool as pgPool };

// Query builder helpers for dynamic WHERE clauses
export class QueryBuilder {
  private conditions: string[] = [];
  private params: any[] = [];
  private paramIndex = 1;

  addCondition(condition: string, ...values: any[]): this {
    if (values.length === 0) {
      // No parameters, add condition as-is
      this.conditions.push(condition);
      return this;
    }

    // Filter out undefined and null values
    const validValues = values.filter(value => value !== undefined && value !== null);
    
    if (validValues.length === 0) {
      return this;
    }

    // Replace all ? placeholders with $n parameters
    let updatedCondition = condition;
    let replacementCount = 0;
    
    for (const value of validValues) {
      updatedCondition = updatedCondition.replace('?', `$${this.paramIndex + replacementCount}`);
      replacementCount++;
    }
    
    this.conditions.push(updatedCondition);
    this.params.push(...validValues);
    this.paramIndex += validValues.length;
    
    return this;
  }

  addInCondition(column: string, values: any[]): this {
    if (values && values.length > 0) {
      this.conditions.push(`${column} = ANY($${this.paramIndex})`);
      this.params.push(values);
      this.paramIndex++;
    }
    return this;
  }

  addRangeCondition(column: string, min?: any, max?: any): this {
    if (min !== undefined && min !== null) {
      this.addCondition(`${column} >= ?`, min);
    }
    if (max !== undefined && max !== null) {
      this.addCondition(`${column} <= ?`, max);
    }
    return this;
  }

  addLikeCondition(column: string, value?: string): this {
    if (value && value.trim()) {
      this.addCondition(`${column} ILIKE ?`, `%${value}%`);
    }
    return this;
  }

  build(): { whereClause: string; params: any[] } {
    return {
      whereClause: this.conditions.length > 0 ? this.conditions.join(' AND ') : '1=1',
      params: this.params
    };
  }

  reset(): this {
    this.conditions = [];
    this.params = [];
    this.paramIndex = 1;
    return this;
  }
}