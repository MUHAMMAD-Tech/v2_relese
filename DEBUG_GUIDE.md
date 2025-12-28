# LETHEX - Debug Qo'llanmasi

## Kirish Kodi Muammosini Aniqlash

### Qadam 1: Brauzer Konsolini Oching

**Chrome/Edge:**
1. F12 tugmasini bosing yoki Ctrl+Shift+I (Windows/Linux) / Cmd+Option+I (Mac)
2. "Console" tabiga o'ting

**Firefox:**
1. F12 tugmasini bosing yoki Ctrl+Shift+K (Windows/Linux) / Cmd+Option+K (Mac)
2. "Console" tabiga o'ting

### Qadam 2: Login Sahifasiga O'ting

1. Brauzerda LETHEX login sahifasini oching
2. Konsolni ochiq qoldiring

### Qadam 3: "Muso2909" Kirish Kodini Kiriting

1. Kirish kodi maydoniga `Muso2909` ni kiriting (katta-kichik harflar muhim!)
2. "Tizimga kirish" tugmasini bosing

### Qadam 4: Konsol Loglarini Tekshiring

Konsolda quyidagi xabarlar ko'rinishi kerak:

```
Kirish kodi tekshirilmoqda: Muso2909
getSystemSettings: Fetching from database...
getSystemSettings: Data retrieved: {id: 1, admin_access_code: "Muso2909", updated_at: "..."}
verifyAdminAccessCode called with code: Muso2909
System settings retrieved: {id: 1, admin_access_code: "Muso2909", updated_at: "..."}
Code match result: true Expected: Muso2909 Got: Muso2909
Admin tekshiruvi natijasi: true
Admin sifatida kirish...
```

## Muammolarni Aniqlash

### Holat 1: "getSystemSettings: Error fetching system settings"

**Sabab:** Ma'lumotlar bazasiga ulanish muammosi yoki RLS siyosatlari noto'g'ri

**Yechim:**
1. Internet aloqasini tekshiring
2. Supabase xizmati ishlayotganini tekshiring
3. Konsolda batafsil xato xabarini ko'ring
4. Agar "permission denied" xatosi bo'lsa, RLS siyosatlari noto'g'ri sozlangan

**RLS Siyosatlarini Tekshirish:**
Supabase Dashboard → SQL Editor → Quyidagi so'rovni bajaring:
```sql
SELECT * FROM pg_policies WHERE tablename = 'system_settings';
```

Kutilayotgan natija:
- Policy name: "Anyone can view system settings"
- Command: SELECT
- Roles: {public}
- Using: true

### Holat 2: "getSystemSettings: Data retrieved: null"

**Sabab:** Ma'lumotlar bazasida system_settings yozuvi yo'q

**Yechim:**
Supabase Dashboard → SQL Editor → Quyidagi so'rovni bajaring:
```sql
-- Mavjud yozuvni tekshirish
SELECT * FROM public.system_settings WHERE id = 1;

-- Agar yo'q bo'lsa, yaratish
INSERT INTO public.system_settings (id, admin_access_code) 
VALUES (1, 'Muso2909')
ON CONFLICT (id) DO UPDATE SET admin_access_code = 'Muso2909';
```

### Holat 3: "Code match result: false"

**Sabab:** Kirish kodi ma'lumotlar bazasidagi kod bilan mos kelmayapti

**Yechim:**
1. Konsolda "Expected" va "Got" qiymatlarini solishtiring
2. Katta-kichik harflarni tekshiring (Muso2909 ≠ muso2909)
3. Bo'sh joylar yoki maxsus belgilar borligini tekshiring

**Ma'lumotlar Bazasidagi Qiymatni Tekshirish:**
```sql
SELECT 
  admin_access_code,
  LENGTH(admin_access_code) as uzunlik,
  admin_access_code = 'Muso2909' as to_g_ri_mos
FROM public.system_settings 
WHERE id = 1;
```

### Holat 4: "Admin tekshiruvi natijasi: true" lekin kirish muvaffaqiyatsiz

**Sabab:** Supabase Auth muammosi

**Yechim:**
1. Konsolda SignIn/SignUp xatolarini tekshiring
2. Agar "Email not confirmed" xatosi bo'lsa:
   - Supabase Dashboard → Authentication → Settings
   - "Enable email confirmations" ni o'chiring
3. Agar "Invalid login credentials" xatosi bo'lsa:
   - Birinchi marta kirish uchun SignUp avtomatik bajarilishi kerak
   - Konsolda "SignUp muvaffaqiyatli" xabarini kutish kerak

### Holat 5: Hech qanday log ko'rinmayapti

**Sabab:** JavaScript xatolari yoki brauzer muammosi

**Yechim:**
1. Konsolda qizil xato xabarlari borligini tekshiring
2. Sahifani yangilang (F5 yoki Ctrl+R)
3. Brauzer cache'ini tozalang:
   - Chrome: Ctrl+Shift+Delete → "Cached images and files" → Clear data
   - Firefox: Ctrl+Shift+Delete → "Cache" → Clear Now
4. Boshqa brauzerda sinab ko'ring

## To'liq Debug Jarayoni

### 1. Ma'lumotlar Bazasini Tekshirish

Supabase Dashboard → SQL Editor:

```sql
-- 1. system_settings jadvalini tekshirish
SELECT * FROM public.system_settings WHERE id = 1;

-- 2. RLS yoqilganligini tekshirish
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'system_settings';

-- 3. RLS siyosatlarini tekshirish
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'system_settings';

-- 4. Agar kerak bo'lsa, admin kodini qayta o'rnatish
UPDATE public.system_settings 
SET admin_access_code = 'Muso2909', updated_at = NOW() 
WHERE id = 1;
```

### 2. Supabase Konfiguratsiyasini Tekshirish

`.env` faylini tekshiring:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Network So'rovlarini Tekshirish

Brauzer DevTools → Network tab:
1. Login tugmasini bosing
2. "system_settings" so'rovini toping
3. Response tabini oching
4. Status code 200 bo'lishi kerak
5. Response data'da admin_access_code ko'rinishi kerak

### 4. Supabase Logs'ni Tekshirish

Supabase Dashboard → Logs → Postgres Logs:
- SELECT so'rovlari muvaffaqiyatli bajarilayotganini tekshiring
- RLS policy violations yo'qligini tekshiring

## Tez-tez So'raladigan Savollar

### S: Kirish kodi katta-kichik harflarga sezgirmi?
J: Ha, "Muso2909" va "muso2909" turli kodlar hisoblanadi.

### S: Kirish kodini qanday o'zgartiraman?
J: Admin sifatida kirgandan keyin, Sozlamalar sahifasiga o'ting va yangi kod o'rnating.

### S: Birinchi marta kirganda nima bo'ladi?
J: Tizim avtomatik ravishda admin@miaoda.com email bilan admin akkaunt yaratadi.

### S: Agar kirish kodi unutilsa nima qilish kerak?
J: Supabase Dashboard orqali SQL so'rov bilan yangi kod o'rnatish mumkin.

### S: Bir nechta admin bo'lishi mumkinmi?
J: Yo'q, faqat bitta admin kirish kodi mavjud. Lekin bir nechta foydalanuvchi admin rolini olishi mumkin.

## Yordam Olish

Agar yuqoridagi qadamlar yordam bermasa:

1. **Barcha konsol loglarini nusxalang**
2. **Network tab'dan muvaffaqiyatsiz so'rovlarni screenshot qiling**
3. **Supabase Dashboard'dan Logs'ni eksport qiling**
4. **Quyidagi ma'lumotlarni to'plang:**
   - Brauzer nomi va versiyasi
   - Operatsion tizim
   - Xato xabarlari
   - Qachon muammo paydo bo'ldi

5. **Texnik yordam uchun murojaat qiling**

## Tizimni Qayta Tiklash

Agar hamma narsa ishlamasa, quyidagi qadamlarni bajaring:

```sql
-- 1. system_settings jadvalini tozalash va qayta yaratish
DELETE FROM public.system_settings WHERE id = 1;
INSERT INTO public.system_settings (id, admin_access_code) 
VALUES (1, 'Muso2909');

-- 2. RLS siyosatlarini qayta yaratish
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;

CREATE POLICY "Anyone can view system settings" ON public.system_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update system settings" ON public.system_settings
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- 3. Natijani tekshirish
SELECT * FROM public.system_settings WHERE id = 1;
SELECT * FROM pg_policies WHERE tablename = 'system_settings';
```

Keyin brauzer cache'ini tozalang va qayta urinib ko'ring.
