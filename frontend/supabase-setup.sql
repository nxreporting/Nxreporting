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