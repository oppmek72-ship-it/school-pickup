# 🚚 ຍ້າຍ Database ຈາກ Render → Supabase

ຄູ່ມືຍ້າຍ DB ຈາກ Render free PostgreSQL (90-day expiry) ໄປ Supabase ຟຣີ (ບໍ່ໝົດອາຍຸ).
ໃຊ້ເວລາ ~15 ນາທີ. ບໍ່ມີຂໍ້ມູນຫາຍ.

---

## ✅ ກ່ອນເລີ່ມ

ໃຫ້ມີ:
- ເຄື່ອງຄອມພິວເຕີທີ່ run code repo ນີ້ໄດ້ (Node.js + npm)
- ບັນຊີ Render Dashboard
- ໃຊ້ເວລາຕໍ່ເນື່ອງ 15 ນາທີ (ຫ້າມຂັດຈັງຫວະຍາມ migrate)
- ເລືອກເວລາ "ນອກໂມງຮັບເດັກ" (ເຊັ່ນ ຕອນເດິກ) — ມີ downtime ~2 ນາທີ

---

## STEP 1 — ສ້າງ Supabase Project (ເຈົ້າເຮັດເອງ ~5 ນາທີ)

1. ເຂົ້າ https://supabase.com → **Start your project** → Sign in with GitHub (ໃຊ້ບັນຊີດຽວກັນກັບ Render)
2. ກົດ **New project**
   - **Name:** `school-pickup-db`
   - **Database Password:** ສ້າງລະຫັດແຮງ ➔ **ບັນທຶກໄວ້ບ່ອນປອດໄພ** (ຈະໃຊ້ຕໍ່)
   - **Region:** **Southeast Asia (Singapore)** ⭐ ສຳຄັນ! ໃກ້ Lao ທີ່ສຸດ
   - **Pricing Plan:** Free
3. ກົດ **Create new project** → ລໍ ~2 ນາທີ ໃຫ້ provision
4. ເຂົ້າ project → ດ້ານຊ້າຍ ⚙️ **Project Settings** → **Database**
5. ເລື່ອນລົງຫາ **Connection string** → tab **URI**
6. ກົດ **Display connection pooler** OFF (ໃຊ້ direct connection ສຳລັບ migration)
7. ຄັດລອກ URL ມາ — ຈະໄດ້ປະມານ:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxx.supabase.co:5432/postgres
   ```
8. ປ່ຽນ `[YOUR-PASSWORD]` ເປັນລະຫັດທີ່ສ້າງໄວ້ໃນ step 2

✅ ບັນທຶກ URL ນີ້ໄວ້ → ຈະໃຊ້ໃນ step 3

---

## STEP 2 — ເອົາ DATABASE_URL ປະຈຸບັນຈາກ Render (~1 ນາທີ)

1. ເຂົ້າ https://dashboard.render.com → **Databases** → `school-pickup-db-sg`
2. ເລື່ອນລົງຫາ **Connections**
3. ຄັດລອກ **External Database URL** (ຮູບແບບ `postgres://pickup_user:xxx@dpg-xxx-a.oregon-postgres.render.com/school_pickup`)

✅ ບັນທຶກ URL ນີ້ໄວ້ → ຈະໃຊ້ໃນ step 3

---

## STEP 3 — Push schema ໄປ Supabase (~1 ນາທີ)

ເປີດ PowerShell ໃນ folder `backend`:

```powershell
cd backend

# ຊີ້ Prisma ໄປ Supabase ຊົ່ວຄາວ
$env:DATABASE_URL = "<ໃສ່ Supabase URL ຈາກ Step 1 ທີ່ນີ້>"

# ສ້າງ tables ທັງໝົດໃນ Supabase ຕາມ schema
npx prisma db push

# ກວດ → ຄວນເຫັນ "Your database is now in sync with your Prisma schema"
```

---

## STEP 4 — Migrate ຂໍ້ມູນ (~3 ນາທີ)

ຍັງຢູ່ໃນ folder `backend`, ຍັງຢູ່ໃນ PowerShell ດຽວ:

```powershell
$env:SOURCE_DATABASE_URL = "<Render URL ຈາກ Step 2>"
$env:TARGET_DATABASE_URL = "<Supabase URL ຈາກ Step 1>"

node scripts/migrate-db.js
```

ຄວນເຫັນຂໍ້ຄວາມຄ້າຍດັ່ງນີ້:

