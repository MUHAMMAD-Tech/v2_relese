# LETHEX - Tezkor Ma'lumotnoma

## Environment Variables (.env fayli)

### Asosiy Sozlamalar
```env
VITE_APP_ID=app-8opxaeswhtkw              # Ilova ID
VITE_SUPABASE_URL=https://...             # Database URL
VITE_SUPABASE_ANON_KEY=eyJhbGc...         # Database kaliti
```

### Qayerdan Olish?
1. **Supabase URL va Key:**
   - https://supabase.com/dashboard ga kiring
   - Settings > API > Project URL va anon public key

2. **CoinGecko API:**
   - API key kerak emas (free tier)
   - Avtomatik ishlaydi

---

## Coin Narxlari Qanday Olinadi?

### 1. CoinGecko API (Bepul)
```
URL: https://api.coingecko.com/api/v3/simple/price
Misol: ?ids=bitcoin,ethereum&vs_currencies=usd
```

### 2. Narxlar Qanday Yangilanadi?
- **Har 1 soniya** - UI da ko'rsatish uchun
- **60 soniya kesh** - API chaqiruvlarni kamaytirish
- **Avtomatik** - Ilova ishga tushganda boshlanadi

### 3. Kod Strukturasi
```
App.tsx
  ↓ loadTokens() - Tokenlarni yuklash
  ↓ updatePrices() - Har 1 soniyada
  ↓
appStore.ts (Zustand)
  ↓ prices: { btc: {...}, eth: {...} }
  ↓
priceService.ts
  ↓ CoinGecko API
```

### 4. Komponentda Foydalanish
```typescript
import { useAppStore } from '@/store/appStore';

function MyComponent() {
  const { prices } = useAppStore();
  
  // Narxni olish
  const btcPrice = prices['btc']?.price_usdt || 0;
  
  // Narxlar avtomatik yangilanadi!
  return <div>${btcPrice}</div>;
}
```

---

## Tokenlar (50 ta)

### Database: token_whitelist
- **Symbol**: BTC, ETH, BNB, SOL, XRP...
- **CoinGecko ID**: bitcoin, ethereum, binancecoin...
- **Logo URL**: CoinGecko dan

### Tokenlarni Ko'rish
```sql
SELECT * FROM token_whitelist ORDER BY symbol;
```

---

## Xavfsizlik

### ✅ Xavfsiz (Frontend da)
- VITE_SUPABASE_ANON_KEY
- CoinGecko API (key kerak emas)

### ❌ Xavfli (HECH QACHON frontend ga qo'ymang!)
- Supabase service_role key
- Private keys
- Parollar

---

## Muammolarni Hal Qilish

### Narxlar 0$ Ko'rsatyapti
```typescript
// 1. Tokenlar yuklanganini tekshiring
const { tokens } = useAppStore();
console.log('Tokens:', tokens.length); // 50 bo'lishi kerak

// 2. Narxlar yuklanganini tekshiring
const { prices } = useAppStore();
console.log('Prices:', Object.keys(prices).length);

// 3. Komponentda useEffect qo'shing
useEffect(() => {
  if (Object.keys(prices).length > 0) {
    // Narxlarni qayta hisoblash
  }
}, [prices]); // prices o'zgarganda qayta hisoblash
```

### Database Ulanmayapti
```typescript
// Test qiling
import { supabase } from '@/db/supabase';

const { data, error } = await supabase
  .from('token_whitelist')
  .select('count');
  
console.log(data, error);
```

**Yechim:**
1. `.env` faylni tekshiring
2. Supabase loyiha faol ekanligini tekshiring
3. Internet ulanishini tekshiring

---

## Foydali Linklar

- **CoinGecko API:** https://www.coingecko.com/en/api/documentation
- **Supabase Dashboard:** https://supabase.com/dashboard
- **To'liq Hujjat:** ENV_AND_PRICE_GUIDE.md

---

## Tez Yordam

### .env Faylini Yaratish
```bash
cp .env.example .env
# Keyin .env faylni tahrirlang
```

### Ilovani Ishga Tushirish
```bash
npm install
npm run dev
```

### Database Migratsiyalarni Ishga Tushirish
```bash
# Supabase CLI orqali
supabase db push
```

### Narxlarni Tekshirish
```bash
# Browser console da
console.log(useAppStore.getState().prices);
```
