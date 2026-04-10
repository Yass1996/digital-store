/* ===================================
   صفحة إتمام الطلب
   =================================== */

// ============ دوال ============

/**
 * عرض ملخص الطلب
 */
function displayOrderSummary() {
    const container = document.getElementById('summary-items');
    
    if (!container) return;
    
    // التحقق من وجود عناصر في السلة
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    // إنشاء HTML للعناصر
    let html = '';
    cart.forEach(item => {
        html += `
            <div class="summary-item">
                <div class="summary-item-image">
                    <img src="${item.image}" alt="${item.name}"
                         onerror="this.src='https://via.placeholder.com/60?text=No+Image'">
                </div>
                <div class="summary-item-details">
                    <div class="summary-item-title">${item.name}</div>
                    <div class="summary-item-price">${formatPrice(item.price)}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // تحديث الإجماليات
    const totals = calculateCartTotal();
    
    const subtotalEl = document.getElementById('summary-subtotal');
    const taxEl = document.getElementById('summary-tax');
    const totalEl = document.getElementById('summary-total');
    
    if (subtotalEl) subtotalEl.textContent = formatPrice(totals.subtotal);
    if (taxEl) taxEl.textContent = formatPrice(totals.tax);
    if (totalEl) totalEl.textContent = formatPrice(totals.total);
}

/**
 * إنشاء رقم طلب فريد
 */
function generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
}

/**
 * معالجة إرسال الطلب
 */
async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // التحقق من صحة الفورم
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // عرض حالة التحميل
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';
    }
    if (loadingOverlay) loadingOverlay.classList.add('active');
    
    try {
        // جمع بيانات الفورم
        const formData = new FormData(form);
        const totals = calculateCartTotal();
        
        // إنشاء بيانات الطلب
        const orderData = {
            orderNumber: generateOrderNumber(),
            customer: {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                country: formData.get('country'),
                city: formData.get('city')
            },
            products: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                downloadLink: item.downloadLink
            })),
            payment: {
                method: formData.get('payment'),
                subtotal: totals.subtotal,
                tax: totals.tax,
                total: totals.total
            },
            notes: formData.get('notes') || '',
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // حفظ الطلب في Firebase
        const docRef = await db.collection('orders').add(orderData);
        
        // حفظ رقم الطلب في localStorage للصفحة التالية
        localStorage.setItem('lastOrder', JSON.stringify({
            id: docRef.id,
            orderNumber: orderData.orderNumber,
            email: orderData.customer.email,
            total: orderData.payment.total,
            products: orderData.products
        }));
        
        // إفراغ السلة
        cart = [];
        saveCart();
        
        // التوجيه لصفحة النجاح أو عرض رسالة النجاح
        showOrderSuccessModal(orderData);
        
    } catch (error) {
        console.error('Error submitting order:', error);
        showToast('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.', 'error');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-lock"></i> إتمام الطلب والدفع';
        }
    } finally {
        if (loadingOverlay) loadingOverlay.classList.remove('active');
    }
}

/**
 * عرض نافذة نجاح الطلب
 */
function showOrderSuccessModal(order) {
    // إنشاء روابط التحميل
    let downloadLinks = '';
    order.products.forEach(product => {
        downloadLinks += `
            <div class="download-item">
                <span>${product.name}</span>
                <a href="${product.downloadLink}" target="_blank" class="btn btn-primary btn-sm">
                    <i class="fas fa-download"></i> تحميل
                </a>
            </div>
        `;
    });
    
    // إنشاء محتوى النافذة
    const modalHTML = `
        <div class="success-modal" id="success-modal">
            <div class="success-modal-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>تم استلام طلبك بنجاح! 🎉</h2>
                <p>شكراً لك على الشراء</p>
                
                <div class="order-info">
                    <div class="order-info-row">
                        <span>رقم الطلب:</span>
                        <strong>${order.orderNumber}</strong>
                    </div>
                    <div class="order-info-row">
                        <span>الإجمالي:</span>
                        <strong>${formatPrice(order.payment.total)}</strong>
                    </div>
                </div>
                
                <div class="download-section">
                    <h3>روابط التحميل:</h3>
                    <div class="download-links">
                        ${downloadLinks}
                    </div>
                    <p class="download-note">
                        <i class="fas fa-info-circle"></i>
                        تم إرسال روابط التحميل أيضاً إلى بريدك الإلكتروني
                    </p>
                </div>
                
                <div class="success-actions">
                    <a href="index.html" class="btn btn-primary btn-lg">
                        <i class="fas fa-home"></i>
                        العودة للرئيسية
                    </a>
                    <a href="products.html" class="btn btn-secondary btn-lg">
                        <i class="fas fa-shopping-bag"></i>
                        متابعة التسوق
                    </a>
                </div>
            </div>
        </div>
    `;
    
    // إضافة CSS للنافذة
    const styleHTML = `
        <style>
            .success-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 1rem;
            }
            
            .success-modal-content {
                background: white;
                padding: 3rem;
                border-radius: 1.5rem;
                text-align: center;
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideUp 0.5s ease;
            }
            
            .success-icon {
                font-size: 5rem;
                color: #10b981;
                margin-bottom: 1.5rem;
                animation: bounceIn 0.6s ease;
            }
            
            @keyframes bounceIn {
                0% { transform: scale(0); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            .success-modal-content h2 {
                font-size: 1.75rem;
                margin-bottom: 0.5rem;
                color: #111827;
            }
            
            .success-modal-content > p {
                color: #6b7280;
                margin-bottom: 2rem;
            }
            
            .order-info {
                background: #f3f4f6;
                padding: 1.5rem;
                border-radius: 1rem;
                margin-bottom: 2rem;
            }
            
            .order-info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
            }
            
            .order-info-row:last-child {
                margin-bottom: 0;
            }
            
            .download-section {
                text-align: right;
                margin-bottom: 2rem;
            }
            
            .download-section h3 {
                margin-bottom: 1rem;
            }
            
            .download-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                background: #f9fafb;
                border-radius: 0.5rem;
                margin-bottom: 0.5rem;
            }
            
            .download-note {
                font-size: 0.875rem;
                color: #6b7280;
                margin-top: 1rem;
            }
            
            .success-actions {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                justify-content: center;
            }
        </style>
    `;
    
    // إضافة النافذة للصفحة
    document.body.insertAdjacentHTML('beforeend', styleHTML + modalHTML);
}

// ============ تهيئة الصفحة ============

document.addEventListener('DOMContentLoaded', () => {
    // عرض ملخص الطلب
    displayOrderSummary();
    
    // معالجة إرسال الفورم
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
});