```
🗄️  DB MIGRATION
   SOURCE: postgresql://***@dpg-xxx.oregon-postgres.render.com/...
   TARGET: postgresql://***@db.xxx.supabase.co:5432/postgres

📊 Source row counts:
   Classroom          15 rows
   User               5 rows
   Student            287 rows
   PickupRequest      45 rows
   ...

🧹 Wiping target...
📥 Copying data...
🔢 Resetting sequences...
✅ Target row counts (AFTER):
   Classroom          15 rows ✓
   ...

✅ MIGRATION SUCCESSFUL — all row counts match.
```

ຖ້າເຫັນ ❌ → ຢຸດ! ສົ່ງ output ມາໃຫ້ຂ້ອຍ. ຢ່າເຮັດ Step 5 ຈົນກວ່າຈະຜ່ານ.

---

## STEP 5 — ປ່ຽນ Render ໃຫ້ໃຊ້ Supabase (~2 ນາທີ)

1. ເຂົ້າ Render Dashboard → service `school-pickup-sg` → **Environment**
2. ຫາ env var `DATABASE_URL`
3. ຄລິກ **Edit** → ປ່ຽນ value ເປັນ Supabase URL (ຈາກ Step 1)
4. ກົດ **Save Changes**
5. Render ຈະ redeploy ອັດຕະໂນມັດ (~2 ນາທີ) → ບໍ່ຕ້ອງເຮັດຫຍັງ

---

## STEP 6 — ທົດສອບ (~2 ນາທີ)

1. ລໍ Render deploy ຈົບ → tab **Logs** → ຄວນເຫັນ:
   ```
   🚀 Server running on port 10000
   🗄️  DB pool warm (XXXms)
   ✅ Admin user ready
   ```
2. ເປີດເວັບໄຊ້ → ກົດ pill ສະຖານະ → ຄວນຂຽວ 🟢
3. Login ດ້ວຍ STD-XXXX ທີ່ໃຊ້ໄດ້ → ຄວນເຂົ້າໄດ້
4. ກວດ admin → ນັກຮຽນ → ເຫັນຂໍ້ມູນຄົບຖ້ວນ

---

## STEP 7 — ລົບ Render DB ເກົ່າ (ຫຼັງຢືນຢັນ ~7 ວັນ)

⚠️ ລໍ 1 ອາທິດ ໃຫ້ແນ່ໃຈວ່າທຸກຢ່າງເຮັດວຽກ ກ່ອນລົບ DB ເກົ່າ.

1. ເຂົ້າ Render Dashboard → Databases → `school-pickup-db-sg`
2. **Settings** → ເລື່ອນລົງສຸດ → **Delete Database**

---

## 🆘 ຖ້າມີບັນຫາ

| ບັນຫາ | ວິທີແກ້ |
|---|---|
| `prisma db push` ຫາ Supabase fail | ກວດ password ໃນ URL ບໍ່ມີ `[YOUR-PASSWORD]` ເຫຼືອ |
| Migration script "row counts do not match" | ຢຸດ! ຢ່າປ່ຽນ DATABASE_URL ໃນ Render — ຍັງໃຊ້ DB ເກົ່າຢູ່ |
| Login fail ຫຼັງປ່ຽນ DATABASE_URL | Revert env var ກັບເປັນ Render URL ເກົ່າ — ຂໍ້ມູນບໍ່ຫາຍ |
| ລືມ Supabase password | ໃນ Supabase → Settings → Database → **Reset database password** |
| Supabase pause ຫຼັງ 7 ວັນ ບໍ່ມີ activity | keep-warm GitHub Action ping ທຸກ 14 ນາທີ → ບໍ່ pause |

---

## ✅ ສິ່ງທີ່ໄດ້ຫຼັງ migrate

- ❌ ບໍ່ມີ 90-day expiry ຕີຫົວອີກ
- ✅ Backup ອັດຕະໂນມັດທຸກວັນ (Supabase free tier ມີ daily backup 7 ມື້)
- ✅ Region Singapore = latency ຕ່ຳກວ່າ Render us-west1 (5-10 ເທົ່າ)
- ✅ Dashboard ສວຍ ກວດຂໍ້ມູນໄດ້ງ່າຍ
- ✅ ບໍ່ມີຄ່າໃຊ້ຈ່າຍ
