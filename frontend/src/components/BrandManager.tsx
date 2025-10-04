'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Building2, Package, TrendingUp, Users } from 'lucide-react';

interface Brand {
  name: string;
  fullName?: string;
  aliases?: string[];
  category?: string;
}

interface Division {
  id: string;
  name: string;
  description?: string;
  brands: Brand[];
}

interface BrandStats {
  totalDivisions: number;
  totalBrands: number;
  divisionBreakdown: Array<{
    id: string;
    name: string;
    brandCount: number;
    brands: string[];
  }>;
  topDivisions: Array<{
    name: string;
    brandCount: number;
  }>;
}

const BrandManager: React.FC = () => {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [stats, setStats] = useState<BrandStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddDivision, setShowAddDivision] = useState(false);

  // New brand form
  const [newBrand, setNewBrand] = useState({
    name: '',
    fullName: '',
    aliases: '',
    category: ''
  });

  // New division form
  const [newDivision, setNewDivision] = useState({
    id: '',
    name: '',
    description: ''
  });

  // Load initial data
  useEffect(() => {
    loadDivisions();
    loadStats();
  }, []);

  const loadDivisions = async () => {
    try {
      const response = await fetch('/api/brands/divisions');
      const result = await response.json();
      if (result.success) {
        setDivisions(result.data);
      }
    } catch (error) {
      console.error('Failed to load divisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/brands/stats');
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/brands/search?q=${encodeURIComponent(searchQuery)}`);
      const result = await response.json();
      if (result.success) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrand.name || !selectedDivision) return;

    try {
      const response = await fetch(`/api/brands/divisions/${selectedDivision}/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBrand.name,
          fullName: newBrand.fullName || undefined,
          aliases: newBrand.aliases ? newBrand.aliases.split(',').map(a => a.trim()) : undefined,
          category: newBrand.category || undefined
        })
      });

      const result = await response.json();
      if (result.success) {
        setNewBrand({ name: '', fullName: '', aliases: '', category: '' });
        setShowAddBrand(false);
        loadDivisions();
        loadStats();
        alert('Brand added successfully!');
      } else {
        alert(`Failed to add brand: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to add brand:', error);
      alert('Failed to add brand');
    }
  };

  const handleAddDivision = async () => {
    if (!newDivision.id || !newDivision.name) return;

    try {
      const response = await fetch('/api/brands/divisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDivision)
      });

      const result = await response.json();
      if (result.success) {
        setNewDivision({ id: '', name: '', description: '' });
        setShowAddDivision(false);
        loadDivisions();
        loadStats();
        alert('Division added successfully!');
      } else {
        alert(`Failed to add division: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to add division:', error);
      alert('Failed to add division');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Management</h1>
          <p className="text-gray-600">Manage CNX pharmaceutical brands and divisions</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddBrand(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Brand</span>
          </button>
          <button
            onClick={() => setShowAddDivision(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Division</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">{stats.totalDivisions}</div>
                <div className="text-sm text-blue-700">Divisions</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">{stats.totalBrands}</div>
                <div className="text-sm text-green-700">Total Brands</div>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {stats.topDivisions[0]?.name || 'N/A'}
                </div>
                <div className="text-sm text-purple-700">Top Division</div>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-900">
                  {Math.round(stats.totalBrands / stats.totalDivisions)}
                </div>
                <div className="text-sm text-orange-700">Avg Brands/Division</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex space-x-2">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-medium text-gray-900">Search Results:</h3>
            {searchResults.map((result, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                <div className="font-medium">{result.brand.name}</div>
                <div className="text-sm text-gray-600">
                  Division: {result.division.name}
                  {result.brand.aliases && (
                    <span className="ml-2">
                      | Aliases: {result.brand.aliases.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {divisions.map((division) => (
          <div key={division.id} className="bg-white border rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">{division.name}</h3>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {division.brands.length} brands
                </span>
              </div>
              {division.description && (
                <p className="text-sm text-gray-600 mt-1">{division.description}</p>
              )}
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {division.brands.map((brand, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                    <div className="font-medium">{brand.name}</div>
                    {brand.aliases && brand.aliases.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {brand.aliases.slice(0, 2).join(', ')}
                        {brand.aliases.length > 2 && ` +${brand.aliases.length - 2} more`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Brand Modal */}
      {showAddBrand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Brand</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Division</option>
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>{div.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  value={newBrand.name}
                  onChange={(e) => setNewBrand({...newBrand, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newBrand.fullName}
                  onChange={(e) => setNewBrand({...newBrand, fullName: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aliases (comma-separated)</label>
                <input
                  type="text"
                  value={newBrand.aliases}
                  onChange={(e) => setNewBrand({...newBrand, aliases: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddBrand(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBrand}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Brand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Division Modal */}
      {showAddDivision && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Division</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division ID *</label>
                <input
                  type="text"
                  value={newDivision.id}
                  onChange={(e) => setNewDivision({...newDivision, id: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., cnx-new-division"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division Name *</label>
                <input
                  type="text"
                  value={newDivision.name}
                  onChange={(e) => setNewDivision({...newDivision, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newDivision.description}
                  onChange={(e) => setNewDivision({...newDivision, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddDivision(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDivision}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Add Division
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandManager;