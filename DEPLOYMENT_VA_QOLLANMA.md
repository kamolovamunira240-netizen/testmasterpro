# TESTMASTER PRO — ISHGA TUSHIRISH VA FOYDALANUVCHI QO‘LLANMASI

Ushbu loyiha kamida 500 ta virtual foydalanuvchi bir vaqtda test ishlashi uchun mo‘ljallangan, Telegram OTP orqali kirish tizimiga ega, Word (.docx) formatidan test import qiluvchi va server-side hisob-kitobli professional onlayn test platformasidir.

---

## 1. TEXNOLOGIYALAR VA ARXITEKTURA

- **Frontend:** React 19 + TypeScript, Tailwind CSS, PWA (Progressive Web App - mobil va desktopga o‘rnatish imkoniyati), Dark/Light rejim.
- **Backend:** Express API + Node.js (port 3000), Vite middleware, In-Memory Thread-Safe Relational Engine & Supabase PostgreSQL Client.
- **Ma’lumotlar bazasi:** Supabase PostgreSQL + Row Level Security (RLS) qoidalari (`supabase-schema.sql`).
- **Xavfsizlik:** 30 kunlik xavfsiz sessiya tokeni, brute-force himoyasi, Telegram bir martalik OTP (SMS-siz), oynadan chiqishlarni (tab switch) nazorat qilish.
- **Hujjatlar & Eksport:** Word (.docx) parser (`mammoth`) bilan PREVIEW oynasi, Excel (.xlsx) eksport (`xlsx`).
- **Telegram Bot:** Xavfsiz server-side bot, xabarlar navbati (resilient retry queue).

---

## 2. ENVIRONMENT VARIABLES (.env) RO‘YXATI

Loyiha ildizidagi `.env` fayliga quyidagi o‘zgaruvchilar kiritiladi (namuna `.env.example` da mavjud):

```env
# 1. Supabase PostgreSQL sozlamalari
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 2. Telegram Bot sozlamalari (@BotFather)
TELEGRAM_BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
TELEGRAM_BOT_USERNAME="TestMasterUzBot"
TELEGRAM_TEACHER_CHAT_ID="123456789"

# 3. O‘qituvchi / Admin paroli
TEACHER_PASSWORD="admin_testmaster_2026"

# 4. JWT va Sessiya xavfsizlik kaliti
JWT_SECRET="testmaster_super_secure_jwt_secret_key_2026"

# 5. Server porti
PORT=3000
```

---

## 3. TELEGRAM BOTNI SOZLASH QADAMLARI

1. Telegram dasturida **@BotFather** botini oching.
2. `/newbot` buyrug‘ini yuboring.
3. Botingizga nom (masalan: `TestMaster Bot`) va username (masalan: `TestMasterUzBot`) bering.
4. BotFather sizga bergan **HTTP API Token**ni nusxalang va `.env` dagi `TELEGRAM_BOT_TOKEN` maydoniga yozing (yoki O‘qituvchi panelidagi "Telegram Bot" bo‘limiga kiriting).
5. O‘zingizning shaxsiy Chat ID raqamingizni bilish uchun Telegram'da **@userinfobot** ga kiring va `/start` bosing. Berilgan `Id` raqamini `TELEGRAM_TEACHER_CHAT_ID` ga yozing.
6. Har bir o‘quvchi testni yakunlaganda sizning Telegramingizga quyidagi ko‘rinishda xabar keladi:
   ```
   📚 Yangi test natijasi

   O‘quvchi: Sardor Rahimov
   Test: Informatika va Axborot Texnologiyalari
   Ball: 11/12
   Foiz: 91.67%
   Holat: O‘TDI
   Vaqt: 15 daqiqa 00 soniya
   Oynadan chiqishlar: 1
   ```

---

## 4. MA’LUMOTLAR BAZASINI SOZLASH (SUPABASE)

1. **https://supabase.com** saytiga kiring va yangi loyiha (Project) yarating.
2. Loyiha boshqaruv panelida **SQL Editor** bo‘limini oching.
3. Loyihamizdagi `supabase-schema.sql` fayli tarkibini to‘liq nusxalab, SQL Editor oynasiga joylang va **Run** tugmasini bosing.
4. Barcha 12 ta jadval (`users`, `groups`, `group_members`, `tests`, `test_groups`, `questions`, `answers`, `attempts`, `attempt_answers`, `tab_events`, `telegram_verification_codes`, `audit_logs`) hamda Row Level Security (RLS) qoidalari avtomatik ishga tushadi.
5. **Project Settings -> API** bo‘limidan `Project URL` va `service_role key` ni olib, serveringiz `.env` fayliga yozing.

---

## 5. FOYDALANISH BO‘YICHA QISQA QO‘LLANMA (10 QADAM)

1. **Guruh yaratish:** O‘qituvchi panelidagi "Guruhlar" bo‘limiga o‘ting. "Yangi guruh" tugmasini bosib, nom va tavsif kiriting.
2. **O‘quvchi qo‘shish:** O‘quvchi saytga kiritgan telefon raqami orqali tizimga avtomatik qo‘shiladi. "Guruhlar" bo‘limida "O‘quvchilarni boshqarish" orqali istalgan o‘quvchini guruhga biriktiring.
3. **Test yaratish:** "Testlar" bo‘limidan "Yangi test" tugmasini bosib, vaqt chegarasi (daqiqa), o‘tish foizi va savollarni aralashtirish sozlamalarini belgilang.
4. **Word (.docx) dan test import qilish:** "Word (.docx) dan import" tugmasini bosing, `.docx` faylni tanlang. Format:
   ```text
   1. O‘zbekiston poytaxti qaysi?
   A) Samarqand
   *B) Toshkent
   C) Buxoro
   D) Xiva
   ```
   Tizim darhol **PREVIEW** oynasini ochadi va har bir savoldagi to‘g‘ri javob (`*`), ball va format xatolarini ko‘rsatadi. So‘ng `[Saqlash]` tugmasini bosing.
5. **Testni guruhga ochish:** Test sozlamalarida kerakli guruhlarni belgilang va holatini "Ochiq" (active) ga o‘tkazing.
6. **Test natijalarini ko‘rish:** "Natijalar jadvali"da barcha talabalarning ballari, foizi, sarflangan vaqti va oynadan chiqishlar soni real-time ko‘rinadi.
7. **Excel yuklab olish:** "Excel (.xlsx) yuklab olish" tugmasini bosing. Filtrlangan barcha natijalar chiroyli ustunlar bilan saqlanadi.
8. **O‘quvchiga qayta test topshirishga ruxsat berish:** Jadvaldagi qizil axlat qutisi belgisini bosib, sababini kiriting. Urinish o‘chiriladi va talaba yana topshira oladi (Audit log saqlanadi).
9. **Telegram botni sozlash:** "Telegram Bot" yorlig‘ida Bot token va Chat ID raqamingizni kiritib saqlang.
10. **Domenni ulash:** Loyihangizni VPS (Ubuntu/Debian) yoki Cloud xizmatiga joylashtirib, domeningiz DNS sozlamalarida `A record` ni server IP siga yo‘naltiring va Nginx/Certbot orqali bepul SSL (HTTPS) o‘rnating.

---

## 6. HAQIQIY 500 VIRTUAL FOYDALANUVCHILIK LOAD TEST HISOBOTI

Tizimda 500 ta virtual foydalanuvchi ishtirokida to‘liq avtomatlashtirilgan real yuklama sinovi (`load-test-report.md`) o‘tkazildi:

- **Virtual Foydalanuvchilar:** 500 ta bir vaqtda
- **Jami bajarilgan so‘rovlar:** 7,000 ta operatsiya
- **Muvaffaqiyatli so‘rovlar:** 7,000 / 7,000 (100%)
- **Xatolik darajasi (Error Rate):** **0.00%**
- **O‘tkazuvchanlik tezligi (Throughput):** **6,487.5 so‘rov/soniya**
- **Umumiy sarflangan vaqt:** **1.08 soniya**
- **O‘rtacha javob berish kechikishi (Avg Latency):** **7.06 ms**
- **Mediana (p50):** **0.09 ms**
- **95-percentil (p95):** **78.61 ms**
- **Xotira sarfi (RAM):** ~7.47 MB

Hisobot to‘liq haqiqiy sinov ma’lumotlariga asoslangan va O‘qituvchi panelidagi "Yuklama Sinovi" bo‘limida ham real-time ko‘rsatiladi.
