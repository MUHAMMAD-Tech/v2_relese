import { useEffect, useState } from 'react';
import { Search, ArrowRight, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getApprovedTransactions } from '@/db/api';
import type { TransactionWithDetails } from '@/types/types';
import { format } from 'date-fns';

export default function AdminHistoryPage() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTransactions(transactions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = transactions.filter(
        (t) =>
          t.holder?.name?.toLowerCase().includes(query) ||
          t.id.toLowerCase().includes(query) ||
          t.from_token?.toLowerCase().includes(query) ||
          t.to_token?.toLowerCase().includes(query)
      );
      setFilteredTransactions(filtered);
    }
  }, [searchQuery, transactions]);

  const loadTransactions = async () => {
    setLoading(true);
    const data = await getApprovedTransactions();
    setTransactions(data);
    setFilteredTransactions(data);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Approved</Badge>;
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Rejected</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    if (type === 'swap') {
      return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Swap</Badge>;
    }
    if (type === 'buy') {
      return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Buy</Badge>;
    }
    if (type === 'sell') {
      return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">Sell</Badge>;
    }
    return <Badge variant="secondary">{type}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 xl:p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">View all approved and rejected transactions</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by holder name, transaction ID, or token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No transactions found matching your search' : 'No transactions yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden xl:block">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions ({filteredTransactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Holder</th>
                        <th className="text-left py-3 px-4 font-medium">Type</th>
                        <th className="text-left py-3 px-4 font-medium">Assets</th>
                        <th className="text-right py-3 px-4 font-medium">Amount</th>
                        <th className="text-right py-3 px-4 font-medium">Fee</th>
                        <th className="text-center py-3 px-4 font-medium">Status</th>
                        <th className="text-center py-3 px-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <td className="py-3 px-4">
                            {transaction.approved_at
                              ? format(new Date(transaction.approved_at), 'MMM dd, yyyy HH:mm')
                              : format(new Date(transaction.requested_at), 'MMM dd, yyyy HH:mm')}
                          </td>
                          <td className="py-3 px-4">{transaction.holder?.name || 'Unknown'}</td>
                          <td className="py-3 px-4">{getTypeBadge(transaction.transaction_type)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span>{transaction.from_token || '-'}</span>
                              {transaction.to_token && (
                                <>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                  <span>{transaction.to_token}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {parseFloat(transaction.amount).toFixed(4)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {transaction.fee ? parseFloat(transaction.fee).toFixed(4) : '0.0000'}
                          </td>
                          <td className="py-3 px-4 text-center">{getStatusBadge(transaction.status)}</td>
                          <td className="py-3 px-4 text-center">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="xl:hidden space-y-4">
            {filteredTransactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedTransaction(transaction)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{transaction.holder?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.approved_at
                          ? format(new Date(transaction.approved_at), 'MMM dd, yyyy HH:mm')
                          : format(new Date(transaction.requested_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getTypeBadge(transaction.transaction_type)}
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{transaction.from_token || '-'}</span>
                    {transaction.to_token && (
                      <>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{transaction.to_token}</span>
                      </>
                    )}
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-mono">{parseFloat(transaction.amount).toFixed(4)}</span>
                  </div>

                  {transaction.fee && parseFloat(transaction.fee) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fee:</span>
                      <span className="font-mono">{parseFloat(transaction.fee).toFixed(4)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Details Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm break-all">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Holder</p>
                  <p className="font-medium">{selectedTransaction.holder?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <div className="mt-1">{getTypeBadge(selectedTransaction.transaction_type)}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Transaction Details</h3>
                <div className="space-y-3">
                  {selectedTransaction.from_token && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">From Asset</span>
                      <span className="font-medium">{selectedTransaction.from_token}</span>
                    </div>
                  )}

                  {selectedTransaction.to_token && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">To Asset</span>
                      <span className="font-medium">{selectedTransaction.to_token}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-mono">{parseFloat(selectedTransaction.amount).toFixed(8)}</span>
                  </div>

                  {selectedTransaction.fee && parseFloat(selectedTransaction.fee) > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fee (1%)</span>
                        <span className="font-mono">{parseFloat(selectedTransaction.fee).toFixed(8)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Net Amount</span>
                        <span className="font-mono">
                          {parseFloat(selectedTransaction.net_amount || selectedTransaction.amount).toFixed(8)}
                        </span>
                      </div>
                    </>
                  )}

                  {selectedTransaction.execution_price && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Execution Price</span>
                      <span className="font-mono">{parseFloat(selectedTransaction.execution_price).toFixed(8)}</span>
                    </div>
                  )}

                  {selectedTransaction.received_amount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Received Amount</span>
                      <span className="font-mono">{parseFloat(selectedTransaction.received_amount).toFixed(8)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Timeline</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Requested</span>
                    <span>{format(new Date(selectedTransaction.requested_at), 'MMM dd, yyyy HH:mm:ss')}</span>
                  </div>
                  {selectedTransaction.approved_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {selectedTransaction.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                      <span>{format(new Date(selectedTransaction.approved_at), 'MMM dd, yyyy HH:mm:ss')}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedTransaction.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
