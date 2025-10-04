'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, TrendingUp, FileText, AlertCircle, Download } from 'lucide-react';

interface AnalyticsData {
  timeline: Record<string, number>;
  statusDistribution: {
    completed: number;
    failed: number;
    processing: number;
    pending: number;
  };
  monthlyData: Array<{
    month: number;
    monthName: string;
    uploads: number;
    extractions: number;
    successful: number;
    successRate: string;
  }>;
}

const COLORS = {
  completed: '#10B981',
  failed: '#EF4444', 
  processing: '#3B82F6',
  pending: '#F59E0B'
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Return loading while checking authentication
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [reportResponse, monthlyResponse] = await Promise.all([
        api.get('/reports/data'),
        api.get('/reports/analytics/monthly')
      ]);

      if (reportResponse.data.success && monthlyResponse.data.success) {
        setData({
          timeline: reportResponse.data.data.timeline,
          statusDistribution: reportResponse.data.data.statusDistribution,
          monthlyData: monthlyResponse.data.data.monthlyData
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareTimelineData = () => {
    if (!data?.timeline) return [];
    return Object.entries(data.timeline).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      uploads: count
    }));
  };

  const prepareStatusData = () => {
    if (!data?.statusDistribution) return [];
    return [
      { name: 'Completed', value: data.statusDistribution.completed, color: COLORS.completed },
      { name: 'Failed', value: data.statusDistribution.failed, color: COLORS.failed },
      { name: 'Processing', value: data.statusDistribution.processing, color: COLORS.processing },
      { name: 'Pending', value: data.statusDistribution.pending, color: COLORS.pending }
    ].filter(item => item.value > 0);
  };

  const prepareMonthlyData = () => {
    if (!data?.monthlyData) return [];
    return data.monthlyData.slice(-6).map(month => ({
      month: month.monthName,
      uploads: month.uploads,
      successful: month.successful,
      successRate: parseFloat(month.successRate)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const timelineData = prepareTimelineData();
  const statusData = prepareStatusData();
  const monthlyData = prepareMonthlyData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive insights into your PDF processing performance and trends.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 3 months</option>
          </select>
          <button
            onClick={() => router.push('/reports')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Uploads</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {monthlyData.reduce((sum, month) => sum + month.uploads, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Success Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {monthlyData.length > 0 
                      ? Math.round(monthlyData.reduce((sum, month) => sum + month.successRate, 0) / monthlyData.length)
                      : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {monthlyData.length > 0 ? monthlyData[monthlyData.length - 1]?.uploads || 0 : 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Failed Processing</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statusData.find(item => item.name === 'Failed')?.value || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* Upload Timeline */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Timeline</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="uploads" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Status</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Performance */}
        <div className="bg-white shadow rounded-lg lg:col-span-2">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="uploads" fill="#3B82F6" name="Total Uploads" />
                  <Bar yAxisId="left" dataKey="successful" fill="#10B981" name="Successful" />
                  <Line yAxisId="right" type="monotone" dataKey="successRate" stroke="#F59E0B" name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}