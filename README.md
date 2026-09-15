# HỆ THỐNG QUẢN LÝ MÁY IN & MỰC IN
### TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN

Web App chuyên dụng dành cho Trường Cao Đẳng Bách Khoa Nam Sài Gòn nhằm quản lý toàn diện và tập trung thiết bị máy in, các loại mực in, lịch sử nạp/thay cartridge, theo dõi sự cố sửa chữa, tối ưu hóa giao diện điện thoại và quét mã QR dán trên máy in để báo hỏng.

> **QUY TẮC CỐT LÕI:** Hệ thống phục vụ công tác quản trị thiết bị cơ sở vật chất, **TUYỆT ĐỐI KHÔNG quản lý giá tiền, đơn giá, chi phí hoặc thành tiền**.

---

## 1. Công Nghệ Sử Dụng

* **Frontend:** Next.js (App Router), React 18, TypeScript, Tailwind CSS
* **Biểu đồ thống kê:** Recharts (LineChart, BarChart, DonutChart)
* **Icon:** Lucide React
* **Xử lý thời gian:** `date-fns` (Timezone: `Asia/Ho_Chi_Minh`, định dạng `DD/MM/YYYY`)
* **Mã QR:** `qrcode.react` (Tự động sinh QR SVG cho từng máy in để in dán nhãn)
* **Xuất báo cáo:** SheetJS (`xlsx`) xuất file Excel, CSV và Print layout PDF
* **Backend Database:** Firebase Authentication, Cloud Firestore, Firebase Storage
* **Chế độ kiểm thử kép (Dual Mode):**
  * Tự động kết nối Cloud Firestore nếu có cấu hình `.env`
  * Sẵn sàng hoạt động ngay lập tức (Out-of-the-box) với Local Storage synchronized store và 14 đơn vị mặc định, 16 máy in và hàng chục giao dịch mẫu mà không cần cấu hình Firebase trước.

---

## 2. Cấu Trúc Tuyến Đường (Routes)

| Tuyến đường (Route) | Mô tả chức năng |
| ------------------- | --------------- |
| `/login` | Đăng nhập hệ thống (hỗ trợ 1-click chọn tài khoản demo) |
| `/dashboard` | Dashboard tổng quan với 10 thẻ KPI, 5 biểu đồ Recharts, Cảnh báo thông minh & Hoạt động gần đây |
| `/departments` | Danh sách 14 Khoa/Phòng mặc định (6 Khoa, 8 Phòng), tìm kiếm, lọc và thống kê máy |
| `/departments/new` | Thêm mới Khoa hoặc Phòng ban |
| `/departments/[id]` | Chi tiết Khoa/Phòng: chỉ số máy, danh sách máy in và lịch sử nạp mực riêng của đơn vị |
| `/printers` | Danh sách máy in toàn trường, lọc đa tiêu chí, tra cứu serial, xem/in mã QR |
| `/printers/new` | Khai báo máy in mới với tính năng tự động sinh mã máy (vd: `PRN-CNTT-001`) |
| `/printers/[id]` | Chi tiết máy in: 6 chỉ số hoạt động, timeline sự kiện và 5 tabs nghiệp vụ |
| `/printers/[id]/edit` | Chỉnh sửa thông tin máy in |
| `/toners` | Danh mục các loại hộp mực tương thích cho các dòng máy |
| `/toners/new` | Thêm loại mực mới |
| `/toner-transactions/new` | Form ghi nhận nạp mực / thay cartridge (tự điền đơn vị, vị trí, model máy) |
| `/toner-transactions` | Lịch sử nạp mực toàn trường với Snapshot Khoa/Phòng bảo lưu chính xác |
| `/repairs` | Quản lý sửa chữa máy in, theo dõi quy trình từ báo hỏng đến hoàn thành |
| `/repairs/new` | Lập phiếu báo hỏng máy in (tự động cập nhật trạng thái máy sang Đang sửa) |
| `/repairs/[id]` | Cập nhật tiến độ kỹ thuật viên, linh kiện thay thế và đưa máy trở lại hoạt động |
| `/fault-reports` | Tiếp nhận và duyệt các báo lỗi gửi từ người dùng quét mã QR trên máy |
| `/statistics` | Thống kê chuyên sâu từng Khoa/Phòng, Top 5 máy nạp mực nhiều nhất và biểu đồ so sánh |
| `/reports` | Trung tâm 11 mẫu báo cáo chuẩn, lọc trước khi xuất và tải file Excel/CSV/In PDF |
| `/users` | Quản lý người dùng và 4 cấp phân quyền (Super Admin, Admin, Nhân viên, Viewer) |
| `/audit-logs` | Nhật ký ghi nhận thao tác hệ thống (Audit Trail) |
| `/settings` | Cấu hình ngưỡng cảnh báo thông minh, thông tin trường và quản lý cơ sở (Campus) |
| `/p/[printerCode]` | **Trang quét mã QR công khai (Không cần đăng nhập):** hiển thị thông tin máy và form báo hỏng nhanh |

---

## 3. Hướng Dẫn Cài Đặt & Chạy Thử Nghiệm

### Bước 1: Khởi chạy ngay ở môi trường phát triển (Local)

Hệ thống đã có sẵn toàn bộ dữ liệu mẫu (6 Khoa, 8 Phòng, 16 máy in, danh mục mực, 20+ lịch sử nạp mực, sự cố sửa chữa demo).

```bash
# Cài đặt gói thư viện
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```

Truy cập: `http://localhost:3000`
Hệ thống sẽ chuyển hướng đến trang `/dashboard` hoặc `/login`.

---

## 4. Hướng Dẫn Kết Nối Firebase Thật & Triển Khai Production

### 1. Tạo Firebase Project
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và tạo project mới (ví dụ: `school-printer-management`).
2. Chọn **Add app** -> Biểu tượng Web `</>` để lấy thông tin cấu hình `firebaseConfig`.

### 2. Kích hoạt Firebase Authentication
1. Vào mục **Build** -> **Authentication** -> Bấm **Get Started**.
2. Tab **Sign-in method**: Kích hoạt **Email/Password**.
3. Tab **Users**: Thêm tài khoản quản trị viên đầu tiên (ví dụ: `admin@truong.edu.vn`).

### 3. Kích hoạt Cloud Firestore
1. Vào **Build** -> **Firestore Database** -> Bấm **Create database**.
2. Chọn vị trí lưu trữ (ví dụ: `asia-southeast1` hoặc `asia-east1`).
3. Chọn chế độ **Production mode** (hoặc **Test mode**).
4. Áp dụng file `firestore.rules` và `firestore.indexes.json` có sẵn trong thư mục gốc dự án.

### 4. Kích hoạt Firebase Storage (Nếu cần lưu ảnh máy)
1. Vào **Build** -> **Storage** -> Bấm **Get Started**.

### 5. Cấu hình biến môi trường
Tạo file `.env.local` ở thư mục gốc:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:...
```

### 6. Nạp dữ liệu ban đầu lên Firestore (Seed Database)
Chạy lệnh:
```bash
npx ts-node seed.ts
```

---

## 5. Build Kiểm Tra & Triển Khai Lên Vercel

### Kiểm tra build sản phẩm:
```bash
npm run build
```

### Triển khai lên Vercel:
1. Đẩy mã nguồn lên kho chứa GitHub / GitLab.
2. Đăng nhập [Vercel](https://vercel.com/) và bấm **Add New Project**.
3. Chọn kho lưu trữ dự án, thêm các biến môi trường trong phần **Environment Variables** (như file `.env.local`).
4. Bấm **Deploy**.
