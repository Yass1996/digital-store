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

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

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
