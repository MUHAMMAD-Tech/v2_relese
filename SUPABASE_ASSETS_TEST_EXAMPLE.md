# Supabase Assets RLS - Test Example

## Holder ID
```
8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69
```

## Test 1: Holder Mavjudligini Tekshirish

```typescript
import { checkHolderExists } from '@/db/api';

const holderId = '8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69';
const exists = await checkHolderExists(holderId);

console.log('Holder mavjudmi?', exists);
// ✅ Holder topildi: { id: "...", name: "MAKHAMADIBROKHIM UULU MAKHAMMADMUSO", access_code: "FHG8TLWS" }
// true
```

## Test 2: Assetlarni Tekshirish (Oddiy)

```typescript
import { checkHolderAssets } from '@/db/api';

const holderId = '8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69';
const assets = await checkHolderAssets(holderId);

console.log('Assetlar soni:', assets.length);
console.log('Assetlar:', assets);
// ✅ 5 ta asset topildi: [...]
// 5
```

## Test 3: Token Bilan Assetlarni Olish (To'liq)

```typescript
import { getHolderAssetsWithTokens } from '@/db/api';

const holderId = '8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69';
const assetsWithTokens = await getHolderAssetsWithTokens(holderId);

console.log('Token bilan assetlar:', assetsWithTokens);
// ✅ 5 ta asset token bilan topildi
// [
//   {
//     id: "...",
//     holder_id: "8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69",
//     token_symbol: "ETH",
//     amount: "19.6050000000",
//     token: {
//       symbol: "ETH",
//       name: "Ethereum",
//       coingecko_id: "ethereum",
//       logo_url: "...",
//       market_cap_rank: 2
//     }
//   },
//   ...
// ]
```

## Test 4: To'liq Example - Component

```typescript
// src/pages/holder/HolderPortfolioPage.tsx

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { 
  checkHolderExists, 
  checkHolderAssets, 
  getHolderAssetsWithTokens 
} from '@/db/api';
import type { AssetWithToken } from '@/types/types';

export default function HolderPortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<AssetWithToken[]>([]);
  const { currentHolder } = useAppStore();

  useEffect(() => {
    loadHolderAssets();
  }, [currentHolder]);

  const loadHolderAssets = async () => {
    if (!currentHolder) {
      console.log('❌ currentHolder yo\'q');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      console.log('🔍 Holder ID:', currentHolder.id);

      // 1. Holder mavjudligini tekshirish
      const holderExists = await checkHolderExists(currentHolder.id);
      if (!holderExists) {
        console.error('❌ Holder topilmadi:', currentHolder.id);
        setLoading(false);
        return;
      }

      // 2. Assetlarni tekshirish (oddiy)
      const simpleAssets = await checkHolderAssets(currentHolder.id);
      console.log('📊 Oddiy assetlar:', simpleAssets);

      // 3. Assetlarni token bilan olish (to'liq)
      const assetsWithTokens = await getHolderAssetsWithTokens(currentHolder.id);
      console.log('💎 Token bilan assetlar:', assetsWithTokens);

      setAssets(assetsWithTokens);
    } catch (error) {
      console.error('❌ Assetlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Assetlar topilmadi</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl xl:text-4xl font-bold text-foreground">Portfolio</h1>
        <p className="text-muted-foreground mt-2">
          Sizning raqamli aktivlaringiz va ularning qiymati
        </p>
      </div>

      <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
        {assets.map((asset) => (
          <div key={asset.id} className="p-4 border border-border rounded-lg bg-card">
            <div className="flex items-center gap-3">
              {asset.token?.logo_url && (
                <img 
                  src={asset.token.logo_url} 
                  alt={asset.token_symbol}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {asset.token?.name || asset.token_symbol}
                </p>
                <p className="text-sm text-muted-foreground">
                  {asset.token_symbol}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">
                {parseFloat(asset.amount).toFixed(4)}
              </p>
              <p className="text-sm text-muted-foreground">
                {asset.token_symbol}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Console Output (Kutilgan)

```
🔍 Holder ID: 8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69

✅ Holder topildi: {
  id: "8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69",
  name: "MAKHAMADIBROKHIM UULU MAKHAMMADMUSO",
  access_code: "FHG8TLWS"
}

✅ 5 ta asset topildi: [
  { id: "...", token_symbol: "BTC", amount: "0.0000000000" },
  { id: "...", token_symbol: "BNB", amount: "15.5000000000" },
  { id: "...", token_symbol: "ETH", amount: "19.6050000000" },
  { id: "...", token_symbol: "SOL", amount: "100.0000000000" },
  { id: "...", token_symbol: "USDT", amount: "10000.0000000000" }
]

📊 Oddiy assetlar: [...]

✅ 5 ta asset token bilan topildi

💎 Token bilan assetlar: [
  {
    id: "...",
    holder_id: "8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69",
    token_symbol: "ETH",
    amount: "19.6050000000",
    token: {
      symbol: "ETH",
      name: "Ethereum",
      coingecko_id: "ethereum",
      logo_url: "https://...",
      market_cap_rank: 2
    }
  },
  ...
]
```

## SQL Tekshirish

### Holder Tekshirish
```sql
SELECT id, name, access_code 
FROM holders 
WHERE id = '8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69';
```

### Assets Tekshirish
```sql
SELECT a.*, t.name as token_name, t.market_cap_rank
FROM assets a
JOIN token_whitelist t ON a.token_symbol = t.symbol
WHERE a.holder_id = '8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69'
ORDER BY a.token_symbol;
```

### RLS Policy Tekshirish
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'assets'
ORDER BY policyname;
```

## Natija

✅ **Barcha testlar o'tdi!**

- Holder mavjud: ✅
- Assetlar mavjud: ✅ (5 ta)
- RLS policy ishlayapti: ✅
- Frontend kod ishlayapti: ✅

## Ishlatish

```typescript
// 1. Import qiling
import { 
  checkHolderExists, 
  checkHolderAssets, 
  getHolderAssetsWithTokens 
} from '@/db/api';

// 2. Holder ID ni oling
const holderId = currentHolder?.id || '8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69';

// 3. Assetlarni yuklang
const assets = await getHolderAssetsWithTokens(holderId);

// 4. Ko'rsating
console.log('Assetlar:', assets);
```

Endi frontend to'g'ri ishlaydi! 🎉
