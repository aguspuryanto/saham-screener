import React, { useState } from 'react';
import { Stock } from '../../../domain/models/Stock';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export interface NotificationSetting {
  stockId: string;
  ticker: string;
  basePrice: number;
  upThresholdPercent: number;
  downThresholdPercent: number;
}

interface NotificationModalProps {
  stock: Stock;
  existingSetting?: NotificationSetting;
  onSave: (setting: NotificationSetting) => void;
  onCancel: () => void;
  onRemove: (stockId: string) => void;
}

export function NotificationModal({ stock, existingSetting, onSave, onCancel, onRemove }: NotificationModalProps) {
  const [upPercent, setUpPercent] = useState<number>(existingSetting?.upThresholdPercent || 5);
  const [downPercent, setDownPercent] = useState<number>(existingSetting?.downThresholdPercent || 3);

  const handleSave = () => {
    onSave({
      stockId: stock.id,
      ticker: stock.ticker,
      basePrice: stock.lastClose,
      upThresholdPercent: upPercent,
      downThresholdPercent: downPercent,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set Price Alert for {stock.ticker}</CardTitle>
          <p className="text-sm text-slate-500">Current Price: Rp {stock.lastClose.toLocaleString('id-ID')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notify if price goes UP by (%)
            </label>
            <div className="flex items-center space-x-2">
              <input 
                type="number" 
                value={upPercent}
                onChange={(e) => setUpPercent(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                min="0.1"
                step="0.1"
              />
              <span className="text-sm text-slate-500 w-24">
                (Rp {Math.round(stock.lastClose * (1 + upPercent / 100)).toLocaleString('id-ID')})
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notify if price goes DOWN by (%)
            </label>
            <div className="flex items-center space-x-2">
              <input 
                type="number" 
                value={downPercent}
                onChange={(e) => setDownPercent(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                min="0.1"
                step="0.1"
              />
              <span className="text-sm text-slate-500 w-24">
                (Rp {Math.round(stock.lastClose * (1 - downPercent / 100)).toLocaleString('id-ID')})
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {existingSetting ? (
            <Button variant="danger" onClick={() => onRemove(stock.id)}>Remove Alert</Button>
          ) : (
            <div /> // Spacer
          )}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleSave}>Save Alert</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
