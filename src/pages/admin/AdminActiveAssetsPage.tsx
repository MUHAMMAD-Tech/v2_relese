import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, PieChart as PieChartIcon, BarChart3, Eye } from 'lucide-react';
import { getActiveAssets, type ActiveAssetData, type AssetHolderBreakdown } from '@/db/api';
import { useAppStore } from '@/store/appStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const CHART_COLORS = [
  '#00d4ff', // Electric blue (primary)
  '#fbbf24', // Amber
  '#10b981', // Green
  '#8b5cf6', // Purple
  '#f59e0b', // Orange
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Deep orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export default function AdminActiveAssetsPage() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<ActiveAssetData[]>([]);
  const [totalUsd, setTotalUsd] = useState(0);
  const [totalKgs, setTotalKgs] = useState(0);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [selectedAsset, setSelectedAsset] = useState<ActiveAssetData | null>(null);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const { prices } = useAppStore();

  useEffect(() => {
    loadActiveAssets();
  }, []);

  useEffect(() => {
    // Recalculate values when prices change
    if (assets.length > 0 && Object.keys(prices).length > 0) {
      calculateValues();
    }
  }, [prices, assets]);

  const loadActiveAssets = async () => {
    setLoading(true);
    const data = await getActiveAssets();
    setAssets(data.assets);
    setLoading(false);
  };

  const calculateValues = () => {
    const updatedAssets = assets.map(asset => {
      const priceData = prices[asset.symbol.toLowerCase()];
      const priceUsd = priceData?.price_usdt || 0;
      const totalAmount = parseFloat(asset.totalAmount);
      const totalUsdValue = totalAmount * priceUsd;
      const totalKgsValue = totalUsdValue * 87;

      // Update holders with USD values
      const updatedHolders = asset.holders.map(holder => ({
        ...holder,
        usdValue: parseFloat(holder.amount) * priceUsd,
      }));

      return {
        ...asset,
        priceUsd,
        totalUsdValue,
        totalKgsValue,
        holders: updatedHolders,
      };
    });

    setAssets(updatedAssets);

    // Calculate totals
    const totalUsdValue = updatedAssets.reduce((sum, asset) => sum + asset.totalUsdValue, 0);
    const totalKgsValue = totalUsdValue * 87;
    setTotalUsd(totalUsdValue);
    setTotalKgs(totalKgsValue);
  };

  const handleAssetClick = (asset: ActiveAssetData) => {
    setSelectedAsset(asset);
    setShowBreakdownModal(true);
  };

  const maskAccessCode = (code: string): string => {
    if (!code || code.length < 4) return '****';
    return '****' + code.slice(-3);
  };

  const exportToCSV = () => {
    // Prepare CSV data
    const headers = ['Asset Symbol', 'Total Amount', 'Price USD', 'Total Value USD', 'Total Value KGS'];
    const rows = assets.map(asset => [
      asset.symbol,
      asset.totalAmount,
      asset.priceUsd.toFixed(2),
      asset.totalUsdValue.toFixed(2),
      asset.totalKgsValue.toFixed(2),
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total,,,$${totalUsd.toFixed(2)},${totalKgs.toFixed(2)} KGS`,
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `active_assets_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportHolderBreakdownCSV = (asset: ActiveAssetData) => {
    // Prepare CSV data for holder breakdown
    const headers = ['Holder Name', 'Amount', 'USD Value'];
    const rows = asset.holders.map(holder => [
      holder.holderName,
      holder.amount,
      holder.usdValue.toFixed(2),
    ]);

    // Create CSV content
    const csvContent = [
      `${asset.symbol} - Holder Distribution`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total,${asset.totalAmount},${asset.totalUsdValue.toFixed(2)}`,
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${asset.symbol}_holder_breakdown_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare chart data
  const chartData = assets
    .filter(asset => asset.totalUsdValue > 0)
    .map((asset, index) => ({
      name: asset.symbol,
      value: asset.totalUsdValue,
      percentage: totalUsd > 0 ? ((asset.totalUsdValue / totalUsd) * 100).toFixed(2) : '0',
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-bold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-primary">{data.percentage}% of portfolio</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto p-4 xl:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Active Assets</h1>
          <p className="text-muted-foreground">Aggregated portfolio across all holders</p>
        </div>
        <Button onClick={exportToCSV} disabled={assets.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full bg-muted" />
          <Skeleton className="h-96 w-full bg-muted" />
        </div>
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No active assets yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Assets will appear here once holders have balances
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Value (USDT)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Value (KGS)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {totalKgs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} сом
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{assets.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Composition Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Portfolio Composition</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={chartType === 'pie' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartType('pie')}
                    >
                      <PieChartIcon className="h-4 w-4 mr-2" />
                      Pie
                    </Button>
                    <Button
                      variant={chartType === 'bar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartType('bar')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Bar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  {chartType === 'pie' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} ${percentage}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#00d4ff">
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assets List */}
          <Card>
            <CardHeader>
              <CardTitle>Assets Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden xl:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Asset</th>
                        <th className="text-right py-3 px-4 font-medium">Total Amount</th>
                        <th className="text-right py-3 px-4 font-medium">Price (USD)</th>
                        <th className="text-right py-3 px-4 font-medium">Value (USD)</th>
                        <th className="text-right py-3 px-4 font-medium">Value (KGS)</th>
                        <th className="text-center py-3 px-4 font-medium">Holders</th>
                        <th className="text-center py-3 px-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset) => (
                        <tr
                          key={asset.symbol}
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleAssetClick(asset)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {asset.logoUrl && (
                                <img
                                  src={asset.logoUrl}
                                  alt={asset.name}
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              <div>
                                <p className="font-bold">{asset.symbol}</p>
                                <p className="text-sm text-muted-foreground">{asset.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {parseFloat(asset.totalAmount).toFixed(4)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            ${asset.priceUsd.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            ${asset.totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {asset.totalKgsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="secondary">{asset.holders.length}</Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="xl:hidden space-y-4">
                {assets.map((asset) => (
                  <Card
                    key={asset.symbol}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleAssetClick(asset)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {asset.logoUrl && (
                            <img
                              src={asset.logoUrl}
                              alt={asset.name}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-bold">{asset.symbol}</p>
                            <p className="text-sm text-muted-foreground">{asset.name}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{asset.holders.length} holders</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Amount:</p>
                          <p className="font-mono">{parseFloat(asset.totalAmount).toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Price:</p>
                          <p className="font-mono">${asset.priceUsd.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Value (USD):</p>
                          <p className="font-mono">${asset.totalUsdValue.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Value (KGS):</p>
                          <p className="font-mono">{asset.totalKgsValue.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Asset Holder Breakdown Modal */}
      <Dialog open={showBreakdownModal} onOpenChange={setShowBreakdownModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedAsset?.logoUrl && (
                <img
                  src={selectedAsset.logoUrl}
                  alt={selectedAsset.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span>{selectedAsset?.symbol} — Holder Distribution</span>
            </DialogTitle>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-4">
              {/* Asset Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold">{parseFloat(selectedAsset.totalAmount).toFixed(8)} {selectedAsset.symbol}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-lg font-bold">${selectedAsset.totalUsdValue.toFixed(2)}</p>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportHolderBreakdownCSV(selectedAsset)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Breakdown
                </Button>
              </div>

              {/* Holders List */}
              {selectedAsset.holders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No holders currently hold this asset</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAsset.holders
                    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
                    .map((holder, index) => (
                      <div
                        key={holder.holderId}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
                      >
                        <div className="flex-1">
                          <p className="font-semibold">{holder.holderName}</p>
                          <p className="text-sm text-muted-foreground">
                            Access Code: {maskAccessCode(holder.holderAccessCode)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold">
                            {parseFloat(holder.amount).toFixed(8)} {selectedAsset.symbol}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${holder.usdValue.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {((parseFloat(holder.amount) / parseFloat(selectedAsset.totalAmount)) * 100).toFixed(2)}% of total
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
