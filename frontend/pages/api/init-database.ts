import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { sendSuccess, sendError, validateMethod } from '../../lib/api-response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!validateMethod(req, res, ['POST'])) {
    return;
  }

  try {
    console.log('🔧 Initializing database tables...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return sendError(res, 'Supabase configuration missing', 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to create companies table using direct SQL (this might not work on Supabase)
    // Instead, let's try to create the table by attempting to insert and catching errors
    let companiesError = null;
    try {
      // Try to query the companies table to see if it exists
      const { data: testCompanies, error: testError } = await supabase
        .from('companies')
        .select('id')
        .limit(1);
      
      if (testError && testError.message.includes('does not exist')) {
        console.log('⚠️ Companies table does not exist - this is expected on first run');
        companiesError = testError;
      }
    } catch (error) {
      console.log('⚠️ Companies table check failed:', error);
      companiesError = error;
    }

    if (companiesError) {
      console.error('❌ Error creating companies table:', companiesError);
    } else {
      console.log('✅ Companies table created/verified');
    }

    // Create stock_reports table
    const { error: reportsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (reportsError) {
      console.error('❌ Error creating stock_reports table:', reportsError);
    } else {
      console.log('✅ Stock reports table created/verified');
    }

    // Create stock_items table
    const { error: itemsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (itemsError) {
      console.error('❌ Error creating stock_items table:', itemsError);
    } else {
      console.log('✅ Stock items table created/verified');
    }

    // Create brand_performance table
    const { error: brandError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (brandError) {
      console.error('❌ Error creating brand_performance table:', brandError);
    } else {
      console.log('✅ Brand performance table created/verified');
    }

    // Test if tables exist by querying them
    const { data: testCompanies, error: testCompaniesError } = await supabase
      .from('companies')
      .select('count')
      .limit(1);

    const { data: testReports, error: testReportsError } = await supabase
      .from('stock_reports')
      .select('count')
      .limit(1);

    return sendSuccess(res, {
      message: 'Database initialization completed',
      status: {
        companiesTable: testCompaniesError ? 'ERROR' : 'OK',
        reportsTable: testReportsError ? 'ERROR' : 'OK',
        errors: {
          companies: companiesError?.message,
          reports: reportsError?.message,
          items: itemsError?.message,
          brand: brandError?.message,
          testCompanies: testCompaniesError?.message,
          testReports: testReportsError?.message
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Database initialization error:', error);
    return sendError(res, `Initialization failed: ${error.message}`, 500);
  }
}