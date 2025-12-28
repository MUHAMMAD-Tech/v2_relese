// LETHEX Admin Assets Management Page
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Wallet } from 'lucide-react';
import { getAllHolders, getAssetsByHolder, createAsset, updateAsset, deleteAssetById, getAllTokens } from '@/db/api';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TokenSelector } from '@/components/common/TokenSelector';
import { useAppStore } from '@/store/appStore';
import type { Holder, Asset, Token } from '@/types/types';

export default function AdminAssetsPage() {
  const [loading, setLoading] = useState(true);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [selectedHolder, setSelectedHolder] = useState<Holder | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const { prices } = useAppStore();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedHolder) {
      loadAssets(selectedHolder.id);
    }
  }, [selectedHolder]);

  const loadData = async () => {
    setLoading(true);
    const [holdersData, tokensData] = await Promise.all([
      getAllHolders(),
      getAllTokens(),
    ]);
    setHolders(holdersData);
    setTokens(tokensData);
    if (holdersData.length > 0) {
      setSelectedHolder(holdersData[0]);
    }
    setLoading(false);
  };

  const loadAssets = async (holderId: string) => {
    const assetsData = await getAssetsByHolder(holderId);
    setAssets(assetsData);
  };

  const handleAddAsset = async () => {
    if (!selectedHolder || !selectedToken || !amount || parseFloat(amount) <= 0) {
      toast.error('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }

    // Check if asset already exists
    const existingAsset = assets.find(a => a.token_symbol === selectedToken.symbol);
    if (existingAsset) {
      toast.error('Bu token allaqachon qo\'shilgan. Tahrirlash uchun Edit tugmasini bosing.');
      return;
    }

    const success = await createAsset({
      holder_id: selectedHolder.id,
      token_symbol: selectedToken.symbol,
      amount: amount,
    });

    if (success) {
      toast.success('Aktiv muvaffaqiyatli qo\'shildi');
      setShowAddDialog(false);
      setSelectedToken(null);
      setAmount('');
      loadAssets(selectedHolder.id);
    } else {
      toast.error('Aktiv qo\'shishda xatolik');
    }
  };

  const handleEditAsset = async () => {
    if (!selectedAsset || !amount || parseFloat(amount) <= 0) {
      toast.error('Iltimos, to\'g\'ri miqdor kiriting');
      return;
    }

    const success = await updateAsset(selectedAsset.id, {
      amount: parseFloat(amount),
    });

    if (success) {
      toast.success('Aktiv muvaffaqiyatli yangilandi');
      setShowEditDialog(false);
      setSelectedAsset(null);
      setAmount('');
      if (selectedHolder) {
        loadAssets(selectedHolder.id);
      }
    } else {
      toast.error('Aktiv yangilashda xatolik');
    }
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;

    const success = await deleteAssetById(selectedAsset.id);
    if (success) {
      toast.success('Aktiv muvaffaqiyatli o\'chirildi');
      setShowDeleteDialog(false);
      setSelectedAsset(null);
      if (selectedHolder) {
        loadAssets(selectedHolder.id);
      }
    } else {
      toast.error('Aktiv o\'chirishda xatolik');
    }
  };

  const openAddDialog = () => {
    setSelectedToken(null);
    setAmount('');
    setShowAddDialog(true);
  };

  const openEditDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setAmount(asset.amount);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowDeleteDialog(true);
  };

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setShowTokenSelector(false);
  };

  const getTokenPrice = (symbol: string): number => {
    const priceData = prices[symbol.toLowerCase()];
    return priceData?.price_usdt || 0;
  };

  const calculateValue = (amount: string | number, symbol: string): number => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return numAmount * getTokenPrice(symbol);
  };

  const getTotalPortfolioValue = (): number => {
    return assets.reduce((total, asset) => {
      return total + calculateValue(asset.amount, asset.token_symbol);
    }, 0);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl xl:text-4xl font-bold text-foreground">Aktivlar</h1>
        <p className="text-muted-foreground mt-2">
          Holderlarga tokenlar tayinlash va boshqarish
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full bg-muted" />
          <Skeleton className="h-64 w-full bg-muted" />
        </div>
      ) : holders.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Holderlar mavjud emas</p>
            <p className="text-sm text-muted-foreground">
              Avval Holderlar bo'limidan holder qo'shing
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Holder Selector */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Holder tanlang</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedHolder?.id}
                onValueChange={(value) => {
                  const holder = holders.find(h => h.id === value);
                  setSelectedHolder(holder || null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Holder tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {holders.map((holder) => (
                    <SelectItem key={holder.id} value={holder.id}>
                      {holder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Portfolio Summary */}
          {selectedHolder && (
            <div className="grid grid-cols-1 @md:grid-cols-3 gap-4">
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Jami qiymat (USDT)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">
                    ${getTotalPortfolioValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Jami qiymat (KGS)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">
                    {(getTotalPortfolioValue() * 87).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} сом
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Aktivlar soni
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">
                    {assets.length}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assets List */}
          {selectedHolder && (
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  {selectedHolder.name} - Aktivlar
                </CardTitle>
                <Button onClick={openAddDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Aktiv qo'shish
                </Button>
              </CardHeader>
              <CardContent>
                {assets.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Aktivlar mavjud emas</p>
                    <Button onClick={openAddDialog}>
                      <Plus className="mr-2 h-4 w-4" />
                      Birinchi aktivni qo'shing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assets.map((asset) => {
                      const token = tokens.find(t => t.symbol === asset.token_symbol);
                      const price = getTokenPrice(asset.token_symbol);
                      const value = calculateValue(asset.amount, asset.token_symbol);

                      return (
                        <div
                          key={asset.id}
                          className="flex flex-col @md:flex-row @md:items-center justify-between gap-4 p-4 rounded-lg bg-secondary/50 border border-border"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {token?.logo_url && (
                              <img
                                src={token.logo_url}
                                alt={token.name}
                                className="w-10 h-10 rounded-full"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="font-bold text-foreground text-lg">
                                {asset.token_symbol}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {token?.name || asset.token_symbol}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col @md:flex-row @md:items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold text-foreground">
                                {(typeof asset.amount === 'string' ? parseFloat(asset.amount) : asset.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })} {asset.token_symbol}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(value * 87).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} сом
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(asset)}
                              >
                                <Edit className="h-4 w-4 @md:mr-2" />
                                <span className="hidden @md:inline">Tahrirlash</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(asset)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 @md:mr-2" />
                                <span className="hidden @md:inline">O'chirish</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Asset Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktiv qo'shish</DialogTitle>
            <DialogDescription>
              {selectedHolder?.name} uchun yangi token qo'shing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Token</Label>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowTokenSelector(true)}
              >
                {selectedToken ? (
                  <div className="flex items-center gap-2">
                    {selectedToken.logo_url && (
                      <img src={selectedToken.logo_url} alt={selectedToken.name} className="w-5 h-5 rounded-full" />
                    )}
                    <span>{selectedToken.symbol} - {selectedToken.name}</span>
                  </div>
                ) : (
                  'Token tanlang'
                )}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Miqdor</Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                Bekor qilish
              </Button>
              <Button onClick={handleAddAsset} className="flex-1">
                Qo'shish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktivni tahrirlash</DialogTitle>
            <DialogDescription>
              {selectedAsset?.token_symbol} miqdorini o'zgartiring
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Yangi miqdor</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                Bekor qilish
              </Button>
              <Button onClick={handleEditAsset} className="flex-1">
                Saqlash
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Aktivni o'chirish"
        description={`${selectedAsset?.token_symbol} aktivini o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.`}
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        onConfirm={handleDeleteAsset}
        variant="destructive"
      />

      {/* Token Selector */}
      <TokenSelector
        open={showTokenSelector}
        onOpenChange={setShowTokenSelector}
        onSelect={handleTokenSelect}
      />
    </div>
  );
}
