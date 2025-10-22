-- Disable Row Level Security on users table to allow service_role access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on other tables as well
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_performance DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you want to keep RLS enabled, create policies for service_role
-- CREATE POLICY "Service role can do everything on users" ON users
-- FOR ALL USING (auth.role() = 'service_role');

-- CREATE POLICY "Service role can do everything on companies" ON companies
-- FOR ALL USING (auth.role() = 'service_role');

-- CREATE POLICY "Service role can do everything on stock_reports" ON stock_reports
-- FOR ALL USING (auth.role() = 'service_role');

-- CREATE POLICY "Service role can do everything on stock_items" ON stock_items
-- FOR ALL USING (auth.role() = 'service_role');

-- CREATE POLICY "Service role can do everything on brand_performance" ON brand_performance
-- FOR ALL USING (auth.role() = 'service_role');