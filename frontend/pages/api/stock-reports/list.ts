import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { sendSuccess, sendError, validateMethod } from '../../../lib/api-response';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }

  try {
    const { company, limit = 10, offset = 0 } = req.query;

    console.log('📊 Fetching stock reports...');

    // Check if tables exist first
    const { data: tablesCheck, error: tablesError } = await supabase
      .from('stock_reports')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.log('⚠️ Tables not found, returning empty data');
      return sendSuccess(res, {
        reports: [],
        pagination: {
          total: 0,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: false
        },
        companies: [],
        summary: {
          totalReports: 0,
          companiesCount: 0
        },
        needsSetup: true,
        setupMessage: 'Database tables need to be created. Upload a PDF first to initialize the database.'
      });
    }

    // Build query for reports with company info
    let query = supabase
      .from('stock_reports')
      .select(`
        id,
        report_title,
        date_range,
        total_items,
        total_sales_value,
        total_closing_value,
        processed_at,
        companies!inner(name)
      `)
      .order('processed_at', { ascending: false });

    // Filter by company if specified
    if (company && company !== 'all') {
      query = query.eq('companies.name', company);
    }

    // Apply pagination
    query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data: reportsData, error } = await query;

    if (error) {
      console.error('❌ Error fetching reports:', error);
      return sendError(res, 'Failed to fetch stock reports', 500);
    }

    // Transform the data to match expected format
    const reports = reportsData?.map(report => ({
      report_id: report.id,
      company_name: report.companies?.name || 'Unknown',
      report_title: report.report_title,
      date_range: report.date_range,
      total_items: report.total_items,
      total_sales_value: report.total_sales_value,
      total_closing_value: report.total_closing_value,
      processed_at: report.processed_at,
      items_with_sales: 0, // Will be calculated later if needed
      avg_item_price: 0 // Will be calculated later if needed
    })) || [];

    // Get total count for pagination
    const { count } = await supabase
      .from('stock_reports')
      .select('id', { count: 'exact', head: true });

    // Get companies list for filtering
    const { data: companies } = await supabase
      .from('companies')
      .select('name')
      .order('name');

    console.log(`✅ Found ${reports?.length || 0} reports`);

    return sendSuccess(res, {
      reports: reports || [],
      pagination: {
        total: count || 0,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: (Number(offset) + Number(limit)) < (count || 0)
      },
      companies: companies?.map(c => c.name) || [],
      summary: {
        totalReports: count || 0,
        companiesCount: companies?.length || 0
      }
    });

  } catch (error: any) {
    console.error('❌ Error in list endpoint:', error);
    return sendError(res, `Failed to fetch reports: ${error.message}`, 500);
  }
}