import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Stock } from '../../../domain/models/Stock';
import { stockRepository } from '../../../data/repositories/StockRepository';
import { FilterSidebar, FilterOptions, DEFAULT_FILTERS } from './FilterSidebar';
import { StockCard } from './StockCard';
import { StockListView } from './StockListView';
import { StockDetailPage } from './StockDetailPage';
import { WatchlistSidebar } from './WatchlistSidebar';
import { WatchlistTicker } from './WatchlistTicker';
import { ScannerModeTab } from './ScannerModeTab';
import { AiScreenerTab } from './AiScreenerTab';
import { WatchlistAiTab } from './WatchlistAiTab';
import { TradeJournalTab } from './TradeJournalTab';
import { HeroSummary } from './HeroSummary';
import { QuickFilterChips, QuickFilterKey } from './QuickFilterChips';
import { SkeletonStockGrid } from './SkeletonStockCard';
import { EmptyState } from './EmptyState';
import { isBlueChip, isLowRisk } from '../../../utils/stockLabels';
import {
  Search, SlidersHorizontal, RefreshCw, X,
  Home, Star, TrendingUp, Zap, BarChart2, Sparkles, LayoutGrid, Table2, ListChecks, BookOpen
} from 'lucide-react';
import { NotificationModal, NotificationSetting } from './NotificationModal';

