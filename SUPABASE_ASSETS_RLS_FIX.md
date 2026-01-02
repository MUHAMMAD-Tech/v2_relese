# Supabase Assets RLS Muammosi - Hal Qilindi

## Muammo (Problem)

Holder ID: `8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69`

Frontend orqali `.from('assets').eq('holder_id', holderId)` bo'sh array qaytaryapti, lekin database-da assetlar mavjud.

## Sabab (Root Cause)

**RLS (Row Level Security) Policy Yo'q**

Assets jadvalida RLS yoqilgan, lekin faqat adminlar uchun policy mavjud edi:
- ✅ Admin policy: `is_admin(auth.uid())` - Adminlar barcha assetlarni ko'rishlari mumkin
- ❌ Holder policy: **YO'Q** - Holderlar o'z assetlarini ham ko'ra olmaydilar

## Database Tekshiruvi (Database Check)

### 1. Holder Mavjudmi? ✅

```sql
SELECT id, name, access_code, created_at 
FROM holders 
WHERE id = '8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69';
```

**Natija**:
```json
{
  "id": "8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69",
  "name": "MAKHAMADIBROKHIM UULU MAKHAMMADMUSO",
  "access_code": "FHG8TLWS",
  "created_at": "2025-12-28 18:33:13.272878+00"
}
```

✅ **Holder mavjud**

### 2. Assetlar Mavjudmi? ✅

```sql
SELECT id, holder_id, token_symbol, amount, created_at, updated_at
FROM assets 
WHERE holder_id = '8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69';
```

**Natija**:
```json
[
  {
    "id": "01a45885-d04e-40e7-977b-4a5deca2a5eb",
    "holder_id": "8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69",
    "token_symbol": "BTC",
    "amount": "0.0000000000"
  },
  {
    "id": "5e6a9858-ce22-4b61-88d7-b68f9af7cc0e",
    "holder_id": "8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69",
    "token_symbol": "ETH",
    "amount": "19.6050000000"
  },
  {
    "id": "bc8f1759-5b91-4040-8b38-e5aee0a1e0a8",
    "holder_id": "8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69",
    "token_symbol": "USDT",
    "amount": "10000.0000000000"
  },
  {
    "id": "dbc8f76f-4894-4480-9bbd-0a07ff540430",
    "holder_id": "8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69",
    "token_symbol": "BNB",
    "amount": "15.5000000000"
  },
  {
    "id": "507a27b5-4170-4405-a051-c25fa82bb25e",
    "holder_id": "8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69",
    "token_symbol": "SOL",
    "amount": "100.0000000000"
  }
]
```

✅ **5 ta asset mavjud**: BTC, ETH, USDT, BNB, SOL

### 3. RLS Policy Tekshiruvi ❌

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'assets';
```

**Oldingi Natija**:
```json
[
  {
    "policyname": "Admins can manage assets",
    "cmd": "ALL",
    "qual": "is_admin(auth.uid())"
  }
]
```

❌ **Holder uchun policy yo'q!**

### 4. Auth Profile Tekshiruvi ✅

```sql
SELECT p.id, p.email, p.role, p.created_at
FROM profiles p
WHERE p.email LIKE '8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69%';
```

**Natija**:
```json
{
  "id": "1d794fd3-6852-49d0-8863-8f5c467bde6a",
  "email": "8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69@miaoda.com",
  "role": "holder",
  "created_at": "2026-01-02 08:33:30.313736+00"
}
```

✅ **Auth profile mavjud**

## Yechim (Solution)

### RLS Policy Qo'shildi

```sql
CREATE POLICY "Holders can read their own assets"
ON public.assets
FOR SELECT
TO authenticated
USING (
  -- Holder o'z assetlarini ko'rishi mumkin
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'holder'::public.user_role
    AND REPLACE(p.email, '@miaoda.com', '')::uuid = assets.holder_id
  )
);
```

### Policy Qanday Ishlaydi?

1. **Auth User ID**: `auth.uid()` - Hozirgi login qilgan user
2. **Profile Check**: `p.id = auth.uid()` - User profile topiladi
3. **Role Check**: `p.role = 'holder'` - Holder ekanligini tekshiradi
4. **Holder ID Match**: `REPLACE(p.email, '@miaoda.com', '')::uuid = assets.holder_id`
   - Email: `8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69@miaoda.com`
   - Holder ID: `8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69`
   - Match: ✅

## Yangi RLS Policies

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'assets'
ORDER BY policyname;
```

