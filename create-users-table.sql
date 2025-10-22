-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'USER',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_reports table
CREATE TABLE IF NOT EXISTS stock_reports (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  report_title TEXT NOT NULL,
  report_period_start DATE,
  report_period_end DATE,
  date_range TEXT,
  total_items INTEGER DEFAULT 0,
  total_opening_qty INTEGER DEFAULT 0,
  total_purchase_qty INTEGER DEFAULT 0,
  total_sales_qty INTEGER DEFAULT 0,
  total_closing_qty INTEGER DEFAULT 0,
  total_sales_value DECIMAL(15,2) DEFAULT 0,
  total_closing_value DECIMAL(15,2) DEFAULT 0,
  original_filename TEXT,
  file_size INTEGER,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_items table
CREATE TABLE IF NOT EXISTS stock_items (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES stock_reports(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_name_clean TEXT,
  brand TEXT,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create brand_performance table
CREATE TABLE IF NOT EXISTS brand_performance (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES stock_reports(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  item_count INTEGER DEFAULT 0,
  total_sales_qty INTEGER DEFAULT 0,
  total_sales_value DECIMAL(15,2) DEFAULT 0,
  total_closing_value DECIMAL(15,2) DEFAULT 0,
  avg_price_per_unit DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);