/* ===================================
   صفحة المنتجات
   =================================== */

// ============ متغيرات ============

let allProducts = [];
let filteredProducts = [];
let currentCategory = 'all';
let currentPriceRange = 'all';
let currentSort = 'newest';
let searchQuery = '';

// ============ دوال ============

/**
 * تحميل جميع المنتجات من Firebase
 */
async function loadAllProducts() {
    const container = document.getElementById('products-grid');
    if (!container) return;
    
    try {
        // عرض حالة التحميل
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>جاري تحميل المنتجات...</p>
            </div>
        `;
        
        // جلب المنتجات النشطة فقط
        const snapshot = await db.collection('products')
            .where('status', '==', 'active')
            .get();
        
        allProducts = [];
        snapshot.forEach(doc => {
            allProducts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // تطبيق الفلترة والعرض
        applyFilters();
        
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>خطأ في تحميل المنتجات</h3>
                <p>يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى</p>
                <button class="btn btn-primary" onclick="loadAllProducts()">
                    إعادة المحاولة
                </button>
            </div>
        `;
    }
}

/**
 * تطبيق الفلترة على المنتجات
 */
function applyFilters() {
    filteredProducts = [...allProducts];
    
    // فلترة حسب الفئة
    if (currentCategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category === currentCategory);
    }
    
    // فلترة حسب السعر
    if (currentPriceRange !== 'all') {
        filteredProducts = filteredProducts.filter(p => {
            const price = parseFloat(p.price);
            switch (currentPriceRange) {
                case '0-100':
                    return price >= 0 && price < 100;
                case '100-300':
                    return price >= 100 && price < 300;
                case '300-500':
                    return price >= 300 && price < 500;
                case '500+':
                    return price >= 500;
                default:
                    return true;
            }
        });
    }
    
    // فلترة حسب البحث
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
    }
    
    // الترتيب
    sortProducts();
    
    // عرض المنتجات
    displayProducts();
}

/**
 * ترتيب المنتجات
 */
function sortProducts() {
    switch (currentSort) {
        case 'newest':
            filteredProducts.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB - dateA;
            });
            break;
        case 'oldest':
            filteredProducts.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateA - dateB;
            });
            break;
        case 'price-low':
            filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            break;
        case 'name-az':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
            break;
        case 'name-za':
            filteredProducts.sort((a, b) => b.name.localeCompare(a.name, 'ar'));
            break;
    }
}

/**
 * عرض المنتجات في الصفحة
 */
function displayProducts() {
    const container = document.getElementById('products-grid');
    const countElement = document.getElementById('products-count');
    const emptyState = document.getElementById('empty-state');
    
    if (!container) return;
    
    // تحديث العدد
    if (countElement) {
        countElement.textContent = filteredProducts.length;
    }
    
    // التحقق من وجود منتجات
    if (filteredProducts.length === 0) {
        container.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }
    
    // إخفاء حالة الفراغ
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // عرض المنتجات
    let html = '';
    filteredProducts.forEach(product => {
        html += createProductCard(product);
    });
    
    container.innerHTML = html;
}

/**
 * تهيئة أحداث الفلترة
 */
function initFilterEvents() {
    // البحث
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                searchQuery = e.target.value.trim();
                applyFilters();
            }, 300);
        });
    }
    
    // فلتر الفئات
    const categoryInputs = document.querySelectorAll('input[name="category"]');
    categoryInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            applyFilters();
        });
    });
    
    // فلتر السعر
    const priceInputs = document.querySelectorAll('input[name="price"]');
    priceInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            currentPriceRange = e.target.value;
            applyFilters();
        });
    });
    
    // الترتيب
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            applyFilters();
        });
    }
    
    // إعادة تعيين الفلترة
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentCategory = 'all';
            currentPriceRange = 'all';
            currentSort = 'newest';
            searchQuery = '';
            
            // إعادة تعيين عناصر الفورم
            if (searchInput) searchInput.value = '';
            document.querySelector('input[name="category"][value="all"]')?.click();
            document.querySelector('input[name="price"][value="all"]')?.click();
            if (sortSelect) sortSelect.value = 'newest';
            
            applyFilters();
        });
    }
    
    // مسح البحث (في حالة الفراغ)
    const clearSearchBtn = document.getElementById('clear-search');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchQuery = '';
            if (searchInput) searchInput.value = '';
            applyFilters();
        });
    }
    
    // زر فلتر الموبايل
    const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
    const filtersSidebar = document.querySelector('.filters-sidebar');
    
    if (mobileFilterToggle && filtersSidebar) {
        mobileFilterToggle.addEventListener('click', () => {
            filtersSidebar.classList.toggle('active');
        });
        
        // إغلاق الفلتر عند النقر خارجه
        document.addEventListener('click', (e) => {
            if (!filtersSidebar.contains(e.target) && !mobileFilterToggle.contains(e.target)) {
                filtersSidebar.classList.remove('active');
            }
        });
    }
}

// ============ تهيئة الصفحة ============

document.addEventListener('DOMContentLoaded', () => {
    loadAllProducts();
    initFilterEvents();
});