**Natija**:
```json
[
  {
    "policyname": "Admins can manage assets",
    "cmd": "ALL",
    "qual": "is_admin(auth.uid())"
  },
  {
    "policyname": "Holders can read their own assets",
    "cmd": "SELECT",
    "qual": "EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'holder' AND REPLACE(p.email, '@miaoda.com', '')::uuid = assets.holder_id)"
  }
]
```

✅ **Endi holderlar o'z assetlarini ko'rishlari mumkin!**

## Frontend Kod (Working Code)

### 1. Holder Mavjudligini Tekshirish

```typescript
// src/db/api.ts

import { supabase } from './supabase';

/**
 * Holder mavjudligini tekshirish
 * @param holderId - Holder UUID
 * @returns Holder object yoki null
 */
export async function checkHolderExists(holderId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('holders')
    .select('id, name, access_code')
    .eq('id', holderId)
    .maybeSingle();

  if (error) {
    console.error('Holder tekshirishda xatolik:', error);
    return false;
  }

  if (data) {
    console.log('✅ Holder topildi:', data);
    return true;
  } else {
    console.log('❌ Holder topilmadi');
    return false;
  }
}
```

### 2. Assetlar Mavjudligini Tekshirish

```typescript
/**
 * Holder assetlarini tekshirish
 * @param holderId - Holder UUID
 * @returns Assets array
 */
export async function checkHolderAssets(holderId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('holder_id', holderId)
    .order('token_symbol', { ascending: true });

  if (error) {
    console.error('Assetlarni tekshirishda xatolik:', error);
    return [];
  }

  if (data && data.length > 0) {
    console.log(`✅ ${data.length} ta asset topildi:`, data);
    return data;
  } else {
    console.log('❌ Assetlar topilmadi');
    return [];
  }
}
```

### 3. Token Bilan Birga Assetlarni Olish

```typescript
/**
 * Holder assetlarini token ma'lumotlari bilan olish
 * @param holderId - Holder UUID
 * @returns Assets with token info
 */
export async function getHolderAssetsWithTokens(holderId: string): Promise<AssetWithToken[]> {
  const { data, error } = await supabase
    .from('assets')
    .select(`
      *,
      token:token_whitelist!assets_token_symbol_fkey(
        symbol,
        name,
        coingecko_id,
        logo_url,
        market_cap_rank
      )
    `)
    .eq('holder_id', holderId)
    .order('token_symbol', { ascending: true });

  if (error) {
    console.error('Assetlarni token bilan olishda xatolik:', error);
    return [];
  }

  console.log(`✅ ${data?.length || 0} ta asset token bilan topildi`);
  return Array.isArray(data) ? data : [];
}
```

