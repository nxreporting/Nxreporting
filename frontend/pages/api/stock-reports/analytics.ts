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
    const { reportId, company, timeframe = '30' } = req.query;

    console.log('📈 Generating analytics...');

    let analytics: any = {};

    if (reportId) {
      // Get specific report analytics
      analytics = await getReportAnalytics(Number(reportId));
    } else {
      // Get general analytics
      analytics = await getGeneralAnalytics(company as string, Number(timeframe));
    }

    return sendSuccess(res, analytics);

  } catch (error: any) {
    console.error('❌ Error generating analytics:', error);
    return sendError(res, `Failed to generate analytics: ${error.message}`, 500);
  }
}

async function getReportAnalytics(reportId: number) {
  // Get report details
  const { data: report } = await supabase
    .from('stock_reports')
    .select(`
      *,
      companies(name)
    `)
    .eq('id', reportId)
    .single();

  // Get top performing items
  const { data: topItems } = await supabase
    .from('stock_items')
    .select('*')
    .eq('report_id', reportId)
    .order('sales_value', { ascending: false })
    .limit(10);

  // Get brand performance
  const { data: brandPerformance } = await supabase
    .from('brand_performance')
    .select('*')
    .eq('report_id', reportId)
    .order('total_sales_value', { ascending: false });

  // Calculate insights
  const totalItems = topItems?.length || 0;
  const itemsWithSales = topItems?.filter(item => item.sales_qty > 0).length || 0;
  const averagePrice = topItems?.reduce((sum, item) => sum + (item.avg_sale_price || 0), 0) / totalItems || 0;
  
  return {
    report: {
      ...report,
      company_name: report?.companies?.name
    },
    topPerformingItems: topItems?.slice(0, 5) || [],
    brandPerformance: brandPerformance || [],
    insights: {
      totalItems,
      itemsWithSales,
      itemsWithoutSales: totalItems - itemsWithSales,
      averagePrice: Math.round(averagePrice * 100) / 100,
      salesConversionRate: totalItems > 0 ? Math.round((itemsWithSales / totalItems) * 100) : 0,
      topBrand: brandPerformance?.[0]?.brand_name || 'N/A',
      topBrandSales: brandPerformance?.[0]?.total_sales_value || 0
    }
  };
}

async function getGeneralAnalytics(company?: string, timeframeDays: number = 30) {
  const timeframeDate = new Date();
  timeframeDate.setDate(timeframeDate.getDate() - timeframeDays);

  // Build base query
  let reportsQuery = supabase
    .from('stock_reports')
    .select(`
      *,
      companies(name)
    `)
    .gte('processed_at', timeframeDate.toISOString());

  if (company && company !== 'all') {
    reportsQuery = reportsQuery.eq('companies.name', company);
  }

  const { data: reports } = await reportsQuery.order('processed_at', { ascending: false });

  // Get top performing items across all reports
  let itemsQuery = supabase
    .from('top_performing_items')
    .select('*');

  if (company && company !== 'all') {
    itemsQuery = itemsQuery.eq('company_name', company);
  }

  const { data: topItems } = await itemsQuery
    .order('total_sales_value', { ascending: false })
    .limit(10);

  // Calculate summary statistics
  const totalReports = reports?.length || 0;
  const totalSalesValue = reports?.reduce((sum, report) => sum + (report.total_sales_value || 0), 0) || 0;
  const totalItems = reports?.reduce((sum, report) => sum + (report.total_items || 0), 0) || 0;
  const averageReportValue = totalReports > 0 ? totalSalesValue / totalReports : 0;

  // Get brand trends
  const brandTrends = await getBrandTrends(company, timeframeDays);

  // Get monthly trends
  const monthlyTrends = await getMonthlyTrends(company, timeframeDays);

  return {
    summary: {
      totalReports,
      totalSalesValue: Math.round(totalSalesValue * 100) / 100,
      totalItems,
      averageReportValue: Math.round(averageReportValue * 100) / 100,
      timeframe: `${timeframeDays} days`
    },
    topPerformingItems: topItems || [],
    brandTrends,
    monthlyTrends,
    recentReports: reports?.slice(0, 5) || []
  };
}

async function getBrandTrends(company?: string, timeframeDays: number = 30) {
  const timeframeDate = new Date();
  timeframeDate.setDate(timeframeDate.getDate() - timeframeDays);

  let query = supabase
    .from('brand_performance')
    .select(`
      *,
      stock_reports!inner(processed_at, companies!inner(name))
    `)
    .gte('stock_reports.processed_at', timeframeDate.toISOString());

  if (company && company !== 'all') {
    query = query.eq('stock_reports.companies.name', company);
  }

  const { data: brandData } = await query;

  // Aggregate by brand
  const brandMap: { [key: string]: any } = {};
  
  brandData?.forEach(item => {
    const brand = item.brand_name;
    if (!brandMap[brand]) {
      brandMap[brand] = {
        brand_name: brand,
        total_sales_value: 0,
        total_sales_qty: 0,
        report_count: 0,
        avg_price: 0
      };
    }
    
    brandMap[brand].total_sales_value += item.total_sales_value || 0;
    brandMap[brand].total_sales_qty += item.total_sales_qty || 0;
    brandMap[brand].report_count++;
  });

  // Calculate averages and sort
  const brands = Object.values(brandMap).map((brand: any) => ({
    ...brand,
    avg_price: brand.total_sales_qty > 0 ? brand.total_sales_value / brand.total_sales_qty : 0
  })).sort((a, b) => b.total_sales_value - a.total_sales_value);

  return brands.slice(0, 10);
}

async function getMonthlyTrends(company?: string, timeframeDays: number = 30) {
  const timeframeDate = new Date();
  timeframeDate.setDate(timeframeDate.getDate() - timeframeDays);

  let query = supabase
    .from('stock_reports')
    .select(`
      processed_at,
      total_sales_value,
      total_items,
      companies!inner(name)
    `)
    .gte('processed_at', timeframeDate.toISOString());

  if (company && company !== 'all') {
    query = query.eq('companies.name', company);
  }

  const { data: reports } = await query.order('processed_at', { ascending: true });

  // Group by month
  const monthlyData: { [key: string]: any } = {};
  
  reports?.forEach(report => {
    const date = new Date(report.processed_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        total_sales_value: 0,
        total_items: 0,
        report_count: 0
      };
    }
    
    monthlyData[monthKey].total_sales_value += report.total_sales_value || 0;
    monthlyData[monthKey].total_items += report.total_items || 0;
    monthlyData[monthKey].report_count++;
  });

  return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
}