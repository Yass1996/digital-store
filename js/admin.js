/* ===================================
   لوحة تحكم الأدمن
   =================================== */

// ============ متغيرات ============

let allAdminProducts = [];
let allAdminOrders = [];
let currentEditProductId = null;

// ============ التحقق من تسجيل الدخول ============

auth.onAuthStateChanged(user => {
    if (!user) {
        // توجيه لصفحة تسجيل الدخول
        window.location.href = 'login.html';
    } else {
        // تحديث معلومات المستخدم
        const adminName = document.getElementById('admin-name');
        const adminEmail = document.getElementById('admin-email');
        
        if (adminName) adminName.textContent = user.displayName || 'المدير';
        if (adminEmail) adminEmail.textContent = user.email;
        
        // تحميل البيانات
        loadDashboardStats();
        loadAdminProducts();
        loadAdminOrders();
        loadStoreSettings();
    }
});

// ============ التنقل بين الأقسام ============

document.addEventListener('DOMContentLoaded', () => {
    // روابط التنقل
    const navLinks = document.querySelectorAll('.admin-nav-link');
    const sections = document.querySelectorAll('.admin-section');
    const pageTitle = document.getElementById('page-title');
    
    const sectionTitles = {
        'dashboard': 'لوحة المعلومات',
        'products': 'إدارة المنتجات',
        'orders': 'إدارة الطلبات',
        'settings': 'إعدادات المتجر'
    };
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetSection = link.dataset.section;
            
            // تحديث الروابط النشطة
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // تحديث الأقسام
            sections.forEach(s => s.classList.remove('active'));
            const section = document.getElementById(`section-${targetSection}`);
            if (section) section.classList.add('active');
            
            // تحديث العنوان
            if (pageTitle) pageTitle.textContent = sectionTitles[targetSection];
            
            // إغلاق sidebar في الموبايل
            const sidebar = document.getElementById('admin-sidebar');
            if (sidebar) sidebar.classList.remove('active');
        });
    });
    
    // روابط "عرض الكل"
    document.querySelectorAll('.view-all-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.dataset.section;
            const navLink = document.querySelector(`.admin-nav-link[data-section="${targetSection}"]`);
            if (navLink) navLink.click();
        });
    });
    
    // Toggle Sidebar
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const adminSidebar = document.getElementById('admin-sidebar');
    
    if (sidebarToggle && adminSidebar) {
        sidebarToggle.addEventListener('click', () => {
            adminSidebar.classList.toggle('active');
        });
    }
    
    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                logoutAdmin();
            }
        });
    }
    
    // Modal Events
    initModalEvents();
});

// ============ إحصائيات لوحة المعلومات ============

