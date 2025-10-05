-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Allow user registration" ON public.users
  FOR INSERT WITH CHECK (true);

-- Create policies for uploaded_files table
CREATE POLICY "Users can read own files" ON public.uploaded_files
  FOR SELECT USING (auth.uid()::text = uploaded_by_id);

CREATE POLICY "Users can upload files" ON public.uploaded_files
  FOR INSERT WITH CHECK (auth.uid()::text = uploaded_by_id);

-- Create policies for extracted_data table
CREATE POLICY "Users can read own extracted data" ON public.extracted_data
  FOR SELECT USING (auth.uid()::text = extracted_by_id);

CREATE POLICY "Users can create extracted data" ON public.extracted_data
  FOR INSERT WITH CHECK (auth.uid()::text = extracted_by_id);

-- Create policies for audit_logs table (admin only)
CREATE POLICY "Admin can read audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

CREATE POLICY "Allow audit log creation" ON public.audit_logs
  FOR INSERT WITH CHECK (true);
-- 
Stock Reports Database Schema for PDF Analysis
-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock reports table (main report metadata)
CREATE TABLE IF NOT EXISTS public.stock_reports (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id),
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

-- Stock items table (individual item data)
CREATE TABLE IF NOT EXISTS public.stock_items (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES public.stock_reports(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_name_clean VARCHAR(255),
    brand VARCHAR(100),
    
    -- Opening stock
    opening_qty INTEGER DEFAULT 0,
    
    -- Purchase data
    purchase_qty INTEGER DEFAULT 0,
    purchase_free INTEGER DEFAULT 0,
    purchase_return_qty INTEGER DEFAULT 0,
    
    -- Sales data
    sales_qty INTEGER DEFAULT 0,
    sales_value DECIMAL(12,2) DEFAULT 0,
    sales_return_qty INTEGER DEFAULT 0,
    sales_free INTEGER DEFAULT 0,
    
    -- Closing stock
    closing_qty INTEGER DEFAULT 0,
    closing_value DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Brand performance summary
CREATE TABLE IF NOT EXISTS public.brand_performance (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES public.stock_reports(id) ON DELETE CASCADE,
    brand_name VARCHAR(100) NOT NULL,
    item_count INTEGER DEFAULT 0,
    total_sales_qty INTEGER DEFAULT 0,
    total_sales_value DECIMAL(15,2) DEFAULT 0,
    total_closing_value DECIMAL(15,2) DEFAULT 0,
    avg_price_per_unit DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_reports_company_id ON public.stock_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_reports_processed_at ON public.stock_reports(processed_at);
CREATE INDEX IF NOT EXISTS idx_stock_items_report_id ON public.stock_items(report_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_brand ON public.stock_items(brand);
CREATE INDEX IF NOT EXISTS idx_brand_performance_report_id ON public.brand_performance(report_id);

-- Views for analytics
CREATE OR REPLACE VIEW public.stock_analytics_summary AS
SELECT 
    sr.id as report_id,
    c.name as company_name,
    sr.report_title,
    sr.date_range,
    sr.total_items,
    sr.total_sales_value,
    sr.total_closing_value,
    sr.processed_at,
    COUNT(si.id) as items_with_sales,
    AVG(CASE WHEN si.sales_qty > 0 THEN si.sales_value / si.sales_qty ELSE 0 END) as avg_item_price
FROM public.stock_reports sr
JOIN public.companies c ON sr.company_id = c.id
LEFT JOIN public.stock_items si ON sr.id = si.report_id
GROUP BY sr.id, c.name, sr.report_title, sr.date_range, sr.total_items, 
         sr.total_sales_value, sr.total_closing_value, sr.processed_at;

-- Enable RLS on new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock reports (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on companies" ON public.companies FOR ALL USING (true);
CREATE POLICY "Allow all operations on stock_reports" ON public.stock_reports FOR ALL USING (true);
CREATE POLICY "Allow all operations on stock_items" ON public.stock_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on brand_performance" ON public.brand_performance FOR ALL USING (true);