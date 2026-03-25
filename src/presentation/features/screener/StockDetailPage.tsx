import React, { useState } from 'react';
import { Stock } from '../../../domain/models/Stock';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  BarChart2, 
  Bell, 
  BellRing, 
  Star, 
  DollarSign, 
  Target, 
  Users,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp as TrendingIcon,
  PieChart,
  Calculator,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Shield,
  TrendingDown as BearishIcon,
  ArrowUpRight as BullishIcon
} from 'lucide-react';
import { cn } from '../../../utils/cn';

interface StockDetailPageProps {
  stock: Stock;
  onBack: () => void;
  onSetNotification?: (stock: Stock) => void;
  hasNotification?: boolean;
}

export function StockDetailPage({ stock, onBack, onSetNotification, hasNotification }: StockDetailPageProps) {
  console.log('StockDetailPage rendered for:', stock.ticker);
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'fundamental' | 'trading'>('trading');
  
  const isPositive = stock.percentChange >= 0;

  // Analisa Trading Komprehensif
  const getTradingAnalysis = (stock: Stock) => {
    const rsi = stock.technical.rsi14;
    const macd = stock.technical.macd;
    const macdSignal = stock.technical.macdSignal;
    const volRatio = stock.technical.volRatio;
    const pbv = stock.fundamental.pbv;
    const per = stock.fundamental.per;
    const eps = stock.fundamental.eps;
    const roe = stock.fundamental.roe;
    
    // Kondisi Umum
    const trend = stock.percentChange >= -2 ? 'sideways' : stock.percentChange >= -5 ? 'weak downtrend' : 'strong downtrend';
    const volatility = volRatio >= 2 ? 'high' : volRatio >= 1.5 ? 'medium' : 'low';
    
    // Analisa Teknikal
    const rsiStatus = rsi >= 70 ? 'overbought' : rsi <= 30 ? 'oversold' : rsi <= 40 ? 'near oversold' : rsi >= 60 ? 'near overbought' : 'neutral';
    const macdSignalStatus = macd > macdSignal ? 'bullish' : 'bearish';
    const emaCross = stock.technical.ema20 > stock.technical.ema50 ? 'golden cross' : 'death cross';
    
    // Analisa Fundamental
    const fundamentalHealth = eps > 0 && roe > 0 && per > 0 && per < 20 ? 'healthy' : eps > 0 ? 'weak' : 'poor';
    const valuation = pbv < 1 ? 'undervalued' : pbv < 2 ? 'fair' : pbv < 3 ? 'expensive' : 'very expensive';
    
    // Analisa Bandar/Market Maker
    let bandarActivity = 'unknown';
    if (volRatio >= 2 && volatility === 'high') {
      bandarActivity = stock.percentChange < -5 ? 'distribution' : 'accumulation';
    } else if (volRatio >= 1.5) {
      bandarActivity = 'moderate activity';
    } else {
      bandarActivity = 'low activity';
    }
    
    // Strategi Trading Recommendations
    const scalpingRecommendation = {
      suitable: volatility === 'high' || volatility === 'medium',
      confidence: volatility === 'high' ? 85 : volatility === 'medium' ? 70 : 40,
      entryRange: {
        min: stock.lastClose * 0.98,
        max: stock.lastClose * 1.02
      },
      targetRange: {
        min: stock.lastClose * 1.03,
        max: stock.lastClose * 1.07
      },
      stopLoss: stock.lastClose * 0.95
    };
    
    const swingRecommendation = {
      suitable: trend === 'sideways' || (trend === 'weak downtrend' && rsiStatus === 'near oversold'),
      confidence: trend === 'sideways' ? 75 : trend === 'weak downtrend' ? 60 : 30,
      entryCondition: stock.lastClose > stock.technical.ema20,
      target: stock.lastClose * 1.15,
      stopLoss: stock.lastClose * 0.92
    };
    
    // Risk Level
    const riskLevel = fundamentalHealth === 'poor' && volatility === 'high' ? 'very high' :
                     fundamentalHealth === 'poor' ? 'high' :
                     volatility === 'high' ? 'medium-high' :
                     fundamentalHealth === 'weak' ? 'medium' : 'low';
    
    return {
      trend,
      volatility,
      rsiStatus,
      macdSignal: macdSignalStatus,
      emaCross,
      fundamentalHealth,
      valuation,
      bandarActivity,
      scalpingRecommendation,
      swingRecommendation,
      riskLevel,
      marketCap: pbv > 0 ? 'small cap' : 'unknown', // Simplified
      liquidity: volRatio >= 2 ? 'high' : volRatio >= 1.5 ? 'medium' : 'low'
    };
  };

  const analysis = getTradingAnalysis(stock);

  // Helper functions untuk UI
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'very high': return 'danger';
      case 'high': return 'danger';
      case 'medium-high': return 'warning';
      case 'medium': return 'warning';
      default: return 'success';
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'bullish': case 'golden cross': case 'overbought': return 'success';
      case 'bearish': case 'death cross': case 'oversold': return 'danger';
      default: return 'neutral';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'success';
      case 'weak': return 'warning';
      case 'poor': return 'danger';
      default: return 'neutral';
    }
  };

  const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  const tabs = [
    { id: 'trading', label: 'Trading Analysis', icon: <Zap className="w-4 h-4" /> },
    { id: 'overview', label: 'Overview', icon: <Info className="w-4 h-4" /> },
    { id: 'technical', label: 'Technical', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'fundamental', label: 'Fundamental', icon: <Calculator className="w-4 h-4" /> },
  ];

  const getRecColor = (rec: string) => {
    switch (rec) {
      case 'BUY':
      case 'ACCUMULATE':
        return 'success';
      case 'SELL':
      case 'REDUCE':
        return 'danger';
      case 'HOLD':
      case 'NEUTRAL':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const getDcfColor = (status: string) => {
    switch (status) {
      case 'Undervalued': return 'success';
      case 'Overvalued': return 'danger';
      case 'Fair Value': return 'warning';
      default: return 'neutral';
    }
  };

  const getConsensusColor = (rating: string) => {
    switch (rating) {
      case 'Strong Buy':
      case 'Buy': return 'success';
      case 'Strong Sell':
      case 'Sell': return 'danger';
      case 'Hold': return 'warning';
      default: return 'neutral';
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'Momentum': return <TrendingUp className="w-4 h-4 mr-2" />;
      case 'Reversal': return <Activity className="w-4 h-4 mr-2" />;
      case 'Breakout': return <ArrowUpRight className="w-4 h-4 mr-2" />;
      case 'Consolidation': return <BarChart2 className="w-4 h-4 mr-2" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 fixed inset-0 z-50 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={onBack}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{stock.ticker}</h1>
                <p className="text-sm text-slate-500">{stock.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onSetNotification?.(stock)}
                className={cn("p-2 rounded-full transition-colors", hasNotification ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400 hover:text-slate-600")}
                title="Set Price Alert"
              >
                {hasNotification ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </button>
              <Badge variant={getRecColor(stock.recommendation)} className="text-sm font-semibold px-3 py-1">
                {stock.recommendation}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Price and Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-3xl font-bold text-slate-900 mb-2">
                      Rp {stock.lastClose.toLocaleString('id-ID')}
                    </div>
                    <div className={cn("flex items-center text-lg font-medium", isPositive ? "text-emerald-600" : "text-red-600")}>
                      {isPositive ? <ArrowUpRight className="w-5 h-5 mr-1" /> : <ArrowDownRight className="w-5 h-5 mr-1" />}
                      {Math.abs(stock.percentChange).toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {stock.lastUpdated}
                    </div>
                    <div className="mt-1">
                      <Badge variant="neutral" className="bg-slate-100 text-slate-600 border-slate-200">
                        {stock.sector}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="text-xs text-slate-500 mb-1">Strategy</div>
                    <div className="flex items-center text-sm font-semibold text-slate-900">
                      {getStrategyIcon(stock.strategy)}
                      {stock.strategy}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="text-xs text-slate-500 mb-1">DCF Status</div>
                    <Badge variant={getDcfColor(stock.dcf.status)} className="text-xs">
                      <Target className="w-3 h-3 mr-1" />
                      {stock.dcf.status}
                    </Badge>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="text-xs text-slate-500 mb-1">Broker Rating</div>
                    <Badge variant={getConsensusColor(stock.consensus.rating)} className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      {stock.consensus.rating}
                    </Badge>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="text-xs text-slate-500 mb-1">Analysts</div>
                    <div className="flex items-center text-sm font-semibold text-slate-900">
                      <Users className="w-4 h-4 mr-1" />
                      {stock.consensus.analystsCount}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Broker Consensus Card */}
          <div>
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Broker Consensus
                </h3>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {stock.consensus.averageRating.toFixed(1)}/5.0
                  </div>
                  <Badge variant={getConsensusColor(stock.consensus.rating)} className="mb-3">
                    {stock.consensus.rating}
                  </Badge>
                  <div className="text-sm text-slate-600">
                    Based on {stock.consensus.analystsCount} analysts
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Strong Buy</span>
                    <div className="flex-1 mx-3 bg-slate-200 rounded-full h-2">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{width: '20%'}}></div>
                    </div>
                    <span className="text-slate-900 font-medium">20%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Buy</span>
                    <div className="flex-1 mx-3 bg-slate-200 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{width: '35%'}}></div>
                    </div>
                    <span className="text-slate-900 font-medium">35%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Hold</span>
                    <div className="flex-1 mx-3 bg-slate-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{width: '30%'}}></div>
                    </div>
                    <span className="text-slate-900 font-medium">30%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Sell</span>
                    <div className="flex-1 mx-3 bg-slate-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{width: '10%'}}></div>
                    </div>
                    <span className="text-slate-900 font-medium">10%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Strong Sell</span>
                    <div className="flex-1 mx-3 bg-slate-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{width: '5%'}}></div>
                    </div>
                    <span className="text-slate-900 font-medium">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Technical Overview */}
              <Card className="border-slate-200">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <BarChart2 className="w-5 h-5 mr-2" />
                    Technical Analysis
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">RSI(14)</div>
                      <div className={cn("text-lg font-semibold", 
                        stock.technical.rsi14 < 30 ? "text-emerald-600" : 
                        stock.technical.rsi14 > 70 ? "text-red-600" : "text-slate-700"
                      )}>
                        {stock.technical.rsi14}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {stock.technical.rsi14 < 30 ? 'Oversold' : stock.technical.rsi14 > 70 ? 'Overbought' : 'Neutral'}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">MACD Signal</div>
                      <div className={cn("text-lg font-semibold", 
                        stock.technical.macd > stock.technical.macdSignal ? "text-emerald-600" : "text-red-600"
                      )}>
                        {stock.technical.macd > stock.technical.macdSignal ? 'Bullish' : 'Bearish'}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {stock.technical.macd > stock.technical.macdSignal ? 'Buy Signal' : 'Sell Signal'}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Volume Ratio</div>
                      <div className={cn("text-lg font-semibold", 
                        stock.technical.volRatio > 1.5 ? "text-emerald-600" : 
                        stock.technical.volRatio < 0.5 ? "text-red-600" : "text-slate-700"
                      )}>
                        {stock.technical.volRatio}x
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {stock.technical.volRatio > 1.5 ? 'High Volume' : stock.technical.volRatio < 0.5 ? 'Low Volume' : 'Normal'}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">EMA Cross</div>
                      <div className={cn("text-lg font-semibold", 
                        stock.technical.ema20 > stock.technical.ema50 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {stock.technical.ema20 > stock.technical.ema50 ? 'Golden Cross' : 'Death Cross'}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {stock.technical.ema20 > stock.technical.ema50 ? 'Bullish Trend' : 'Bearish Trend'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fundamental Overview */}
              <Card className="border-slate-200">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Calculator className="w-5 h-5 mr-2" />
                    Fundamental Metrics
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Price to Book Value</div>
                      <div className={cn("text-lg font-semibold", 
                        stock.fundamental.pbv < 1 ? "text-emerald-600" : "text-slate-700"
                      )}>
                        {stock.fundamental.pbv}x
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {stock.fundamental.pbv < 1 ? 'Undervalued' : 'Fair Value'}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Price to Earnings</div>
                      <div className="text-lg font-semibold text-slate-700">
                        {stock.fundamental.per}x
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {stock.fundamental.per < 15 ? 'Low P/E' : stock.fundamental.per > 25 ? 'High P/E' : 'Moderate'}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Earnings Per Share</div>
                      <div className="text-lg font-semibold text-slate-700">
                        Rp {stock.fundamental.eps.toLocaleString('id-ID')}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Per share earnings
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Dividend Yield</div>
                      <div className={cn("text-lg font-semibold", 
                        stock.fundamental.dy > 3 ? "text-emerald-600" : "text-slate-700"
                      )}>
                        {stock.fundamental.dy}%
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {stock.fundamental.dy > 3 ? 'Good Yield' : 'Low Yield'}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Return on Equity</div>
                      <div className={cn("text-lg font-semibold", 
                        stock.fundamental.roe > 15 ? "text-emerald-600" : "text-slate-700"
                      )}>
                        {stock.fundamental.roe}%
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {stock.fundamental.roe > 15 ? 'High ROE' : 'Moderate ROE'}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Intrinsic Value</div>
                      <div className="text-lg font-semibold text-slate-700">
                        Rp {stock.dcf.intrinsicValue.toLocaleString('id-ID')}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        DCF Calculation
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'technical' && (
            <Card className="border-slate-200">
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Technical Analysis Details</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">RSI Indicators</h4>
                    <div className="space-y-3">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">RSI(14)</span>
                          <span className={cn("font-semibold", 
                            stock.technical.rsi14 < 30 ? "text-emerald-600" : 
                            stock.technical.rsi14 > 70 ? "text-red-600" : "text-slate-700"
                          )}>
                            {stock.technical.rsi14}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={cn("h-2 rounded-full", 
                              stock.technical.rsi14 < 30 ? "bg-emerald-600" : 
                              stock.technical.rsi14 > 70 ? "bg-red-600" : "bg-yellow-500"
                            )}
                            style={{width: `${stock.technical.rsi14}%`}}
                          ></div>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">RSI(12)</span>
                          <span className={cn("font-semibold", 
                            stock.technical.rsi12 < 40 ? "text-emerald-600" : 
                            stock.technical.rsi12 > 60 ? "text-red-600" : "text-slate-700"
                          )}>
                            {stock.technical.rsi12}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={cn("h-2 rounded-full", 
                              stock.technical.rsi12 < 40 ? "bg-emerald-600" : 
                              stock.technical.rsi12 > 60 ? "bg-red-600" : "bg-yellow-500"
                            )}
                            style={{width: `${stock.technical.rsi12}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Moving Averages</h4>
                    <div className="space-y-3">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">EMA20</span>
                          <span className="font-semibold text-slate-700">
                            Rp {stock.technical.ema20.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">EMA50</span>
                          <span className="font-semibold text-slate-700">
                            Rp {stock.technical.ema50.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                      <div className={cn("rounded-lg p-3 border", 
                        stock.technical.ema20 > stock.technical.ema50 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                      )}>
                        <div className="flex items-center">
                          {stock.technical.ema20 > stock.technical.ema50 ? 
                            <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" /> :
                            <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
                          }
                          <span className={cn("font-medium text-sm", 
                            stock.technical.ema20 > stock.technical.ema50 ? "text-emerald-700" : "text-red-700"
                          )}>
                            {stock.technical.ema20 > stock.technical.ema50 ? 'Golden Cross - Bullish' : 'Death Cross - Bearish'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Volume & MACD</h4>
                    <div className="space-y-3">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">Volume Ratio</span>
                          <span className={cn("font-semibold", 
                            stock.technical.volRatio > 1.5 ? "text-emerald-600" : 
                            stock.technical.volRatio < 0.5 ? "text-red-600" : "text-slate-700"
                          )}>
                            {stock.technical.volRatio}x
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={cn("h-2 rounded-full", 
                              stock.technical.volRatio > 1.5 ? "bg-emerald-600" : 
                              stock.technical.volRatio < 0.5 ? "bg-red-600" : "bg-yellow-500"
                            )}
                            style={{width: `${Math.min(stock.technical.volRatio * 20, 100)}%`}}
                          ></div>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">MACD</span>
                          <span className="font-semibold text-slate-700">
                            {stock.technical.macd.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">MACD Signal</span>
                          <span className="font-semibold text-slate-700">
                            {stock.technical.macdSignal.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <div className={cn("rounded-lg p-3 border", 
                        stock.technical.macd > stock.technical.macdSignal ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                      )}>
                        <div className="flex items-center">
                          {stock.technical.macd > stock.technical.macdSignal ? 
                            <ArrowUpRight className="w-4 h-4 mr-2 text-emerald-600" /> :
                            <ArrowDownRight className="w-4 h-4 mr-2 text-red-600" />
                          }
                          <span className={cn("font-medium text-sm", 
                            stock.technical.macd > stock.technical.macdSignal ? "text-emerald-700" : "text-red-700"
                          )}>
                            {stock.technical.macd > stock.technical.macdSignal ? 'Bullish Crossover' : 'Bearish Crossover'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'fundamental' && (
            <Card className="border-slate-200">
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Fundamental Analysis</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Valuation Ratios</h4>
                    <div className="space-y-3">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">P/BV Ratio</span>
                          <span className={cn("font-semibold", 
                            stock.fundamental.pbv < 1 ? "text-emerald-600" : "text-slate-700"
                          )}>
                            {stock.fundamental.pbv}x
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          {stock.fundamental.pbv < 1 ? 'Trading below book value' : 'Trading at or above book value'}
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">P/E Ratio</span>
                          <span className="font-semibold text-slate-700">
                            {stock.fundamental.per}x
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          {stock.fundamental.per < 15 ? 'Low valuation' : stock.fundamental.per > 25 ? 'High valuation' : 'Moderate valuation'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Profitability</h4>
                    <div className="space-y-3">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">ROE</span>
                          <span className={cn("font-semibold", 
                            stock.fundamental.roe > 15 ? "text-emerald-600" : "text-slate-700"
                          )}>
                            {stock.fundamental.roe}%
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          {stock.fundamental.roe > 15 ? 'Excellent profitability' : 'Moderate profitability'}
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">Earnings Per Share</span>
                          <span className="font-semibold text-slate-700">
                            Rp {stock.fundamental.eps.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          Profit allocated to each share
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Dividend Info</h4>
                    <div className="space-y-3">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">Dividend Yield</span>
                          <span className={cn("font-semibold", 
                            stock.fundamental.dy > 3 ? "text-emerald-600" : "text-slate-700"
                          )}>
                            {stock.fundamental.dy}%
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          {stock.fundamental.dy > 3 ? 'Attractive dividend yield' : 'Low dividend yield'}
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">Annual Dividend</span>
                          <span className="font-semibold text-slate-700">
                            Rp {(stock.lastClose * stock.fundamental.dy / 100).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          Estimated annual dividend per share
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'valuation' && (
            <Card className="border-slate-200">
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">DCF Valuation Analysis</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Valuation Summary</h4>
                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm text-slate-600">Current Price</span>
                          <span className="text-lg font-semibold text-slate-900">
                            Rp {stock.lastClose.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm text-slate-600">Intrinsic Value</span>
                          <span className="text-lg font-semibold text-slate-900">
                            Rp {stock.dcf.intrinsicValue.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="border-t border-slate-200 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Potential Return</span>
                            <span className={cn("text-lg font-semibold", 
                              stock.dcf.status === 'Undervalued' ? "text-emerald-600" : 
                              stock.dcf.status === 'Overvalued' ? "text-red-600" : "text-slate-700"
                            )}>
                              {stock.dcf.status === 'Undervalued' ? '+' : stock.dcf.status === 'Overvalued' ? '-' : ''}
                              {Math.abs(((stock.dcf.intrinsicValue - stock.lastClose) / stock.lastClose * 100)).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={cn("rounded-lg p-4 border", 
                        stock.dcf.status === 'Undervalued' ? "bg-emerald-50 border-emerald-200" : 
                        stock.dcf.status === 'Overvalued' ? "bg-red-50 border-red-200" : 
                        "bg-yellow-50 border-yellow-200"
                      )}>
                        <div className="flex items-center">
                          <Target className="w-5 h-5 mr-2" />
                          <Badge variant={getDcfColor(stock.dcf.status)} className="text-sm">
                            {stock.dcf.status}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-slate-700">
                          {stock.dcf.status === 'Undervalued' ? 
                            'Stock is trading below its intrinsic value, presenting a buying opportunity.' :
                            stock.dcf.status === 'Overvalued' ? 
                            'Stock is trading above its intrinsic value, may be overpriced.' :
                            'Stock is trading at its fair value.'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Valuation Methodology</h4>
                    <div className="space-y-3">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <h5 className="text-sm font-medium text-slate-900 mb-2">Discounted Cash Flow (DCF)</h5>
                        <p className="text-xs text-slate-600 mb-2">
                          DCF analysis projects future cash flows and discounts them back to present value to determine intrinsic value.
                        </p>
                        <div className="space-y-1 text-xs text-slate-600">
                          <div>• Projects 5-year cash flows</div>
                          <div>• Uses appropriate discount rate</div>
                          <div>• Includes terminal value calculation</div>
                          <div>• Accounts for growth assumptions</div>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <h5 className="text-sm font-medium text-slate-900 mb-2">Key Assumptions</h5>
                        <div className="space-y-1 text-xs text-slate-600">
                          <div>• Revenue growth rate: Industry average</div>
                          <div>• Discount rate: WACC + risk premium</div>
                          <div>• Terminal growth: 2-3% (GDP growth)</div>
                          <div>• Margin assumptions: Historical trends</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'trading' && (
            <div className="space-y-6">
              {/* Trading Overview */}
              <Card className="border-slate-200">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Trading Analysis Overview
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Trend Status</div>
                      <Badge variant={analysis.trend.includes('downtrend') ? 'danger' : analysis.trend === 'sideways' ? 'warning' : 'success'} className="text-sm">
                        {analysis.trend === 'strong downtrend' ? <BearishIcon className="w-3 h-3 mr-1" /> : 
                         analysis.trend === 'sideways' ? <Activity className="w-3 h-3 mr-1" /> :
                         <BullishIcon className="w-3 h-3 mr-1" />}
                        {analysis.trend}
                      </Badge>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Volatility</div>
                      <Badge variant={analysis.volatility === 'high' ? 'danger' : analysis.volatility === 'medium' ? 'warning' : 'success'} className="text-sm">
                        {analysis.volatility}
                      </Badge>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Risk Level</div>
                      <Badge variant={getRiskColor(analysis.riskLevel)} className="text-sm">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {analysis.riskLevel}
                      </Badge>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Liquidity</div>
                      <Badge variant={analysis.liquidity === 'high' ? 'success' : analysis.liquidity === 'medium' ? 'warning' : 'danger'} className="text-sm">
                        {analysis.liquidity}
                      </Badge>
                    </div>
                  </div>

                  {/* Market Maker Activity */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center mb-2">
                      <Activity className="w-5 h-5 text-amber-600 mr-2" />
                      <h4 className="font-semibold text-amber-900">Bandar Activity Analysis</h4>
                    </div>
                    <div className="text-sm text-amber-800">
                      <p className="mb-2">Current Activity: <span className="font-semibold">{analysis.bandarActivity}</span></p>
                      {analysis.bandarActivity === 'distribution' && (
                        <p className="text-xs text-amber-700">⚠️ High volume with price decline suggests distribution (selling pressure)</p>
                      )}
                      {analysis.bandarActivity === 'accumulation' && (
                        <p className="text-xs text-green-700">✅ High volume with price stability suggests accumulation (buying interest)</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scalping Strategy */}
              <Card className="border-slate-200">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Scalping Strategy (Intraday)
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-slate-900">Suitability</h4>
                        <Badge variant={analysis.scalpingRecommendation.suitable ? 'success' : 'danger'} className="text-sm">
                          {analysis.scalpingRecommendation.suitable ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {analysis.scalpingRecommendation.suitable ? 'Suitable' : 'Not Suitable'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <div className="text-xs text-slate-500 mb-1">Confidence Level</div>
                          <div className="flex items-center">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 mr-3">
                              <div 
                                className="bg-emerald-600 h-2 rounded-full" 
                                style={{ width: `${analysis.scalpingRecommendation.confidence}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold">{analysis.scalpingRecommendation.confidence}%</span>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <h5 className="text-sm font-medium text-blue-900 mb-2">Entry Range</h5>
                          <div className="text-sm text-blue-800">
                            {formatCurrency(analysis.scalpingRecommendation.entryRange.min)} - {formatCurrency(analysis.scalpingRecommendation.entryRange.max)}
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                          <h5 className="text-sm font-medium text-green-900 mb-2">Target Range</h5>
                          <div className="text-sm text-green-800">
                            {formatCurrency(analysis.scalpingRecommendation.targetRange.min)} - {formatCurrency(analysis.scalpingRecommendation.targetRange.max)}
                          </div>
                          <div className="text-xs text-green-700 mt-1">
                            Target: {formatPercent((analysis.scalpingRecommendation.targetRange.min / stock.lastClose) - 1)} - {formatPercent((analysis.scalpingRecommendation.targetRange.max / stock.lastClose) - 1)}
                          </div>
                        </div>

                        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                          <h5 className="text-sm font-medium text-red-900 mb-2">Stop Loss</h5>
                          <div className="text-sm text-red-800">
                            {formatCurrency(analysis.scalpingRecommendation.stopLoss)}
                          </div>
                          <div className="text-xs text-red-700 mt-1">
                            Risk: {formatPercent((analysis.scalpingRecommendation.stopLoss / stock.lastClose) - 1)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-4">Trading Rules</h4>
                      <div className="space-y-3">
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <h5 className="text-sm font-medium text-slate-900 mb-2">Entry Triggers</h5>
                          <ul className="text-xs text-slate-600 space-y-1">
                            <li>• Volume surge &gt; 2x average</li>
                            <li>• Price within entry range</li>
                            <li>• Reversal candle pattern (hammer/engulfing)</li>
                            <li>• RSI not in extreme zones</li>
                          </ul>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <h5 className="text-sm font-medium text-slate-900 mb-2">Exit Conditions</h5>
                          <ul className="text-xs text-slate-600 space-y-1">
                            <li>• Target price reached</li>
                            <li>• Reversal signal detected</li>
                            <li>• Volume drops significantly</li>
                            <li>• Stop loss triggered</li>
                          </ul>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <h5 className="text-sm font-medium text-yellow-900 mb-2 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Scalping Warnings
                          </h5>
                          <ul className="text-xs text-yellow-800 space-y-1">
                            <li>• High frequency trading required</li>
                            <li>• Strict discipline essential</li>
                            <li>• Transaction costs impact profits</li>
                            <li>• Not suitable for beginners</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Swing Trading Strategy */}
              <Card className="border-slate-200">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Swing Trading Strategy (2-5 days)
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-slate-900">Suitability</h4>
                        <Badge variant={analysis.swingRecommendation.suitable ? 'success' : 'warning'} className="text-sm">
                          {analysis.swingRecommendation.suitable ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                          {analysis.swingRecommendation.suitable ? 'Suitable' : 'Wait for Better Setup'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <div className="text-xs text-slate-500 mb-1">Confidence Level</div>
                          <div className="flex items-center">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 mr-3">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${analysis.swingRecommendation.confidence}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold">{analysis.swingRecommendation.confidence}%</span>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <h5 className="text-sm font-medium text-blue-900 mb-2">Target Price</h5>
                          <div className="text-sm text-blue-800">
                            {formatCurrency(analysis.swingRecommendation.target)}
                          </div>
                          <div className="text-xs text-blue-700 mt-1">
                            Potential: {formatPercent((analysis.swingRecommendation.target / stock.lastClose) - 1)}
                          </div>
                        </div>

                        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                          <h5 className="text-sm font-medium text-red-900 mb-2">Stop Loss</h5>
                          <div className="text-sm text-red-800">
                            {formatCurrency(analysis.swingRecommendation.stopLoss)}
                          </div>
                          <div className="text-xs text-red-700 mt-1">
                            Risk: {formatPercent((analysis.swingRecommendation.stopLoss / stock.lastClose) - 1)}
                          </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                          <h5 className="text-sm font-medium text-purple-900 mb-2">Entry Condition</h5>
                          <div className="text-sm text-purple-800">
                            Price {analysis.swingRecommendation.entryCondition ? 'Above' : 'Below'} EMA20
                          </div>
                          <div className="text-xs text-purple-700 mt-1">
                            Current: {formatCurrency(stock.lastClose)} | EMA20: {formatCurrency(stock.technical.ema20)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-4">Market Context</h4>
                      <div className="space-y-3">
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <h5 className="text-sm font-medium text-slate-900 mb-2">Technical Setup</h5>
                          <div className="text-xs text-slate-600 space-y-1">
                            <div>RSI Status: <Badge variant={getSignalColor(analysis.rsiStatus)} className="text-xs">{analysis.rsiStatus}</Badge></div>
                            <div>MACD Signal: <Badge variant={getSignalColor(analysis.macdSignal)} className="text-xs">{analysis.macdSignal}</Badge></div>
                            <div>EMA Cross: <Badge variant={getSignalColor(analysis.emaCross)} className="text-xs">{analysis.emaCross}</Badge></div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <h5 className="text-sm font-medium text-slate-900 mb-2">Best Scenarios</h5>
                          <ul className="text-xs text-slate-600 space-y-1">
                            <li>• Sideways market with clear support/resistance</li>
                            <li>• Weak downtrend with oversold conditions</li>
                            <li>• Breakout from consolidation pattern</li>
                            <li>• Positive fundamental catalysts</li>
                          </ul>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <h5 className="text-sm font-medium text-orange-900 mb-2 flex items-center">
                            <Shield className="w-4 h-4 mr-1" />
                            Risk Management
                          </h5>
                          <ul className="text-xs text-orange-800 space-y-1">
                            <li>• Position size: 1-2% max per trade</li>
                            <li>• Wait for confirmation signals</li>
                            <li>• Trail stop when profitable</li>
                            <li>• Avoid trading against strong trend</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Final Recommendation */}
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-emerald-900 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Final Trading Recommendation
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-900 mb-2">
                        {analysis.scalpingRecommendation.suitable ? '✅' : '❌'}
                      </div>
                      <div className="font-semibold text-emerald-900">Scalping</div>
                      <div className="text-sm text-emerald-700">
                        {analysis.scalpingRecommendation.suitable ? 'Recommended' : 'Not Recommended'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-900 mb-2">
                        {analysis.swingRecommendation.suitable ? '✅' : '⚠️'}
                      </div>
                      <div className="font-semibold text-emerald-900">Swing Trading</div>
                      <div className="text-sm text-emerald-700">
                        {analysis.swingRecommendation.suitable ? 'Recommended' : 'Wait for Setup'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-900 mb-2">
                        {analysis.fundamentalHealth === 'healthy' ? '⚠️' : '❌'}
                      </div>
                      <div className="font-semibold text-emerald-900">Investment</div>
                      <div className="text-sm text-emerald-700">
                        {analysis.fundamentalHealth === 'healthy' ? 'For Trading Only' : 'Not Recommended'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-white rounded-lg border border-emerald-200">
                    <h4 className="font-semibold text-emerald-900 mb-2">Key Takeaways</h4>
                    <ul className="text-sm text-emerald-800 space-y-1">
                      <li>• This stock is classified as <span className="font-semibold">{analysis.riskLevel}</span> risk</li>
                      <li>• Best suited for <span className="font-semibold">{analysis.volatility === 'high' ? 'short-term trading' : 'swing trading'}</span></li>
                      <li>• Current market maker activity: <span className="font-semibold">{analysis.bandarActivity}</span></li>
                      <li>• Fundamental health: <Badge variant={getHealthColor(analysis.fundamentalHealth)} className="text-xs">{analysis.fundamentalHealth}</Badge></li>
                      <li>• Always use stop loss and maintain strict discipline</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
