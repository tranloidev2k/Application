# Trackly — Quản lý ứng tuyển

Ứng dụng cá nhân giúp theo dõi đơn ứng tuyển, trạng thái, ghi chú, lịch phỏng vấn và việc cần làm. Không có màn hình đăng nhập; ứng dụng tự tạo một phiên Supabase anonymous trong nền.

## Thiết lập Supabase

1. Trong Supabase Dashboard, mở **Authentication → Providers → Anonymous Sign-Ins** và bật anonymous sign-ins.
2. Mở **SQL Editor**, chạy lần lượt các file trong thư mục `supabase/migrations` theo thứ tự tên file.
3. Sao chép `.env.example` thành `.env.local` và điền URL cùng publishable key của dự án. Workspace hiện tại đã có sẵn `.env.local` cho dự án được cấu hình.

RLS chỉ cho phép phiên anonymous hiện tại đọc và ghi dữ liệu của chính nó. Ứng dụng đồng thời giữ bản sao trong `localStorage`, vì vậy vẫn hoạt động nếu Supabase hoặc mạng tạm thời không khả dụng.

> Phiên anonymous gắn với dữ liệu trình duyệt. Xóa toàn bộ dữ liệu website, đăng xuất hoặc chuyển sang trình duyệt/thiết bị khác sẽ không thể truy cập lại dữ liệu của phiên cũ.

## Chạy dự án

Yêu cầu Node.js 20 trở lên.

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`.

Kiểm tra bản production:

```bash
npm run lint
npm run build
npm run preview
```
