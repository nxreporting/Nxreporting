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

    // Build query
    let query = supabase
      .from('stock_analytics_summary')
      .select('*')
      .order('processed_at', { ascending: false });

    // Filter by company if specified
    if (company && company !== 'all') {
      query = query.eq('company_name', company);
    }

    // Apply pagination
    query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data: reports, error } = await query;

    if (error) {
      console.error('❌ Error fetching reports:', error);
      return sendError(res, 'Failed to fetch stock reports', 500);
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('stock_reports')
      .select('id', { count: 'exact', head: true });

    if (company && company !== 'all') {
      countQuery = countQuery.eq('company_name', company);
    }

    const { count } = await countQuery;

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