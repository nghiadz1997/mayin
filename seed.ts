import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import {
  DEFAULT_DEPARTMENTS,
  DEFAULT_TONER_TYPES,
  DEFAULT_SETTINGS,
} from "./src/lib/seedData";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDqrNSm3VX_yNWyJI9_1WkOSh6jQrLADrA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "lspd-9df02.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "lspd-9df02",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "lspd-9df02.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "11728695203",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:11728695203:web:44e134b91bdbecd3143416",
};

async function seedFirestore() {
  console.log("Khởi động kết nối Firebase Firestore dự án [lspd-9df02]...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("1. Đang khởi tạo 14 Khoa / Phòng mặc định (6 Khoa & 8 Phòng)...");
  for (const dept of DEFAULT_DEPARTMENTS) {
    await setDoc(doc(db, "departments", dept.id), dept);
  }

  console.log("2. Đang nạp danh mục Loại mực máy in tiêu chuẩn...");
  for (const toner of DEFAULT_TONER_TYPES) {
    await setDoc(doc(db, "tonerTypes", toner.id), toner);
  }

  console.log("3. Đang nạp Cài đặt hệ thống & Ngưỡng cảnh báo...");
  await setDoc(doc(db, "settings", "default-settings"), DEFAULT_SETTINGS);

  console.log(">>> Hoàn tất khởi tạo cơ sở dữ liệu gốc sạch cho Firebase thành công!");
  console.log(">>> Không có máy in hoặc lịch sử giả mạo. Sẵn sàng cho quản trị viên nhập liệu thực tế.");
}

seedFirestore().catch((err) => {
  console.error("Lỗi khi seed:", err);
});
