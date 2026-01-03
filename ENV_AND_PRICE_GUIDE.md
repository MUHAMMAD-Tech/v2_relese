# LETHEX - Environment Variables va Narx Tizimi Hujjati

## Environment Variables (.env)

### Asosiy Sozlamalar

#### 1. Ilova Identifikatorlari
```env
VITE_APP_ID=app-8opxaeswhtkw
VITE_FORM_ID=form-8opxaeswhtkw
VITE_API_ENV=production
```

**Tushuntirish:**
- `VITE_APP_ID`: Miaoda platformasida noyob ilova identifikatori
- `VITE_FORM_ID`: Form identifikatori (agar kerak bo'lsa)
- `VITE_API_ENV`: Muhit (development/production)

#### 2. Supabase Database
```env
VITE_SUPABASE_URL=https://hobyvftfkuqnbrxamihm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Tushuntirish:**
- `VITE_SUPABASE_URL`: Supabase loyiha URL manzili
- `VITE_SUPABASE_ANON_KEY`: Public key (RLS bilan xavfsiz)

**Qayerdan olish:**
1. https://supabase.com/dashboard ga kiring
2. Loyihangizni tanlang
3. Settings > API > Project URL va anon public key

**Xavfsizlik:**
- ✅ Anon key - frontend uchun xavfsiz (RLS bilan himoyalangan)
- ❌ Service role key - HECH QACHON frontend ga qo'ymang!

---

## Narx Tizimi (CoinGecko API)

### CoinGecko API Haqida

**API URL:** https://api.coingecko.com/api/v3

**Free Tier Limitlar:**
- 10-50 requests/minute
- API key talab qilinmaydi
- Bizning ilova uchun yetarli (50 ta token)

### Narxlar Qanday Olinadi

#### 1. Price Service (`src/services/priceService.ts`)

```typescript
// CoinGecko API endpoint
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Kesh davomiyligi - 60 soniya
const CACHE_DURATION = 60000;

// KGS kursi - 1 USD = 87 KGS
const KGS_TO_USD_RATE = 0.0115;

// Narxlarni olish
async fetchPrices(coingeckoIds: string[]): Promise<PriceCache> {
  const idsParam = coingeckoIds.join(',');
  const response = await fetch(
    `${COINGECKO_API_BASE}/simple/price?ids=${idsParam}&vs_currencies=usd`
  );
  // ...
}
```

**API Request Misoli:**
```
GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin&vs_currencies=usd
```

**API Response:**
```json
{
  "bitcoin": { "usd": 45000 },
  "ethereum": { "usd": 2500 },
  "binancecoin": { "usd": 320 }
}
```

#### 2. App Store (`src/store/appStore.ts`)

```typescript
// Zustand store - global state
export const useAppStore = create<AppState>((set, get) => ({
  tokens: [],
  prices: {},
  
  // Tokenlarni yuklash
  loadTokens: async () => {
    const tokens = await getAllTokens();
    set({ tokens });
  },
  
  // Narxlarni yangilash
  updatePrices: async () => {
    const { tokens } = get();
    const coingeckoIds = tokens.map(t => t.coingecko_id);
    const priceData = await priceService.fetchPrices(coingeckoIds);
    
    // Symbol bilan mapping
    const prices: PriceCache = {};
    for (const token of tokens) {
      const priceInfo = priceData[token.coingecko_id];
      if (priceInfo) {
        prices[token.symbol.toLowerCase()] = {
          ...priceInfo,
          symbol: token.symbol,
        };
      }
    }
    
    set({ prices });
  }
}));
```

#### 3. App Component (`src/App.tsx`)

```typescript
const App: React.FC = () => {
  const { loadTokens, updatePrices } = useAppStore();

  useEffect(() => {
    // Tokenlarni yuklash
    loadTokens();

    // Har 1 soniyada narxlarni yangilash
    const priceInterval = setInterval(() => {
      updatePrices();
    }, 1000);

    // Dastlabki narxlarni olish
    updatePrices();

    return () => clearInterval(priceInterval);
  }, [loadTokens, updatePrices]);
  
  // ...
};
```

### Narxlardan Foydalanish

#### Portfolio Sahifasida

```typescript
export default function HolderPortfolioPage() {
  const { prices } = useAppStore();
  
  // Narxni olish
  const getTokenPrice = (symbol: string): number => {
    const priceData = prices[symbol.toLowerCase()];
    return priceData?.price_usdt || 0;
  };
  
  // Qiymatni hisoblash
  const calculateValue = (amount: number, symbol: string): number => {
    return amount * getTokenPrice(symbol);
  };
  
  // Narxlar avtomatik yangilanadi (har 1 soniya)
  useEffect(() => {
    if (assets.length > 0 && Object.keys(prices).length > 0) {
      const total = calculateTotalValue();
      setPortfolioValue(total);
    }
  }, [prices, assets]);
}
```

### Narx Ma'lumotlari Strukturasi

```typescript
interface TokenPrice {
  symbol: string;          // "BTC"
  price_usdt: number;      // 45000
  price_kgs: number;       // 3915000 (45000 * 87)
  last_updated: number;    // timestamp
}

interface PriceCache {
  [symbol: string]: TokenPrice;
}

// Misol:
{
  "btc": {
    "symbol": "BTC",
    "price_usdt": 45000,
    "price_kgs": 3915000,
    "last_updated": 1704326400000
  },
  "eth": {
    "symbol": "ETH",
    "price_usdt": 2500,
    "price_kgs": 217500,
    "last_updated": 1704326400000
  }
}
```

---

## Token Whitelist

### Database Strukturasi

```sql
CREATE TABLE token_whitelist (
  symbol text PRIMARY KEY,           -- "BTC"
  name text NOT NULL,                -- "Bitcoin"
  coingecko_id text NOT NULL,        -- "bitcoin"
  logo_url text,                     -- CoinGecko logo URL
  market_cap_rank integer DEFAULT 999,
  created_at timestamptz DEFAULT now()
);
```

### Token Ma'lumotlari

50 ta top native coin:
- BTC, ETH, BNB, SOL, XRP, ADA, AVAX, DOGE, TRX, DOT
- MATIC, LTC, SHIB, BCH, UNI, LINK, ATOM, XLM, XMR, ETC
- NEAR, ALGO, FIL, VET, APT, HBAR, ICP, ARB, OP, INJ
- SUI, TIA, SEI, FTM, AAVE, EOS, XTZ, THETA, FLOW, EGLD
- SAND, MANA, AXS, ZEC, KAVA, NEO, IOTA, DASH, WAVES, ZIL

**CoinGecko ID Mapping:**
- Symbol: BTC → CoinGecko ID: bitcoin
- Symbol: ETH → CoinGecko ID: ethereum
- Symbol: BNB → CoinGecko ID: binancecoin

---

## Kesh Tizimi

### Price Service Keshi

```typescript
class PriceService {
  private cache: PriceCache = {};
  private lastFetchTime = 0;
  private isFetching = false;
  
  async fetchPrices(coingeckoIds: string[]): Promise<PriceCache> {
    const now = Date.now();
    
    // Keshni tekshirish (60 soniya)
    if (now - this.lastFetchTime < CACHE_DURATION) {
      return this.cache; // Keshdan qaytarish
    }
    
    // Yangi narxlarni olish
    // ...
  }
}
```

**Kesh Strategiyasi:**
1. **60 soniya kesh** - CoinGecko API chaqiruvlarini kamaytirish
2. **1 soniya yangilanish** - UI da real-time ko'rinish
3. **Fail-safe** - Xatolikda eski keshni qaytarish

---

## Xavfsizlik

### ✅ Xavfsiz

1. **Anon Key** - Frontend da ishlatish mumkin
2. **CoinGecko Free API** - API key talab qilinmaydi
3. **RLS Policies** - Database xavfsizligi

### ❌ Xavfli

1. **Service Role Key** - HECH QACHON frontend ga qo'ymang
2. **Private Keys** - Blockchain kalitlari
3. **Admin Passwords** - Parollar

---

## Troubleshooting

### Narxlar Ko'rinmayapti

**Sabab 1:** Tokenlar yuklanmagan
```typescript
// Tekshirish
const { tokens } = useAppStore();
console.log('Tokens:', tokens.length);
```

**Yechim:** `loadTokens()` chaqirilganini tekshiring

**Sabab 2:** CoinGecko API xatosi
```typescript
// Tekshirish
const { prices } = useAppStore();
console.log('Prices:', Object.keys(prices).length);
```

**Yechim:** Network va API limitlarni tekshiring

**Sabab 3:** Komponent prices o'zgarishini kuzatmayapti
```typescript
// Yechim: useEffect qo'shing
useEffect(() => {
  if (Object.keys(prices).length > 0) {
    // Narxlarni qayta hisoblash
  }
}, [prices]);
```

### Database Ulanmayapti

**Tekshirish:**
```typescript
import { supabase } from '@/db/supabase';

// Test query
const { data, error } = await supabase
  .from('token_whitelist')
  .select('count');
  
console.log('Database test:', data, error);
```

**Yechim:**
1. `.env` faylda VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY ni tekshiring
2. Supabase loyiha faol ekanligini tekshiring
3. RLS policies to'g'ri sozlanganini tekshiring

---

## Qo'shimcha Resurslar

- **CoinGecko API Docs:** https://www.coingecko.com/en/api/documentation
- **Supabase Docs:** https://supabase.com/docs
- **Vite Env Variables:** https://vitejs.dev/guide/env-and-mode.html
