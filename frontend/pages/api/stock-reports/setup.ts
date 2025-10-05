import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { sendSuccess, sendError, validateMethod } from '../../../lib/api-response';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!validateMethod(req, res, ['POST', 'GET'])) {
    return;
  }

  try {
    console.log('🔧 Setting up stock reports database...');

    if (!supabaseUrl || !supabaseKey) {
      return sendError(res, 'Supabase configuration missing', 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return sendError(res, `Database connection failed: ${testError.message}`, 500);
    }

    console.log('✅ Database connection successful');

    // Create tables using raw SQL
    const createTablesSQL = `
      -- Companies table
      CREATE TABLE IF NOT EXISTS companies (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Stock reports table
      CREATE TABLE IF NOT EXISTS stock_reports (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id),
          report_title VARCHAR(255) NOT NULL,
          report_period_start DATE,
          report_period_end DATE,
          date_range VARCHAR(100),
          total_items INTEGER DEFAULT 0,
          total_opening_qty INTEGER DEFAULT 0,
          total_purchase_qty INTEGER DEFAULT 0,
          total_sales_qty INTEGER DEFAULT 0,
          total_closing_qty INTEGER DEFAULT 0,
          total_sales_value DECIMAL(15,2) DEFAULT 0,
          total_closing_value DECIMAL(15,2) DEFAULT 0,
          original_filename VARCHAR(255),
          file_size INTEGER,
          processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          raw_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Stock items table
      CREATE TABLE IF NOT EXISTS stock_items (
          id SERIAL PRIMARY KEY,
          report_id INTEGER REFERENCES stock_reports(id) ON DELETE CASCADE,
          item_name VARCHAR(255) NOT NULL,
          item_name_clean VARCHAR(255),
          brand VARCHAR(100),
          opening_qty INTEGER DEFAULT 0,
          purchase_qty INTEGER DEFAULT 0,
          purchase_free INTEGER DEFAULT 0,
          purchase_return_qty INTEGER DEFAULT 0,
          sales_qty INTEGER DEFAULT 0,
          sales_value DECIMAL(12,2) DEFAULT 0,
          sales_return_qty INTEGER DEFAULT 0,
          sales_free INTEGER DEFAULT 0,
          closing_qty INTEGER DEFAULT 0,
          closing_value DECIMAL(12,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Brand performance table
      CREATE TABLE IF NOT EXISTS brand_performance (
          id SERIAL PRIMARY KEY,
          report_id INTEGER REFERENCES stock_reports(id) ON DELETE CASCADE,
          brand_name VARCHAR(100) NOT NULL,
          item_count INTEGER DEFAULT 0,
          total_sales_qty INTEGER DEFAULT 0,
          total_sales_value DECIMAL(15,2) DEFAULT 0,
          total_closing_value DECIMAL(15,2) DEFAULT 0,
          avg_price_per_unit DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_stock_reports_company_id ON stock_reports(company_id);
      CREATE INDEX IF NOT EXISTS idx_stock_reports_processed_at ON stock_reports(processed_at);
      CREATE INDEX IF NOT EXISTS idx_stock_items_report_id ON stock_items(report_id);
      CREATE INDEX IF NOT EXISTS idx_stock_items_brand ON stock_items(brand);
      CREATE INDEX IF NOT EXISTS idx_brand_performance_report_id ON brand_performance(report_id);
    `;

    // Execute the SQL
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTablesSQL });

    if (sqlError) {
      console.error('❌ Error creating tables:', sqlError);
      // Try alternative approach - create tables one by one
      await createTablesIndividually(supabase);
    } else {
      console.log('✅ Tables created successfully');
    }

    // Test if tables exist by trying to query them
    const { data: companiesTest, error: companiesError } = await supabase
      .from('companies')
      .select('count')
      .limit(1);

    const { data: reportsTest, error: reportsError } = await supabase
      .from('stock_reports')
      .select('count')
      .limit(1);

    return sendSuccess(res, {
      message: 'Database setup completed',
      status: {
        connection: 'OK',
        companiesTable: companiesError ? 'ERROR' : 'OK',
        reportsTable: reportsError ? 'ERROR' : 'OK',
        companiesError: companiesError?.message,
        reportsError: reportsError?.message
      }
    });

  } catch (error: any) {
    console.error('❌ Setup error:', error);
    return sendError(res, `Setup failed: ${error.message}`, 500);
  }
}

async function createTablesIndividually(supabase: any) {
  console.log('🔧 Creating tables individually...');

  // Create companies table
  try {
    await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    });
    console.log('✅ Companies table created');
  } catch (error) {
    console.error('❌ Error creating companies table:', error);
  }

  // Create stock_reports table
  try {
    await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS stock_reports (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id),
        report_title VARCHAR(255) NOT NULL,
        date_range VARCHAR(100),
        total_items INTEGER DEFAULT 0,
        total_sales_value DECIMAL(15,2) DEFAULT 0,
        total_closing_value DECIMAL(15,2) DEFAULT 0,
        original_filename VARCHAR(255),
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    });
    console.log('✅ Stock reports table created');
  } catch (error) {
    console.error('❌ Error creating stock_reports table:', error);
  }
}