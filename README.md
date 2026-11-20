# DearHome – Frontend

Giao diện web của **DearHome**, nền tảng thương mại điện tử nội thất cho phép khách hàng xem sản phẩm dưới dạng mô hình 3D, đặt thử đồ nội thất vào phòng thật bằng AR (WebXR) và trò chuyện với trợ lý AI. Ứng dụng gồm hai phần: **trang khách hàng** (mua sắm) và **trang quản trị** (quản lý cửa hàng).

> Hệ thống DearHome gồm 3 repo:
>
> | Repo | Vai trò |
> |------|---------|
> | **DearHome-Frontend** (repo này) | Web app React cho khách hàng và quản trị viên |
> | [DearHome_Backend](https://github.com/vumhvo/DearHome_Backend) | REST API chính (ASP.NET Core, SQL Server) |
> | [DearHome-AI_Backend](https://github.com/vumhvo/DearHome-AI_Backend) | Chatbot AI, sinh mô hình 3D, gợi ý bố trí phòng (FastAPI) |

## Tính năng

**Khách hàng**
- Đăng ký / đăng nhập bằng email hoặc tài khoản Google
- Duyệt sản phẩm theo danh mục, xem chi tiết và các biến thể (màu sắc, chất liệu…)
- Xem mô hình 3D của biến thể sản phẩm (Three.js / React Three Fiber)
- **Đặt sản phẩm vào phòng thật bằng AR** (WebXR hit-test): kéo thả, xoay mô hình
- Giỏ hàng, tính phí vận chuyển, áp dụng khuyến mãi
- Thanh toán trực tuyến qua **PayOS**
- Theo dõi đơn hàng và viết đánh giá sau khi nhận hàng
- **Chatbot AI** qua WebSocket: tư vấn sản phẩm, giá, khuyến mãi, trạng thái đơn hàng

**Quản trị viên**
- Dashboard thống kê doanh thu, số đơn, sản phẩm bán chạy, tỷ lệ trạng thái đơn, tồn kho theo danh mục
- Quản lý sản phẩm, biến thể, thuộc tính, danh mục và vị trí đặt (placement)
- **Sinh mô hình 3D từ ảnh** cho biến thể sản phẩm (gọi AI Backend)
- Quản lý kho bằng phiếu nhập hàng (Good Received Note)
- Quản lý đơn hàng, in hoá đơn
- Quản lý khách hàng và chương trình khuyến mãi

## Công nghệ

| Nhóm | Thư viện |
|------|----------|
| Nền tảng | React 19, Vite 6 (SWC), React Router 7 (`HashRouter`) |
| Giao diện | Ant Design 5, Chart.js (`react-chartjs-2`) |
| State | Redux Toolkit, React Redux |
| 3D / AR | Three.js, `@react-three/fiber`, `@react-three/drei`, `@react-three/xr` |
| Gọi API | Axios, WebSocket |
| Dịch vụ ngoài | Firebase Storage (ảnh, mô hình `.glb`), Google OAuth, PayOS Checkout |

## Cấu trúc thư mục

```
src/
├── api/                # Axios instance, danh sách request, WebSocket chatbot
│   ├── ApiInstance.jsx              # Gọi DearHome_Backend (tự gắn JWT)
│   ├── ShapeGenerateApiInstance.jsx # Gọi AI Backend (sinh 3D, bố trí phòng)
│   ├── ChatbotWsInstance.jsx        # WebSocket tới chatbot
│   └── ApiRequests.jsx              # Toàn bộ endpoint được dùng trong app
├── components/         # Component dùng chung, 3D viewer, chatbot
│   └── ar-components/  # Cảnh AR: hit-test, anchor, nạp mô hình
├── constants/          # Hằng số, định nghĩa URL các trang (urls.jsx)
├── firebase/           # Cấu hình Firebase SDK
├── hooks/              # Custom hooks (quản lý đơn hàng…)
├── layouts/            # Layout khách hàng và quản trị
├── pages/
│   ├── admin/          # Dashboard, sản phẩm, kho, đơn hàng, khách hàng, khuyến mãi
│   ├── authentication/ # Đăng nhập, đăng ký
│   ├── customer/       # Trang chủ, sản phẩm, giỏ hàng, thanh toán, AR…
│   └── personalization/# Hồ sơ người dùng
├── store/              # Redux actions & reducers (auth, cart)
└── utils/              # Hàm tiện ích (đơn hàng, sản phẩm, Firebase, mô hình 3D)
```

Danh sách đầy đủ các route xem tại [`URL_MAPPING_SUMMARY.md`](URL_MAPPING_SUMMARY.md).

## Bắt đầu

### Yêu cầu

- Node.js 18 trở lên và npm
- [DearHome_Backend](https://github.com/vumhvo/DearHome_Backend) đang chạy
- (Tuỳ chọn) [DearHome-AI_Backend](https://github.com/vumhvo/DearHome-AI_Backend) đang chạy nếu cần chatbot và sinh mô hình 3D

### Cài đặt

```bash
git clone https://github.com/vumhvo/DearHome-Frontend.git
cd DearHome-Frontend
npm install
cp .env.example .env.development
```

### Biến môi trường

Vite đọc `.env.development` khi chạy `npm run dev` và `.env.production` khi `npm run build`.

| Biến | Mô tả | Ví dụ |
|------|-------|-------|
| `VITE_API_BASE_URL` | URL của DearHome_Backend (có hậu tố `/api`) | `http://localhost:5226/api` |
| `VITE_APP_BASE_URL` | URL của chính frontend, dùng làm `returnUrl` khi thanh toán | `http://localhost:5173/#` |
| `VITE_API_CHATBOT_AND_3D_GENERATION_BASE_URL` | URL REST của AI Backend | `http://localhost:8000/api` |
| `VITE_WS_CHATBOT_BASE_URL` | URL WebSocket của AI Backend (app tự nối thêm `/chat/ws`) | `ws://localhost:8000/api` |

Cấu hình Firebase nằm ở [`src/firebase/config.js`](src/firebase/config.js) và Google OAuth Client ID ở [`src/App.jsx`](src/App.jsx). Hãy thay bằng thông tin của dự án Firebase / Google Cloud của bạn nếu triển khai riêng.

### Chạy

```bash
npm run dev       # Dev server tại http://localhost:5173
npm run build     # Build production vào thư mục dist/
npm run preview   # Xem thử bản build
npm run lint      # Kiểm tra ESLint
```

> **AR/WebXR** chỉ hoạt động trên trình duyệt hỗ trợ WebXR (ví dụ Chrome trên Android có ARCore) và yêu cầu HTTPS. Khi thử trên điện thoại, hãy mở dev server qua HTTPS hoặc dùng công cụ tunnel.

## Triển khai

- **GitHub Pages**: `npm run deploy` sẽ build rồi đẩy thư mục `dist/` lên nhánh `gh-pages`. Khi build production, `base` của Vite là `/DearHome-Frontend/` (xem [`vite.config.js`](vite.config.js)); đổi giá trị này nếu tên repo hoặc đường dẫn khác.
- **Firebase**: dự án đã có `.firebaserc`, `firebase-hosting.json` (header CORS/cache cho file mô hình 3D) và `storage.rules` cho Firebase Storage.

Vì dùng `HashRouter`, URL có dạng `/#/products`, nên không cần cấu hình rewrite phía máy chủ.

## Tài liệu khác

- [`URL_MAPPING_SUMMARY.md`](URL_MAPPING_SUMMARY.md): bảng ánh xạ URL → trang
- [`ORDER_REFACTOR_README.md`](ORDER_REFACTOR_README.md): ghi chú refactor trang quản lý đơn hàng
