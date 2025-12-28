import { useEffect, useState } from 'react';
import { Search, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getCommissionSummary } from '@/db/api';
import { format } from 'date-fns';
import { useAppStore } from '@/store/appStore';

interface CommissionData {
  id: string;
  holder_id: string;
  fee: string;
  from_token: string;
  transaction_type: string;
  status: string;
  requested_at: string;
  holder: {
    name: string;
  } | null;
}

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [filteredCommissions, setFilteredCommissions] = useState<CommissionData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { prices } = useAppStore();

  useEffect(() => {
    loadCommissions();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCommissions(commissions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = commissions.filter(
        (c) =>
          c.holder?.name?.toLowerCase().includes(query) ||
          c.from_token?.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query)
      );
      setFilteredCommissions(filtered);
    }
  }, [searchQuery, commissions]);

  const loadCommissions = async () => {
    setLoading(true);
    const data = await getCommissionSummary();
    if (data) {
      // Cast the data to the correct type
      setCommissions(data as unknown as CommissionData[]);
      setFilteredCommissions(data as unknown as CommissionData[]);
    }
    setLoading(false);
  };

  const calculateTotalCommission = () => {
    let totalUSDT = 0;

    commissions.forEach((commission) => {
      const feeAmount = parseFloat(commission.fee);
      const token = commission.from_token.toLowerCase();
      const priceData = prices[token];
      const price = priceData?.price_usdt || 0;
      totalUSDT += feeAmount * price;
    });

    return totalUSDT;
  };

  const calculateCommissionInUSDT = (fee: string, token: string) => {
    const feeAmount = parseFloat(fee);
    const tokenLower = token.toLowerCase();
    const priceData = prices[tokenLower];
    const price = priceData?.price_usdt || 0;
    return feeAmount * price;
  };

  const totalCommissionUSDT = calculateTotalCommission();
  const KGS_RATE = 87; // 1 USDT = 87 KGS
  const totalCommissionKGS = totalCommissionUSDT * KGS_RATE;

  return (
    <div className="container mx-auto p-4 xl:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commissions</h1>
        <p className="text-muted-foreground">View all collected transaction fees</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions (USDT)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommissionUSDT.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {totalCommissionKGS.toFixed(2)} KGS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commissions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Swap transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Fee</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${commissions.length > 0 ? (totalCommissionUSDT / commissions.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by holder name, token, or transaction ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Commissions List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading commissions...</p>
        </div>
      ) : filteredCommissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No commissions found matching your search' : 'No commissions yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden xl:block">
            <Card>
              <CardHeader>
                <CardTitle>Commission History ({filteredCommissions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Holder</th>
                        <th className="text-left py-3 px-4 font-medium">Type</th>
                        <th className="text-left py-3 px-4 font-medium">Asset</th>
                        <th className="text-right py-3 px-4 font-medium">Fee Amount</th>
                        <th className="text-right py-3 px-4 font-medium">Fee (USDT)</th>
                        <th className="text-right py-3 px-4 font-medium">Fee (KGS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCommissions.map((commission) => {
                        const feeUSDT = calculateCommissionInUSDT(commission.fee, commission.from_token);
                        const feeKGS = feeUSDT * KGS_RATE;

                        return (
                          <tr key={commission.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              {format(new Date(commission.requested_at), 'MMM dd, yyyy HH:mm')}
                            </td>
                            <td className="py-3 px-4">{commission.holder?.name || 'Unknown'}</td>
                            <td className="py-3 px-4">
                              <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Swap</Badge>
                            </td>
                            <td className="py-3 px-4">{commission.from_token}</td>
                            <td className="py-3 px-4 text-right font-mono">
                              {parseFloat(commission.fee).toFixed(4)} {commission.from_token}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">${feeUSDT.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-mono">{feeKGS.toFixed(2)} KGS</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="xl:hidden space-y-4">
            {filteredCommissions.map((commission) => {
              const feeUSDT = calculateCommissionInUSDT(commission.fee, commission.from_token);
              const feeKGS = feeUSDT * KGS_RATE;

              return (
                <Card key={commission.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{commission.holder?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(commission.requested_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Swap</Badge>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Asset:</span>
                      <span className="font-medium">{commission.from_token}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fee Amount:</span>
                      <span className="font-mono">
                        {parseFloat(commission.fee).toFixed(4)} {commission.from_token}
                      </span>
                    </div>

                    <div className="border-t pt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fee (USDT):</span>
                        <span className="font-mono font-medium">${feeUSDT.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fee (KGS):</span>
                        <span className="font-mono">{feeKGS.toFixed(2)} KGS</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
