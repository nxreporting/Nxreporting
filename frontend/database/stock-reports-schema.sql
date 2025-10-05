-- Stock Reports Database Schema
-- Comprehensive schema for storing extracted PDF stock report data

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock reports table (main report metadata)
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
    raw_data JSONB, -- Store the complete raw extraction data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock items table (individual item data)
CREATE TABLE IF NOT EXISTS stock_items (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES stock_reports(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_name_clean VARCHAR(255), -- Cleaned version for analysis
    brand VARCHAR(100), -- Extracted brand name
    
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
    
    -- Calculated fields
    avg_sale_price DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN sales_qty > 0 THEN sales_value / sales_qty 
            ELSE 0 
        END
    ) STORED,
    
    turnover_ratio DECIMAL(10,4) GENERATED ALWAYS AS (
        CASE 
            WHEN opening_qty > 0 THEN sales_qty::DECIMAL / opening_qty 
            ELSE 0 
        END
    ) STORED,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Brand performance summary (for quick analytics)
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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_reports_company_id ON stock_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_reports_processed_at ON stock_reports(processed_at);
CREATE INDEX IF NOT EXISTS idx_stock_items_report_id ON stock_items(report_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_brand ON stock_items(brand);
CREATE INDEX IF NOT EXISTS idx_stock_items_item_name ON stock_items(item_name);
CREATE INDEX IF NOT EXISTS idx_brand_performance_report_id ON brand_performance(report_id);
CREATE INDEX IF NOT EXISTS idx_brand_performance_brand_name ON brand_performance(brand_name);

-- Views for common analytics queries
CREATE OR REPLACE VIEW stock_analytics_summary AS
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
    AVG(si.avg_sale_price) as avg_item_price,
    MAX(si.sales_value) as highest_item_sales,
    SUM(CASE WHEN si.sales_qty > 0 THEN 1 ELSE 0 END) as active_items
FROM stock_reports sr
JOIN companies c ON sr.company_id = c.id
LEFT JOIN stock_items si ON sr.id = si.report_id
GROUP BY sr.id, c.name, sr.report_title, sr.date_range, sr.total_items, 
         sr.total_sales_value, sr.total_closing_value, sr.processed_at;

-- View for top performing items across all reports
CREATE OR REPLACE VIEW top_performing_items AS
SELECT 
    si.item_name,
    si.brand,
    COUNT(*) as report_count,
    AVG(si.sales_qty) as avg_sales_qty,
    AVG(si.sales_value) as avg_sales_value,
    AVG(si.avg_sale_price) as avg_price,
    SUM(si.sales_value) as total_sales_value,
    MAX(si.sales_value) as max_sales_value,
    c.name as company_name
FROM stock_items si
JOIN stock_reports sr ON si.report_id = sr.id
JOIN companies c ON sr.company_id = c.id
WHERE si.sales_qty > 0
GROUP BY si.item_name, si.brand, c.name
ORDER BY total_sales_value DESC;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_reports_updated_at BEFORE UPDATE ON stock_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON stock_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();