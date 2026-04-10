/* ===================================
   الكود الرئيسي للتطبيق
   =================================== */

// ============ متغيرات عامة ============

// السلة (مخزنة في localStorage)
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ============ دوال مساعدة ============

/**
 * عرض إشعار Toast
 * @param {string} message - نص الرسالة
 * @param {string} type - نوع الإشعار (success, error, warning)
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    // تحديد الأيقونة حسب النوع
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-circle'
    };
    
    toast.innerHTML = `
        <i class="${icons[type] || icons.success}"></i>
        <span>${message}</span>
    `;
    
    toast.className = `toast ${type} show`;
    
    // إخفاء الإشعار بعد 3 ثواني
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * تنسيق السعر
 * @param {number} price - السعر
 * @returns {string} - السعر منسق
 */
function formatPrice(price) {
    return `${parseFloat(price).toFixed(2)} ${STORE_CONFIG.currency}`;
}

/**
 * تحديث عداد السلة
 */
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('#cart-count');
    const count = cart.length;
    
    cartCountElements.forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
}

/**
 * حفظ السلة في localStorage
 */
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

/**
 * إضافة منتج للسلة
 * @param {object} product - بيانات المنتج
 */
function addToCart(product) {
    // التحقق من عدم وجود المنتج مسبقاً
    const existingIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingIndex > -1) {
        showToast('المنتج موجود في السلة بالفعل', 'warning');
        return;
    }
    
    // إضافة المنتج
    cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        downloadLink: product.downloadLink
    });
    
    saveCart();
    showToast('تمت إضافة المنتج للسلة بنجاح', 'success');
}

/**
 * حذف منتج من السلة
 * @param {string} productId - معرف المنتج
 */
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    showToast('تم حذف المنتج من السلة', 'success');
}

/**
 * إفراغ السلة
 */
function clearCart() {
    cart = [];
    saveCart();
    showToast('تم إفراغ السلة', 'success');
}

/**
 * حساب إجمالي السلة
 * @returns {object} - المجموع والضريبة والإجمالي
 */
function calculateCartTotal() {
    const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const tax = subtotal * STORE_CONFIG.taxRate;
    const total = subtotal + tax;
    
    return {
        subtotal: subtotal,
        tax: tax,
        total: total
    };
}

/**
 * إنشاء بطاقة منتج HTML
 * @param {object} product - بيانات المنتج
 * @returns {string} - HTML
 */
function createProductCard(product) {
    const categoryName = CATEGORIES.find(c => c.id === product.category)?.name || product.category;
    
    return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" 
                     onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-body">
                <span class="product-category">${categoryName}</span>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-footer">
                    <div class="product-price">
                        <span class="currency">${STORE_CONFIG.currency}</span>
                        ${parseFloat(product.price).toFixed(2)}
                    </div>
                    <button class="add-to-cart-btn" onclick="handleAddToCart('${product.id}')">
                        <i class="fas fa-cart-plus"></i>
                        أضف للسلة
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * معالجة إضافة المنتج للسلة
 * @param {string} productId - معرف المنتج
 */
async function handleAddToCart(productId) {
    try {
        // جلب بيانات المنتج من Firebase
        const doc = await db.collection('products').doc(productId).get();
        
        if (!doc.exists) {
            showToast('المنتج غير موجود', 'error');
            return;
        }
        
        const product = {
            id: doc.id,
            ...doc.data()
        };
        
        addToCart(product);
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('حدث خطأ أثناء الإضافة', 'error');
    }
}

/**
 * تحميل المنتجات المميزة في الصفحة الرئيسية
 */
async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    try {
        // جلب أول 8 منتجات نشطة
        const snapshot = await db.collection('products')
            .where('status', '==', 'active')
            .limit(8)
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>لا توجد منتجات حالياً</h3>
                    <p>سيتم إضافة منتجات قريباً</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            html += createProductCard(product);
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>خطأ في تحميل المنتجات</h3>
                <p>يرجى المحاولة مرة أخرى</p>
            </div>
        `;
    }
}

/**
 * تحميل الفئات في الفلتر
 */
function loadCategories() {
    const container = document.getElementById('categories-filter');
    if (!container) return;
    
    let html = `
        <label class="filter-option">
            <input type="radio" name="category" value="all" checked>
            <span>الكل</span>
        </label>
    `;
    
    CATEGORIES.forEach(category => {
        html += `
            <label class="filter-option">
                <input type="radio" name="category" value="${category.id}">
                <span><i class="${category.icon}"></i> ${category.name}</span>
            </label>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * التحقق من حالة تسجيل دخول الأدمن
 * @returns {Promise<boolean>}
 */
async function checkAdminAuth() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(user => {
            if (user) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

/**
 * تسجيل خروج الأدمن
 */
async function logoutAdmin() {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
}

// ============ تهيئة التطبيق ============

document.addEventListener('DOMContentLoaded', () => {
    // تحديث عداد السلة
    updateCartCount();
    
    // تحميل المنتجات المميزة (في الصفحة الرئيسية)
    if (document.getElementById('featured-products')) {
        loadFeaturedProducts();
    }
    
    // تحميل الفئات
    loadCategories();
    
    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const nav = document.querySelector('.nav');
    
    if (mobileMenuToggle && nav) {
        mobileMenuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
});

// تصدير الدوال للاستخدام العام
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.handleAddToCart = handleAddToCart;
window.showToast = showToast;
window.formatPrice = formatPrice;
