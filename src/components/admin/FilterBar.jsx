import { useState } from 'react';
import { FiSearch, FiFilter, FiX, FiCalendar } from 'react-icons/fi';
import awardCategories from '../../data/award-categories.json';

/**
 * Filter Bar Component
 * Provides filtering and search functionality for submissions
 *
 * @param {Object} props
 * @param {string} props.type - Type of submissions ('contact', 'membership', or 'awards')
 * @param {Function} props.onFilterChange - Callback when filters change
 * @param {Object} props.filters - Current filter values
 */
export default function FilterBar({ type = 'contact', onFilterChange, filters = {} }) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all');
  const [dateFrom, setDateFrom] = useState(filters.dateFrom || '');
  const [dateTo, setDateTo] = useState(filters.dateTo || '');
  const [showFilters, setShowFilters] = useState(false);

  // Get available statuses based on type
  const getAvailableStatuses = () => {
    if (type === 'contact') {
      return [
        { value: 'all', label: 'All Statuses' },
        { value: 'new', label: 'New' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' },
      ];
    } else if (type === 'membership' || type === 'awards') {
      return [
        { value: 'all', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ];
    } else {
      return [
        { value: 'all', label: 'All Statuses' },
      ];
    }
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (onFilterChange) {
      onFilterChange({
        ...filters,
        search: value,
        status: statusFilter,
        category: categoryFilter,
        dateFrom,
        dateTo,
      });
    }
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    if (onFilterChange) {
      onFilterChange({
        ...filters,
        search: searchQuery,
        status: value,
        categoryFilter,
        dateFrom,
        dateTo,
      });
    }
  };

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    if (onFilterChange) {
      onFilterChange({
        ...filters,
        search: searchQuery,
        status: statusFilter,
        category: value,
        dateFrom,
        dateTo,
      });
    }
  };

  const handleDateFromChange = (value) => {
    setDateFrom(value);
    if (onFilterChange) {
      onFilterChange({
        ...filters,
        search: searchQuery,
        status: statusFilter,
        category: categoryFilter,
        dateFrom: value,
        dateTo,
      });
    }
  };

  const handleDateToChange = (value) => {
    setDateTo(value);
    if (onFilterChange) {
      onFilterChange({
        ...filters,
        search: searchQuery,
        status: statusFilter,
        category: categoryFilter,
        dateFrom,
        dateTo: value,
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
    if (onFilterChange) {
      onFilterChange({
        search: '',
        status: 'all',
        category: 'all',
        dateFrom: '',
        dateTo: '',
      });
    }
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 mb-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search ${type === 'contact' ? 'submissions' : type === 'awards' ? 'nominations' : 'applications'}...`}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] md:min-h-0"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 min-h-[44px] md:min-h-0 w-full sm:w-auto"
        >
          <FiFilter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 md:py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-2 min-h-[44px] md:min-h-0 w-full sm:w-auto border border-gray-300 rounded-lg hover:bg-gray-50 sm:border-0 sm:rounded-none"
          >
            <FiX className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="pt-3 border-t border-gray-200">
          {/* Quick Date Presets */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Quick Date Filters
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, '0');
                  const day = String(today.getDate()).padStart(2, '0');
                  const todayStr = `${year}-${month}-${day}`;
                  handleDateFromChange(todayStr);
                  handleDateToChange(todayStr);
                }}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors min-h-[44px] md:min-h-0"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const sevenDaysAgo = new Date(today);
                  sevenDaysAgo.setDate(today.getDate() - 7);
                  
                  const formatDate = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  };
                  
                  handleDateFromChange(formatDate(sevenDaysAgo));
                  handleDateToChange(formatDate(today));
                }}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors min-h-[44px] md:min-h-0"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const thirtyDaysAgo = new Date(today);
                  thirtyDaysAgo.setDate(today.getDate() - 30);
                  
                  const formatDate = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  };
                  
                  handleDateFromChange(formatDate(thirtyDaysAgo));
                  handleDateToChange(formatDate(today));
                }}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors min-h-[44px] md:min-h-0"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                  
                  const formatDate = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  };
                  
                  handleDateFromChange(formatDate(thisMonthStart));
                  handleDateToChange(formatDate(today));
                }}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors min-h-[44px] md:min-h-0"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                  
                  const formatDate = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  };
                  
                  handleDateFromChange(formatDate(lastMonthStart));
                  handleDateToChange(formatDate(lastMonthEnd));
                }}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors min-h-[44px] md:min-h-0"
              >
                Last Month
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter - Not shown for Awards */}
            {type !== 'awards' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base md:text-sm min-h-[44px] md:min-h-0"
                >
                  {getAvailableStatuses().map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Filter - Only for Awards */}
            {type === 'awards' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base md:text-sm min-h-[44px] md:min-h-0"
                >
                  <option value="all">All Categories</option>
                  {awardCategories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date From Filter */}
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-2">
                <FiCalendar className="inline mr-1 w-4 h-4 text-gray-500" />
                From Date
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
                <input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white text-gray-900 cursor-pointer hover:border-gray-400 text-base md:text-sm min-h-[44px] md:min-h-0"
                />
              </div>
              {dateFrom && (
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>

            {/* Date To Filter */}
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-2">
                <FiCalendar className="inline mr-1 w-4 h-4 text-gray-500" />
                To Date
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
                <input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  min={dateFrom || undefined}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white text-gray-900 cursor-pointer hover:border-gray-400 text-base md:text-sm min-h-[44px] md:min-h-0"
                />
              </div>
              {dateTo && (
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