async function loadDashboardStats() {
    try {
        // إجمالي المنتجات
        const productsSnapshot = await db.collection('products').get();
        const totalProducts = productsSnapshot.size;
        document.getElementById('total-products').textContent = totalProducts;
        
        // إجمالي الطلبات
        const ordersSnapshot = await db.collection('orders').get();
        const totalOrders = ordersSnapshot.size;
        document.getElementById('total-orders').textContent = totalOrders;
        
        // الطلبات قيد المعالجة
        const pendingSnapshot = await db.collection('orders')
            .where('status', '==', 'pending')
            .get();
        document.getElementById('pending-orders').textContent = pendingSnapshot.size;
        
        // إجمالي الإيرادات
        let totalRevenue = 0;
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            if (order.status === 'completed') {
                totalRevenue += order.payment?.total || 0;
            }
        });
        document.getElementById('total-revenue').textContent = formatPrice(totalRevenue);
        
        // تحميل أحدث الطلبات
        loadRecentOrders();
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentOrders() {
    const container = document.getElementById('recent-orders');
    if (!container) return;
    
    try {
        const snapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">لا توجد طلبات حتى الآن</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const order = doc.data();
            const date = order.createdAt?.toDate?.() || new Date();
            
            html += `
                <tr>
                    <td><strong>${order.orderNumber}</strong></td>
                    <td>${order.customer?.firstName} ${order.customer?.lastName}</td>
                    <td>${order.products?.length || 0} منتج</td>
                    <td>${formatPrice(order.payment?.total || 0)}</td>
                    <td><span class="status-badge ${order.status}">${getStatusLabel(order.status)}</span></td>
                    <td>${date.toLocaleDateString('ar-SA')}</td>
                </tr>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

// ============ إدارة المنتجات ============

async function loadAdminProducts() {
    const container = document.getElementById('products-table');
    if (!container) return;
    
    try {
        const snapshot = await db.collection('products')
            .orderBy('createdAt', 'desc')
            .get();
        
        allAdminProducts = [];
        snapshot.forEach(doc => {
            allAdminProducts.push({ id: doc.id, ...doc.data() });
        });
        
        if (allAdminProducts.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">لا توجد منتجات. أضف منتجك الأول!</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        allAdminProducts.forEach(product => {
            const categoryName = CATEGORIES.find(c => c.id === product.category)?.name || product.category;
            
            html += `
                <tr data-id="${product.id}">
                    <td>
                        <img src="${product.image}" class="product-thumbnail" alt="${product.name}"
                             onerror="this.src='https://via.placeholder.com/60?text=No+Image'">
                    </td>
                    <td><strong>${product.name}</strong></td>
                    <td>${categoryName}</td>
                    <td>${formatPrice(product.price)}</td>
                    <td><span class="status-badge ${product.status}">${product.status === 'active' ? 'نشط' : 'غير نشط'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="icon-btn edit" onclick="editProduct('${product.id}')" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="icon-btn delete" onclick="deleteProduct('${product.id}')" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">خطأ في تحميل المنتجات</td>
            </tr>
        `;
    }
}

// ============ Modal المنتج ============

function initModalEvents() {
    const modal = document.getElementById('product-modal');
    const addBtn = document.getElementById('add-product-btn');
    const closeBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('product-form');
    
    // فتح Modal للإضافة
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openProductModal();
        });
    }
    
    // إغلاق Modal
    if (closeBtn) {
        closeBtn.addEventListener('click', closeProductModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeProductModal);
    }
    
    // إغلاق عند النقر خارج Modal
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeProductModal();
        });
    }
    
    // معالجة حفظ المنتج
    if (form) {
        form.addEventListener('submit', handleSaveProduct);
    }
}

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('product-form');
    
    currentEditProductId = productId;
    
    if (productId) {
        // وضع التعديل
        modalTitle.textContent = 'تعديل المنتج';
        const product = allAdminProducts.find(p => p.id === productId);
        
        if (product) {
            document.getElementById('product-id').value = productId;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-image').value = product.image;
            document.getElementById('product-download').value = product.downloadLink;
            document.getElementById('product-status').value = product.status;
        }
    } else {
        // وضع الإضافة
        modalTitle.textContent = 'إضافة منتج جديد';
        form.reset();
        document.getElementById('product-id').value = '';
    }
    
    modal.classList.add('active');
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.remove('active');
    currentEditProductId = null;
}

async function handleSaveProduct(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    
    try {
        const productData = {
            name: document.getElementById('product-name').value.trim(),
            description: document.getElementById('product-description').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            category: document.getElementById('product-category').value,
            image: document.getElementById('product-image').value.trim(),
            downloadLink: document.getElementById('product-download').value.trim(),
            status: document.getElementById('product-status').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const productId = document.getElementById('product-id').value;
        
        if (productId) {
            // تعديل
            await db.collection('products').doc(productId).update(productData);
            showToast('تم تحديث المنتج بنجاح', 'success');
        } else {
            // إضافة
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(productData);
            showToast('تم إضافة المنتج بنجاح', 'success');
        }
        
        closeProductModal();
        loadAdminProducts();
        loadDashboardStats();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('حدث خطأ أثناء حفظ المنتج', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ المنتج';
    }
}

function editProduct(productId) {
    openProductModal(productId);
}

async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }
    
    try {
        await db.collection('products').doc(productId).delete();
        showToast('تم حذف المنتج بنجاح', 'success');
        loadAdminProducts();
        loadDashboardStats();
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('حدث خطأ أثناء حذف المنتج', 'error');
    }
}

// ============ إدارة الطلبات ============

async function loadAdminOrders() {
    const container = document.getElementById('orders-table');
    if (!container) return;
    
    try {
        const snapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc')
            .get();
        
        allAdminOrders = [];
        snapshot.forEach(doc => {
            allAdminOrders.push({ id: doc.id, ...doc.data() });
        });
        
        displayOrders(allAdminOrders);
        
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">خطأ في تحميل الطلبات</td>
            </tr>
        `;
    }
}

function displayOrders(orders) {
    const container = document.getElementById('orders-table');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">لا توجد طلبات</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    orders.forEach(order => {
        const date = order.createdAt?.toDate?.() || new Date();
        
        html += `
            <tr data-id="${order.id}">
                <td><strong>${order.orderNumber}</strong></td>
                <td>${order.customer?.firstName} ${order.customer?.lastName}</td>
                <td>${order.customer?.email}</td>
                <td>${order.products?.length || 0} منتج</td>
                <td>${formatPrice(order.payment?.total || 0)}</td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus('${order.id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>قيد المعالجة</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>مكتمل</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                    </select>
                </td>
                <td>${date.toLocaleDateString('ar-SA')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="icon-btn edit" onclick="viewOrderDetails('${order.id}')" title="عرض التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="icon-btn delete" onclick="deleteOrder('${order.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = html;
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('تم تحديث حالة الطلب', 'success');
        loadDashboardStats();
    } catch (error) {
        console.error('Error updating order:', error);
        showToast('خطأ في تحديث الطلب', 'error');
    }
}

function viewOrderDetails(orderId) {
    const order = allAdminOrders.find(o => o.id === orderId);
    if (!order) return;
    
    let productsHtml = '';
    order.products?.forEach(p => {
        productsHtml += `<li>${p.name} - ${formatPrice(p.price)}</li>`;
    });
    
    alert(`
تفاصيل الطلب: ${order.orderNumber}

العميل: ${order.customer?.firstName} ${order.customer?.lastName}
البريد: ${order.customer?.email}
الهاتف: ${order.customer?.phone}
المدينة: ${order.customer?.city}

المنتجات:
${order.products?.map(p => `- ${p.name}: ${formatPrice(p.price)}`).join('\n')}

الإجمالي: ${formatPrice(order.payment?.total)}
طريقة الدفع: ${order.payment?.method}
الحالة: ${getStatusLabel(order.status)}
    `);
}

async function deleteOrder(orderId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    
    try {
        await db.collection('orders').doc(orderId).delete();
        showToast('تم حذف الطلب', 'success');
        loadAdminOrders();
        loadDashboardStats();
    } catch (error) {
        console.error('Error deleting order:', error);
        showToast('خطأ في حذف الطلب', 'error');
    }
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'قيد المعالجة',
        'completed': 'مكتمل',
        'cancelled': 'ملغي'
    };
    return labels[status] || status;
}

// فلتر الطلبات
document.getElementById('order-status-filter')?.addEventListener('change', (e) => {
    const status = e.target.value;
    if (status === 'all') {
        displayOrders(allAdminOrders);
    } else {
        displayOrders(allAdminOrders.filter(o => o.status === status));
    }
});

// ============ إعدادات المتجر ============

async function loadStoreSettings() {
    try {
        const doc = await db.collection('settings').doc('store').get();
        
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('store-name-input').value = data.name || '';
            document.getElementById('store-logo-input').value = data.logo || '';
            document.getElementById('primary-color-input').value = data.primaryColor || '#6366f1';
            document.getElementById('store-desc-input').value = data.description || '';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    
    try {
        const settingsData = {
            name: document.getElementById('store-name-input').value,
            logo: document.getElementById('store-logo-input').value,
            primaryColor: document.getElementById('primary-color-input').value,
            description: document.getElementById('store-desc-input').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('settings').doc('store').set(settingsData, { merge: true });
        showToast('تم حفظ الإعدادات بنجاح', 'success');
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('خطأ في حفظ الإعدادات', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التغييرات';
    }
});

// تصدير الدوال
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewOrderDetails = viewOrderDetails;
window.deleteOrder = deleteOrder;
window.updateOrderStatus = updateOrderStatus;