type SortField = 'ticker' | 'name' | 'price' | 'percentChange' | 'swingScore' | 'scalpingScore';
type SortDirection = 'asc' | 'desc';
type AppTab = 'screener' | 'swing' | 'scalping' | 'ai-screener' | 'watchlist-ai' | 'journal';
type ViewMode = 'card' | 'table';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export function ScreenerPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'percentChange', direction: 'desc' });
  const [activeTab, setActiveTab] = useState<AppTab>('screener');

  const [notifications, setNotifications] = useState<Record<string, NotificationSetting>>(() => {
    const saved = localStorage.getItem('stock_notifications');
    return saved ? JSON.parse(saved) : {};
  });
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('stock_favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [selectedStockForNotification, setSelectedStockForNotification] = useState<Stock | null>(null);
  const [selectedStockForDetail, setSelectedStockForDetail] = useState<Stock | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilterKey>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [mobileNavTab, setMobileNavTab] = useState<'results' | 'filters' | 'watchlist'>('results');
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const watchlistRef = useRef<HTMLDivElement | null>(null);

  const scrollToSection = useCallback((section: 'results' | 'watchlist') => {
    const target = section === 'results' ? resultsRef.current : watchlistRef.current;
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") new Notification(title, { body });
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

      if (isRefresh) {
        let notificationsChanged = false;
        const newNotifications = { ...notifications };

        Object.values(notifications).forEach((setting: NotificationSetting) => {
          const stock = data.find(s => s.id === setting.stockId);
          if (stock) {
            const upPrice = setting.basePrice * (1 + setting.upThresholdPercent / 100);
            const downPrice = setting.basePrice * (1 - setting.downThresholdPercent / 100);

            if (stock.lastClose >= upPrice) {
              showBrowserNotification(`🚀 ${stock.ticker} is UP!`, `Price reached Rp ${stock.lastClose.toLocaleString('id-ID')} (+${setting.upThresholdPercent}%)`);
              delete newNotifications[setting.stockId];
              notificationsChanged = true;
            } else if (stock.lastClose <= downPrice) {
              showBrowserNotification(`📉 ${stock.ticker} is DOWN!`, `Price dropped to Rp ${stock.lastClose.toLocaleString('id-ID')} (-${setting.downThresholdPercent}%)`);
              delete newNotifications[setting.stockId];
              notificationsChanged = true;
            }
          }
        });

        if (notificationsChanged) {
          setNotifications(newNotifications);
          localStorage.setItem('stock_notifications', JSON.stringify(newNotifications));
        }
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
    const intervalId = setInterval(() => fetchStocks(true), 5 * 60 * 1000);
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    return () => clearInterval(intervalId);
  }, [fetchStocks]);

  useEffect(() => {
    let result = stocks;

    // Search
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(s =>
        s.ticker.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query)
      );
    }

    // Score filters
    if (filters.minSwingScore > 0) {
      result = result.filter(s => s.swingScore.totalScore >= filters.minSwingScore);
    }
    if (filters.minScalpingScore > 0) {
      result = result.filter(s => s.scalpingScore.totalScore >= filters.minScalpingScore);
    }

    // Price range
    if (filters.minPrice > 0) {
      result = result.filter(s => s.lastClose >= filters.minPrice);
    }
    if (filters.maxPrice > 0) {
      result = result.filter(s => s.lastClose <= filters.maxPrice);
    }

    // Recommendation
    if (filters.recommendation.length > 0) {
      result = result.filter(s => filters.recommendation.includes(s.recommendation));
    }

    // Strategy
    if (filters.strategy.length > 0) {
      result = result.filter(s => filters.strategy.includes(s.strategy));
    }

    // Industry
    if (filters.industry.length > 0) {
      result = result.filter(s => filters.industry.includes(s.sector));
    }

    // Quick screens
    if (filters.undervalued) {
      result = result.filter(s => s.dcf.status === 'Undervalued' && s.fundamental.pbv > 0 && s.fundamental.pbv < 1);
    }
    if (filters.oversold) {
      result = result.filter(s => s.technical.rsi14 < 30 || s.technical.rsi12 < 40);
    }
    if (filters.goldenCross) {
      result = result.filter(s => s.technical.ema20 > s.technical.ema50);
    }
    if (filters.volumeSpike) {
      result = result.filter(s => s.scalpingScore.volumeScore >= 60);
    }
    if (filters.blueChip) {
      result = result.filter(isBlueChip);
    }
    if (filters.lowRisk) {
      result = result.filter(isLowRisk);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case 'ticker': comparison = a.ticker.localeCompare(b.ticker); break;
        case 'name': comparison = a.name.localeCompare(b.name); break;
        case 'price': comparison = a.lastClose - b.lastClose; break;
        case 'percentChange': comparison = a.percentChange - b.percentChange; break;
        case 'swingScore': comparison = a.swingScore.totalScore - b.swingScore.totalScore; break;
        case 'scalpingScore': comparison = a.scalpingScore.totalScore - b.scalpingScore.totalScore; break;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    setFilteredStocks(result);
  }, [stocks, filters, sortConfig]);

  const handleSaveNotification = (setting: NotificationSetting) => {
    const newNotifications = { ...notifications, [setting.stockId]: setting };
    setNotifications(newNotifications);
    localStorage.setItem('stock_notifications', JSON.stringify(newNotifications));
    setSelectedStockForNotification(null);
  };

  const handleStockClick = useCallback((stock: Stock) => {
    setSelectedStockForDetail(stock);
  }, []);

  const handleRemoveNotification = (stockId: string) => {
    const newNotifications = { ...notifications };
    delete newNotifications[stockId];
    setNotifications(newNotifications);
    localStorage.setItem('stock_notifications', JSON.stringify(newNotifications));
    setSelectedStockForNotification(null);
  };

  const handleToggleFavorite = (stock: Stock) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(stock.id)) newFavorites.delete(stock.id);
    else newFavorites.add(stock.id);
    setFavorites(newFavorites);
    localStorage.setItem('stock_favorites', JSON.stringify(Array.from(newFavorites)));
  };

  const getFavoriteStocks = () => stocks.filter(stock => favorites.has(stock.id));

  const tabConfig: { id: AppTab; icon: React.ReactNode; label: string; sublabel: string }[] = [
    { id: 'screener', icon: <BarChart2 className="w-4 h-4" />, label: 'Screener', sublabel: 'Semua Saham' },
    { id: 'swing', icon: <TrendingUp className="w-4 h-4" />, label: 'Swing Trade', sublabel: '1–3 Hari' },
    { id: 'scalping', icon: <Zap className="w-4 h-4" />, label: 'Pre-Market', sublabel: 'Scalping' },
    { id: 'ai-screener', icon: <Sparkles className="w-4 h-4" />, label: 'AI Screener', sublabel: 'Rule Engine' },
    { id: 'watchlist-ai', icon: <ListChecks className="w-4 h-4" />, label: 'Watchlist AI', sublabel: 'After Market' },
    { id: 'journal', icon: <BookOpen className="w-4 h-4" />, label: 'Journal', sublabel: 'Catat Hasil' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm tracking-tighter">SC</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-black text-slate-900 leading-none">EZYSAHAM S.C.A.N.</div>
              <div className="text-xs text-slate-400">Smart Capital Analysis Navigator</div>
            </div>
          </div>

          {/* Desktop Tab Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {tabConfig.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search (desktop) */}
          <div className="flex-1 hidden lg:block relative max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-9 py-1.5 border border-slate-200 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Cari ticker atau nama..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            {filters.search && (
              <button onClick={() => setFilters({ ...filters, search: '' })} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStocks(true)}
              className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <div className="hidden sm:flex flex-col text-right text-xs text-slate-500">
              <span>Update</span>
              <span className="font-medium text-slate-700">{lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Mobile search row */}
        <div className="lg:hidden px-4 pb-2.5 flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-9 py-1.5 border border-slate-200 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Cari ticker atau nama..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            {filters.search && (
              <button onClick={() => setFilters({ ...filters, search: '' })} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Watchlist Ticker */}
      <WatchlistTicker favorites={getFavoriteStocks()} />

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowMobileFilters(false)} />
          <aside className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl border-l border-slate-200 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Filter & Watchlist</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 rounded-full text-slate-500 hover:text-slate-700 bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <FilterSidebar filters={filters} onChange={setFilters} stocks={stocks} />
              <WatchlistSidebar
                favorites={getFavoriteStocks()}
                onRemoveFavorite={(stockId) => { const stock = stocks.find(s => s.id === stockId); if (stock) handleToggleFavorite(stock); }}
                onStockClick={handleStockClick}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-28">

        {/* Mobile Tab Nav */}
        <div className="flex md:hidden gap-2 mb-5 overflow-x-auto pb-1">
          {tabConfig.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${activeTab === tab.id
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Swing / Scalping Scanner Mode */}
        {(activeTab === 'swing' || activeTab === 'scalping') && (
          <ScannerModeTab
            stocks={stocks}
            loading={loading}
            onStockClick={handleStockClick}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
          />
        )}

        {/* AI Screener Mode */}
        {activeTab === 'ai-screener' && (
          <AiScreenerTab
            stocks={stocks}
            loading={loading}
            onStockClick={handleStockClick}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
          />
        )}

        {/* Watchlist AI Mode (Stage 1 — After Market AI) */}
        {activeTab === 'watchlist-ai' && (
          <WatchlistAiTab
            stocks={stocks}
            loading={loading}
            onStockClick={handleStockClick}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
          />
        )}

        {/* Trade Journal */}
        {activeTab === 'journal' && <TradeJournalTab />}

        {/* Screener Mode */}
        {activeTab === 'screener' && (
          <div>
            <HeroSummary stocks={stocks} />

            <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <QuickFilterChips
                activeKey={activeQuickFilter}
                onSelect={(key, nextFilters) => { setActiveQuickFilter(key); setFilters(nextFilters); }}
              />
            </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="hidden lg:block w-64 shrink-0">
              <FilterSidebar filters={filters} onChange={setFilters} stocks={stocks} />
              <div className="mt-5">
                <WatchlistSidebar
                  favorites={getFavoriteStocks()}
                  onRemoveFavorite={(stockId) => { const stock = stocks.find(s => s.id === stockId); if (stock) handleToggleFavorite(stock); }}
                  onStockClick={handleStockClick}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 min-w-0">
              <div ref={resultsRef} className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Hasil Screening</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {filteredStocks.length} saham ditemukan
                    {stocks.length > 0 && ` dari ${stocks.length} total`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('card')}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-50' : 'text-slate-400'}`}
                      title="Tampilan Kartu"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-50' : 'text-slate-400'}`}
                      title="Tampilan Tabel"
                    >
                      <Table2 className="w-4 h-4" />
                    </button>
                  </div>
                  <select
                    className="text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg py-1.5 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    value={`${sortConfig.field}-${sortConfig.direction}`}
                    onChange={(e) => {
                      const [field, direction] = e.target.value.split('-');
                      setSortConfig({ field: field as SortField, direction: direction as SortDirection });
                    }}
                  >
                    <option value="swingScore-desc">AI Score (Tertinggi)</option>
                    <option value="scalpingScore-desc">Scalping Score (Tertinggi)</option>
                    <option value="percentChange-desc">Perubahan (Tertinggi)</option>
                    <option value="percentChange-asc">Perubahan (Terendah)</option>
                    <option value="price-desc">Harga (Tertinggi)</option>
                    <option value="price-asc">Harga (Terendah)</option>
                    <option value="ticker-asc">Ticker (A-Z)</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <SkeletonStockGrid count={6} />
              ) : filteredStocks.length > 0 ? (
                viewMode === 'card' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredStocks.map((stock, index) => (
                      <StockCard
                        key={stock.id}
                        stock={stock}
                        index={index}
                        onClick={handleStockClick}
                        onSetNotification={setSelectedStockForNotification}
                        hasNotification={!!notifications[stock.id]}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorite={favorites.has(stock.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <StockListView
                    stocks={filteredStocks}
                    onClick={handleStockClick}
                    onToggleFavorite={handleToggleFavorite}
                    favorites={favorites}
                    sortField={sortConfig.field}
                    sortDirection={sortConfig.direction}
                    onSortChange={(field) => {
                      setSortConfig((prev: SortConfig) => ({
                        field,
                        direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
                      }));
                    }}
                  />
                )
              ) : (
                <EmptyState onReset={() => { setFilters(DEFAULT_FILTERS); setActiveQuickFilter('all'); }} />
              )}

              <div ref={watchlistRef} className="lg:hidden mt-6">
                <WatchlistSidebar
                  favorites={getFavoriteStocks()}
                  onRemoveFavorite={(stockId) => { const stock = stocks.find(s => s.id === stockId); if (stock) handleToggleFavorite(stock); }}
                  onStockClick={handleStockClick}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            </div>
          </div>
          </div>
        )}
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden">
        <div className="w-full px-4 py-2">
          <div className="grid grid-cols-5 gap-1">
            <button
              onClick={() => { setActiveTab('screener'); setMobileNavTab('results'); scrollToSection('results'); }}
              className={`flex flex-col items-center py-1.5 rounded-xl text-xs font-medium transition ${activeTab === 'screener' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              Screener
            </button>
            <button
              onClick={() => setActiveTab('swing')}
              className={`flex flex-col items-center py-1.5 rounded-xl text-xs font-medium transition ${activeTab === 'swing' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <TrendingUp className="w-5 h-5 mb-0.5" />
              Swing
            </button>
            <button
              onClick={() => setActiveTab('scalping')}
              className={`flex flex-col items-center py-1.5 rounded-xl text-xs font-medium transition ${activeTab === 'scalping' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Zap className="w-5 h-5 mb-0.5" />
              Scalping
            </button>
            <button
              onClick={() => { setMobileNavTab('watchlist'); scrollToSection('watchlist'); }}
              className={`flex flex-col items-center py-1.5 rounded-xl text-xs font-medium transition ${mobileNavTab === 'watchlist' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Star className="w-5 h-5 mb-0.5" />
              Watchlist
            </button>
            <button
              onClick={() => fetchStocks(true)}
              className="flex flex-col items-center py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              <RefreshCw className={`w-5 h-5 mb-0.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </nav>

      {selectedStockForNotification && (
        <NotificationModal
          stock={selectedStockForNotification}
          existingSetting={notifications[selectedStockForNotification.id]}
          onSave={handleSaveNotification}
          onCancel={() => setSelectedStockForNotification(null)}
          onRemove={handleRemoveNotification}
        />
      )}

      {selectedStockForDetail && (
        <StockDetailPage
          stock={selectedStockForDetail}
          onBack={() => setSelectedStockForDetail(null)}
          onSetNotification={setSelectedStockForNotification}
          hasNotification={!!notifications[selectedStockForDetail.id]}
          allStocks={stocks}
        />
      )}
    </div>
  );
}
