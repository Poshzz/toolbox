# 🧰 Toolbox — กล่องเครื่องมือออนไลน์

รวมเครื่องมือใช้บ่อยไว้ในกล่องเดียว — Everyday tools, ครบจบในกล่องเดียว

จุดเด่นสั้นๆ:

- 🔒 ทำงานฝั่ง client **100%** — ข้อมูลทุกอย่างประมวลผลในเบราว์เซอร์ของคุณ ไม่มีการอัปโหลดขึ้นเซิร์ฟเวอร์
- 🆓 ฟรี
- ⚡ ไม่ต้องสมัคร ไม่ต้องล็อกอิน เปิดปุ๊บใช้ได้ปั๊บ

## ✨ เครื่องมือทั้งหมด — 26 เครื่องมือ ใน 6 หมวด

### 01 Text — ข้อความ
- **Word Counter** — นับคำและตัวอักษร
- **Case Converter** — แปลงตัวพิมพ์
- **Text Cleaner** — จัดระเบียบข้อความ
- **JSON Formatter** — จัดรูปแบบ JSON
- **Lorem Ipsum** — สร้างข้อความตัวอย่าง

### 02 Convert — แปลงค่า
- **Unit Converter** — แปลงหน่วยวัด
- **Base Converter** — แปลงฐานตัวเลข
- **Color Converter** — แปลงค่าสี
- **Timestamp Converter** — แปลงวันที่และเวลา

### 03 Generate — สุ่มและสร้าง
- **QR Generator** — สร้าง QR Code
- **Password Generator** — สุ่มรหัสผ่าน
- **UUID Generator** — สร้าง UUID
- **Random Picker** — สุ่มเลข เต๋า จับฉลาก

### 04 Dev — สำหรับนักพัฒนา
- **Base64** — เข้ารหัส Base64
- **Hash Generator** — สร้างค่าแฮช
- **URL Tools** — เข้ารหัสและแกะ URL
- **JWT Decoder** — ถอดรหัส JWT
- **Diff Checker** — เทียบข้อความ
- **Regex Tester** — ทดสอบ Regex

### 05 Finance — การเงิน
- **Percentage Calculator** — คำนวณเปอร์เซ็นต์
- **Interest Calculator** — คำนวณดอกเบี้ย
- **Bill Split** — แบ่งบิล
- **Loan Calculator** — คำนวณค่างวด

### 06 Image — รูปภาพ
- **Image Resizer** — ย่อและขยายรูป
- **Image Converter** — แปลงไฟล์รูป
- **Image Info** — ข้อมูลรูปภาพ

## 🛠 Tech Stack

- Vite 6 — build tool
- React 19 + TypeScript
- Tailwind CSS v4 (ผ่าน `@tailwindcss/vite`)
- react-router-dom (HashRouter — ใช้กับ GitHub Pages ได้ทุก subpath)
- qrcode — สร้าง QR Code
- lucide-react — ไอคอน

## 📁 โครงสร้างโปรเจกต์

```
src/
├── data/
│   ├── tools.ts    # registry รวมทุกเครื่องมือ (CHAPTERS + TOOLS) — เพิ่มเครื่องมือที่นี่
│   └── site.ts     # ชื่อเว็บ + repo URL
├── pages/
│   └── tools/      # component ต่อเครื่องมือ (1 ไฟล์ต่อ 1 เครื่องมือ)
├── components/     # Header, Footer, SearchDialog, ToolCard, PageShell, ui
└── lib/            # utils, md5, diff
```

## 🚀 เริ่มใช้งาน

ต้องมี **Node 20+** จากนั้น:

```bash
npm install      # ติดตั้ง dependencies
npm run dev      # เปิด dev server → http://localhost:5173
npm run build    # typecheck (tsc --noEmit) + build → dist/
npm run preview  # ทดสอบดูผลลัพธ์จาก dist/
```

## 🌐 Deploy ขึ้น GitHub Pages

1. แก้ URL repo ใน `src/data/site.ts` จาก placeholder (`https://github.com/your-username/toolbox`) เป็น repo จริงของคุณ
2. สร้าง repo บน GitHub แล้ว push โค้ดขึ้น branch `main`
3. ไปที่ **Settings → Pages → Source** เลือก **"GitHub Actions"**
4. push ครั้งถัดไป workflow `.github/workflows/deploy.yml` จะ build + deploy อัตโนมัติ
5. เว็บจะออนไลน์ที่ `https://<username>.github.io/<repo>/` — ไม่ต้องแก้อะไรเพิ่ม เพราะตั้ง `base './'` + HashRouter ไว้แล้ว

## ➕ วิธีเพิ่มเครื่องมือใหม่

1. สร้าง component ใน `src/pages/tools/` (เช่น `MyTool.tsx`)
2. เพิ่ม entry ใน `TOOLS` array ใน `src/data/tools.ts`:
   - `id`, `name`, `th`, `desc` — ข้อมูลเครื่องมือ
   - `chapter` — หนึ่งใน `text | convert | generate | dev | finance | image`
   - `icon` — ไอคอนจาก lucide-react
   - `keywords` — คำค้นหา (ใช้ในช่อง search)
   - `component: lazy(() => import('../pages/tools/MyTool'))`
3. เท่านี้ — **ไม่ต้องแก้ไฟล์อื่นเลย** หน้าเว็บ/ค้นหา/เมนูก่อน-ถัดไปอัปเดตตามอัตโนมัติ

---

สไตล์ได้แรงบันดาลใจจาก **"Coffee Cycle"** โดย Delta Cafés (Bürocratik) · ฟรีสำหรับทุกการใช้งาน
