import React, { useEffect, useState, useCallback } from 'react';
import { Stock } from '../../../domain/models/Stock';
import { stockRepository } from '../../../data/repositories/StockRepository';
import { FilterSidebar, FilterOptions } from './FilterSidebar';
import { StockCard } from './StockCard';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { NotificationModal, NotificationSetting } from './NotificationModal';

export function ScreenerPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const [notifications, setNotifications] = useState<Record<string, NotificationSetting>>(() => {
    const saved = localStorage.getItem('stock_notifications');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedStockForNotification, setSelectedStockForNotification] = useState<Stock | null>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    recommendation: [],
    strategy: [],
    undervalued: false,
    oversold: false,
    goldenCross: false,
  });

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, { body });
        }
      });
    }
  }, []);

  const fetchStocks = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    
    try {
      const data = await stockRepository.getStocks();
      setStocks(data);
      setLastUpdated(new Date());
      
      // Check notifications
      if (isRefresh) {
        Object.values(notifications).forEach((setting: NotificationSetting) => {
          const stock = data.find(s => s.id === setting.stockId);
          if (stock) {
            const upPrice = setting.basePrice * (1 + setting.upThresholdPercent / 100);
            const downPrice = setting.basePrice * (1 - setting.downThresholdPercent / 100);

            if (stock.lastClose >= upPrice) {
              showBrowserNotification(`🚀 ${stock.ticker} is UP!`, `Price reached Rp ${stock.lastClose.toLocaleString('id-ID')} (+${setting.upThresholdPercent}%)`);
            } else if (stock.lastClose <= downPrice) {
              showBrowserNotification(`📉 ${stock.ticker} is DOWN!`, `Price dropped to Rp ${stock.lastClose.toLocaleString('id-ID')} (-${setting.downThresholdPercent}%)`);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch stocks', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notifications, showBrowserNotification]);

  useEffect(() => {
    fetchStocks();
    
    // Auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchStocks(true);
    }, 5 * 60 * 1000);
    
    // Request notification permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    return () => clearInterval(intervalId);
  }, [fetchStocks]);

  useEffect(() => {
    let result = stocks;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.ticker.toLowerCase().includes(query) || 
        s.name.toLowerCase().includes(query)
      );
    }

    // Recommendation filter
    if (filters.recommendation.length > 0) {
      result = result.filter(s => filters.recommendation.includes(s.recommendation));
    }

    // Strategy filter
    if (filters.strategy.length > 0) {
      result = result.filter(s => filters.strategy.includes(s.strategy));
    }

    // Undervalued filter
    if (filters.undervalued) {
      result = result.filter(s => s.dcf.status === 'Undervalued' && s.fundamental.pbv < 1);
    }

    // Oversold filter
    if (filters.oversold) {
      result = result.filter(s => s.technical.rsi14 < 30 || s.technical.rsi12 < 40);
    }

    // Golden Cross filter
    if (filters.goldenCross) {
      result = result.filter(s => s.technical.ema20 > s.technical.ema50);
    }

    setFilteredStocks(result);
  }, [stocks, searchQuery, filters]);

  const handleSaveNotification = (setting: NotificationSetting) => {
    const newNotifications = { ...notifications, [setting.stockId]: setting };
    setNotifications(newNotifications);
    localStorage.setItem('stock_notifications', JSON.stringify(newNotifications));
    setSelectedStockForNotification(null);
  };

  const handleRemoveNotification = (stockId: string) => {
    const newNotifications = { ...notifications };
    delete newNotifications[stockId];
    setNotifications(newNotifications);
    localStorage.setItem('stock_notifications', JSON.stringify(newNotifications));
    setSelectedStockForNotification(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">StockBro Screener</h1>
          </div>
          
          <div className="flex-1 max-w-md mx-8 hidden md:block relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
              placeholder="Search ticker or company name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center text-xs text-slate-500">
              <span className="mr-2">Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <button 
                onClick={() => fetchStocks(true)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>
            <div className="md:hidden">
              <button 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="p-2 text-slate-500 hover:text-slate-700 focus:outline-none"
              >
                <SlidersHorizontal className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <div className={`lg:block ${showMobileFilters ? 'block' : 'hidden'}`}>
            <FilterSidebar filters={filters} onChange={setFilters} />
          </div>

          {/* Results Area */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Screening Results</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Showing {filteredStocks.length} stocks matching your criteria
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : filteredStocks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredStocks.map(stock => (
                  <StockCard 
                    key={stock.id} 
                    stock={stock} 
                    onClick={(s) => console.log('Clicked', s.ticker)}
                    onSetNotification={setSelectedStockForNotification}
                    hasNotification={!!notifications[stock.id]}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No stocks found</h3>
                <p className="text-slate-500">Try adjusting your filters or search query to find more results.</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({
                      recommendation: [],
                      strategy: [],
                      undervalued: false,
                      oversold: false,
                      goldenCross: false
                    });
                  }}
                  className="mt-6 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedStockForNotification && (
        <NotificationModal
          stock={selectedStockForNotification}
          existingSetting={notifications[selectedStockForNotification.id]}
          onSave={handleSaveNotification}
          onCancel={() => setSelectedStockForNotification(null)}
          onRemove={handleRemoveNotification}
        />
      )}
    </div>
  );
}