### 4. To'liq Example - Ishlatishga Tayyor

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
      // 1. Holder mavjudligini tekshirish
      const holderExists = await checkHolderExists(currentHolder.id);
      if (!holderExists) {
        console.error('❌ Holder topilmadi:', currentHolder.id);
        setLoading(false);
        return;
      }

      // 2. Assetlarni tekshirish (oddiy)
      const simpleAssets = await checkHolderAssets(currentHolder.id);
      console.log('Oddiy assetlar:', simpleAssets);

      // 3. Assetlarni token bilan olish (to'liq)
      const assetsWithTokens = await getHolderAssetsWithTokens(currentHolder.id);
      console.log('Token bilan assetlar:', assetsWithTokens);

      setAssets(assetsWithTokens);
    } catch (error) {
      console.error('Assetlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Yuklanmoqda...</div>;
  }

  if (assets.length === 0) {
    return <div>Assetlar topilmadi</div>;
  }

  return (
    <div>
      <h1>Portfolio</h1>
      <div>
        {assets.map((asset) => (
          <div key={asset.id}>
            <p>{asset.token?.name} ({asset.token_symbol})</p>
            <p>Miqdor: {asset.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Console Output (Kutilgan Natija)

### Muvaffaqiyatli Yuklash

```
✅ Holder topildi: {
  id: "8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69",
  name: "MAKHAMADIBROKHIM UULU MAKHAMMADMUSO",
  access_code: "FHG8TLWS"
}

✅ 5 ta asset topildi: [
  { token_symbol: "BTC", amount: "0.0000000000" },
  { token_symbol: "ETH", amount: "19.6050000000" },
  { token_symbol: "USDT", amount: "10000.0000000000" },
  { token_symbol: "BNB", amount: "15.5000000000" },
  { token_symbol: "SOL", amount: "100.0000000000" }
]

✅ 5 ta asset token bilan topildi
```

### Xatolik

```
❌ Holder topilmadi
❌ Assetlar topilmadi
Assetlarni tekshirishda xatolik: { message: "..." }
```

## Tekshirish (Testing)

### Test 1: Holder Mavjudligini Tekshirish

```typescript
const holderId = '8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69';
const exists = await checkHolderExists(holderId);
console.log('Holder mavjudmi?', exists); // true
```

### Test 2: Assetlarni Tekshirish

```typescript
const holderId = '8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69';
const assets = await checkHolderAssets(holderId);
console.log('Assetlar soni:', assets.length); // 5
```

### Test 3: Token Bilan Assetlarni Olish

```typescript
const holderId = '8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69';
const assetsWithTokens = await getHolderAssetsWithTokens(holderId);
console.log('Token bilan assetlar:', assetsWithTokens);
// [
//   { 
//     token_symbol: "ETH", 
//     amount: "19.6050000000",
//     token: { name: "Ethereum", symbol: "ETH", ... }
//   },
//   ...
// ]
```

## Muammolarni Hal Qilish (Troubleshooting)

### Muammo: Bo'sh array qaytaryapti

**Tekshirish**:
1. RLS policy qo'shildimi?
2. User login qilganmi?
3. User role 'holder'mi?
4. Holder ID to'g'rimi?

**Yechim**:
```sql
-- RLS policy tekshirish
SELECT policyname FROM pg_policies WHERE tablename = 'assets';

-- User profile tekshirish
SELECT id, email, role FROM profiles WHERE id = auth.uid();

-- Assetlar tekshirish (SQL)
SELECT * FROM assets WHERE holder_id = '8cd9f6ab-9ec6-4a2e-a80d-c7e557a6de69';
```

### Muammo: "permission denied for table assets"

**Sabab**: RLS policy yo'q yoki noto'g'ri

**Yechim**: RLS policy qo'shish (yuqoridagi SQL)

### Muammo: "operator does not exist: text = uuid"

**Sabab**: Type casting yo'q

**Yechim**: `::uuid` qo'shish
```sql
REPLACE(p.email, '@miaoda.com', '')::uuid = assets.holder_id
```

## Xulosa (Summary)

✅ **Muammo hal qilindi!**

**Sabab**: RLS policy yo'q edi
**Yechim**: Holder uchun RLS policy qo'shildi
**Natija**: Holderlar endi o'z assetlarini ko'rishlari mumkin

### Qo'shilgan Policy

- **Policy nomi**: "Holders can read their own assets"
- **Ruxsat**: SELECT (o'qish)
- **Shart**: Holder o'z assetlarini ko'rishi mumkin (email prefix = holder_id)

### Ishlatishga Tayyor Kod

1. `checkHolderExists()` - Holder mavjudligini tekshirish
2. `checkHolderAssets()` - Assetlarni tekshirish
3. `getHolderAssetsWithTokens()` - Token bilan assetlarni olish
4. To'liq example - HolderPortfolioPage

Endi frontend orqali `.from('assets').eq('holder_id', holderId)` to'g'ri ishlaydi! 🎉
