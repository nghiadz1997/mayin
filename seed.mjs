import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDqrNSm3VX_yNWyJI9_1WkOSh6jQrLADrA",
  authDomain: "lspd-9df02.firebaseapp.com",
  projectId: "lspd-9df02",
  storageBucket: "lspd-9df02.firebasestorage.app",
  messagingSenderId: "11728695203",
  appId: "1:11728695203:web:44e134b91bdbecd3143416",
  measurementId: "G-MYKBDLWNSH"
};

const DEPARTMENTS = [
  // 6 KHOA
  {
    id: "dept-cntt",
    code: "CNTT-KTĐ",
    name: "Khoa Công nghệ thông tin - Kỹ thuật điện",
    type: "faculty",
    note: "Tầng 3, Nhà A",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-gddc",
    code: "GDĐC",
    name: "Khoa Giáo dục đại cương",
    type: "faculty",
    note: "Tầng 2, Nhà B",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-ck",
    code: "CK",
    name: "Khoa Cơ khí",
    type: "faculty",
    note: "Xưởng thực hành X1",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-yd",
    code: "YD",
    name: "Khoa Y Dược",
    type: "faculty",
    note: "Tầng 4, Nhà C",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-cssd",
    code: "CSSĐ",
    name: "Khoa Chăm sóc sắc đẹp - Nuôi dưỡng trẻ",
    type: "faculty",
    note: "Tầng 2, Nhà D",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-ktdl",
    code: "KTDL",
    name: "Khoa Kinh tế - Du lịch",
    type: "faculty",
    note: "Tầng 3, Nhà B",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },

  // 8 PHÒNG
  {
    id: "dept-qttb",
    code: "QTTB",
    name: "Phòng QTTB&CSVC",
    type: "office",
    note: "Tầng 1, Nhà Điều Hành",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-khcn",
    code: "KHCN",
    name: "Phòng KHCN&HT",
    type: "office",
    note: "Tầng 2, Nhà Điều Hành",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-hssv",
    code: "HSSV",
    name: "Phòng HSSV",
    type: "office",
    note: "Tầng 1, Nhà C",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-kt",
    code: "KT-ĐBCL",
    name: "Phòng KT-ĐBCL",
    type: "office",
    note: "Tầng 3, Nhà Điều Hành",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-tchc",
    code: "TCHC",
    name: "Phòng TCHC",
    type: "office",
    note: "Tầng 1, Nhà Điều Hành",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-khtc",
    code: "KHTC",
    name: "Phòng KHTC",
    type: "office",
    note: "Tầng 1, Nhà Điều Hành",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-qldt",
    code: "QLĐT",
    name: "Phòng QLĐT",
    type: "office",
    note: "Tầng 2, Nhà Điều Hành",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "dept-ts",
    code: "TS",
    name: "Phòng Tuyển Sinh",
    type: "office",
    note: "Sảnh Tầng 1, Nhà A",
    status: "active",
    campusId: "campus-1",
    createdAt: new Date().toISOString(),
  },
];

const TONER_TYPES = [
  {
    id: "toner-tn2385",
    code: "TN-2385",
    name: "Hộp mực Brother TN-2385",
    brand: "Brother",
    tonerType: "Hộp mực Laser đen trắng",
    color: "Black",
    compatibleModels: ["HL-L2321D", "HL-L2366DW", "DCP-L2520D", "MFC-L2701D"],
    note: "Mực tiêu chuẩn ~2,600 trang",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "toner-12a",
    code: "12A",
    name: "Hộp mực HP 12A (Q2612A)",
    brand: "HP",
    tonerType: "Hộp mực Laser đen trắng",
    color: "Black",
    compatibleModels: ["LaserJet 1020", "LaserJet 1010", "LaserJet 3050", "Canon LBP 2900", "Canon LBP 3000"],
    note: "Dùng chung máy Canon 2900/3000 rất phổ biến",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "toner-107a",
    code: "107A",
    name: "Hộp mực HP 107A (W1107A)",
    brand: "HP",
    tonerType: "Hộp mực Laser đen trắng",
    color: "Black",
    compatibleModels: ["Laser 107a", "Laser 107w", "MFP 135a", "MFP 135w", "MFP 137fnw"],
    note: "Dòng máy in mini để bàn",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "toner-85a",
    code: "85A",
    name: "Hộp mực HP 85A (CE285A)",
    brand: "HP",
    tonerType: "Hộp mực Laser đen trắng",
    color: "Black",
    compatibleModels: ["LaserJet Pro P1102", "P1102w", "M1212nf", "Canon LBP 6000", "Canon 6030"],
    note: "Dòng HP & Canon thế hệ 2",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "toner-canon325",
    code: "Canon 325",
    name: "Hộp mực Canon Cartridge 325",
    brand: "Canon",
    tonerType: "Hộp mực Laser đen trắng",
    color: "Black",
    compatibleModels: ["Canon LBP 6000", "Canon LBP 6030", "Canon LBP 6030w"],
    note: "Tương thích tốt dòng Canon 6030",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "toner-05a",
    code: "05A",
    name: "Hộp mực HP 05A (CE505A)",
    brand: "HP",
    tonerType: "Hộp mực Laser đen trắng công suất cao",
    color: "Black",
    compatibleModels: ["LaserJet P2035", "LaserJet P2055d", "P2055dn"],
    note: "Máy in tốc độ cao văn phòng",
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

const SETTINGS = {
  schoolName: "Trường Đại học Công nghệ & Đào tạo",
  academicYear: "2025 - 2026",
  alertHighRefillThreshold: 3,
  alertLongRepairDays: 7,
  alertNoCheckDays: 90,
  campuses: [
    { id: "campus-1", name: "Cơ sở chính (Khu A)" },
    { id: "campus-2", name: "Cơ sở thực hành (Khu B)" },
  ],
};

async function runSeed() {
  console.log("Khởi động kết nối Firebase Firestore dự án [lspd-9df02]...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("1. Khởi tạo 14 Khoa / Phòng mặc định...");
  for (const dept of DEPARTMENTS) {
    await setDoc(doc(db, "departments", dept.id), dept);
  }

  console.log("2. Khởi tạo Danh mục Hộp mực tiêu chuẩn...");
  for (const toner of TONER_TYPES) {
    await setDoc(doc(db, "tonerTypes", toner.id), toner);
  }

  console.log("3. Khởi tạo Cài đặt & Ngưỡng hệ thống...");
  await setDoc(doc(db, "settings", "default-settings"), SETTINGS);

  console.log(">>> Hoàn tất khởi tạo Firestore sạch 100%!");
  console.log(">>> Danh sách máy in và lịch sử nạp mực: 0 bản ghi (sẵn sàng nhập thật).");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("Lỗi khi kết nối Firestore:", err.message || err);
  process.exit(1);
});
