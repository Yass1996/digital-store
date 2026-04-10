/* ===================================
   إعدادات Firebase
   ===================================
   
   🔴 مهم جداً:
   استبدل هذه البيانات بالبيانات الخاصة بك من Firebase Console
   
   كيفية الحصول عليها:
   1. اذهب إلى Firebase Console
   2. اختر مشروعك
   3. اضغط على أيقونة الترس (إعدادات المشروع)
   4. انزل لقسم "Your apps"
   5. انسخ الـ firebaseConfig
   =================================== */

<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBTl4-rcUSRKgwlcw0Kdj9d5ueSB94yt7k",
    authDomain: "digital-store-4a393.firebaseapp.com",
    projectId: "digital-store-4a393",
    storageBucket: "digital-store-4a393.firebasestorage.app",
    messagingSenderId: "1054939252778",
    appId: "1:1054939252778:web:1a98bd91c62ab60e1a1b53",
    measurementId: "G-1NFM1Y1VSR"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// تهيئة قاعدة البيانات Firestore
const db = firebase.firestore();

// تهيئة نظام المصادقة Authentication
const auth = firebase.auth();

/* ===================================
   إعدادات المتجر (يمكنك تخصيصها)
   =================================== */

const STORE_CONFIG = {
    // معلومات المتجر الأساسية
    name: "متجر المنتجات الرقمية",
    description: "أفضل منصة لبيع المنتجات الرقمية في العالم العربي",
    logo: "assets/logo.png",
    
    // الألوان
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    
    // العملة
    currency: "ر.س",
    currencyCode: "SAR",
    
    // الضريبة (15% في السعودية)
    taxRate: 0.15,
    
    // معلومات التواصل
    email: "info@digitalstore.com",
    phone: "+966 XX XXX XXXX",
    whatsapp: "+966XXXXXXXXX",
    
    // روابط السوشيال ميديا
    social: {
        facebook: "https://facebook.com/yourstore",
        twitter: "https://twitter.com/yourstore",
        instagram: "https://instagram.com/yourstore",
        youtube: "https://youtube.com/yourstore"
    },
    
    // إعدادات الأدمن
    adminEmail: "admin@yourstore.com"
};

/* ===================================
   الفئات الافتراضية
   =================================== */

const CATEGORIES = [
    { id: "courses", name: "كورسات", icon: "fas fa-graduation-cap" },
    { id: "ebooks", name: "كتب إلكترونية", icon: "fas fa-book" },
    { id: "templates", name: "قوالب", icon: "fas fa-palette" },
    { id: "software", name: "برامج", icon: "fas fa-laptop-code" },
    { id: "graphics", name: "تصاميم جرافيك", icon: "fas fa-image" },
    { id: "music", name: "موسيقى وصوتيات", icon: "fas fa-music" },
    { id: "other", name: "أخرى", icon: "fas fa-folder" }
];

// تصدير الإعدادات للاستخدام في الملفات الأخرى
console.log("✅ Firebase initialized successfully!");
