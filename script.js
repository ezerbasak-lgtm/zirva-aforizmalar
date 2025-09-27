// Global variables
let diaryEntries = [];
let bookEntries = [];
let subscribers = [];
let comments = []; // New: comments array
let currentTab = 'diary';
let selectedImage = null;
let profilePhoto = null;

// EmailJS configuration
const EMAILJS_CONFIG = {
    serviceId: 'service_llq6e6q', // Test service ID
    templateId: 'template_v86tgir', // Test template ID
    publicKey: '6yS3I1T10NbjrfVBU' // Test public key
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initializeEventListeners();
    displayEntries();
    setCurrentDate();
});

// Load data from JSON file
async function loadData() {
    console.log('Loading data from JSON...');
    showDebugInfo('🔄 JSON dosyası yükleniyor...');
    
    try {
        const response = await fetch('./data.json');
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        showDebugInfo(`📡 Response: ${response.status} ${response.ok ? '✅' : '❌'}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('JSON data loaded:', data);
            
            diaryEntries = data.diaryEntries || [];
            bookEntries = data.bookEntries || [];
            subscribers = data.subscribers || [];
            comments = data.comments || [];
            profilePhoto = data.profilePhoto || null;
            
            console.log('Diary entries loaded:', diaryEntries.length);
            console.log('Book entries loaded:', bookEntries.length);
            
            showDebugInfo(`📝 Mektuplar: ${diaryEntries.length}, 📚 Kitaplar: ${bookEntries.length}, 👥 Aboneler: ${subscribers.length}`);
            
            if (profilePhoto) {
                showProfilePhoto(profilePhoto);
            } else {
                showDefaultProfilePhoto();
            }
        } else {
            console.log('JSON file not found, using localStorage fallback');
            showDebugInfo('❌ JSON bulunamadı, localStorage kullanılıyor');
            loadDataFromLocalStorage();
        }
    } catch (error) {
        console.log('Error loading JSON, using localStorage fallback:', error);
        showDebugInfo(`❌ Hata: ${error.message}`);
        loadDataFromLocalStorage();
    }
}

// Show debug information on page
function showDebugInfo(message) {
    // Create debug panel if it doesn't exist
    let debugPanel = document.getElementById('debug-panel');
    if (!debugPanel) {
        debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 9999;
            max-width: 300px;
            word-wrap: break-word;
        `;
        document.body.appendChild(debugPanel);
    }
    
    // Add message with timestamp
    const timestamp = new Date().toLocaleTimeString();
    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = `[${timestamp}] ${message}`;
    debugPanel.appendChild(messageDiv);
    
    // Keep only last 5 messages
    const messages = debugPanel.children;
    if (messages.length > 5) {
        debugPanel.removeChild(messages[0]);
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// Fallback: Load data from localStorage
function loadDataFromLocalStorage() {
    showDebugInfo('💾 localStorage\'dan veri yükleniyor...');
    
    const savedDiaryEntries = localStorage.getItem('diaryEntries');
    const savedBookEntries = localStorage.getItem('bookEntries');
    const savedSubscribers = localStorage.getItem('subscribers');
    const savedProfilePhoto = localStorage.getItem('profilePhoto');
    const savedComments = localStorage.getItem('comments');
    
    if (savedDiaryEntries) {
        diaryEntries = JSON.parse(savedDiaryEntries);
    }
    
    if (savedBookEntries) {
        bookEntries = JSON.parse(savedBookEntries);
    }
    
    if (savedSubscribers) {
        subscribers = JSON.parse(savedSubscribers);
    }
    
    if (savedComments) {
        comments = JSON.parse(savedComments);
    }
    
    if (savedProfilePhoto) {
        profilePhoto = savedProfilePhoto;
        showProfilePhoto(profilePhoto);
    } else {
        showDefaultProfilePhoto();
    }
    
    showDebugInfo(`💾 localStorage: Mektuplar: ${diaryEntries.length}, Kitaplar: ${bookEntries.length}, Aboneler: ${subscribers.length}`);
}

// Save data to localStorage (fallback)
function saveData() {
    localStorage.setItem('diaryEntries', JSON.stringify(diaryEntries));
    localStorage.setItem('bookEntries', JSON.stringify(bookEntries));
    localStorage.setItem('subscribers', JSON.stringify(subscribers));
    localStorage.setItem('comments', JSON.stringify(comments));
    if (profilePhoto) {
        localStorage.setItem('profilePhoto', profilePhoto);
    }
}

// Save data to JSON file (for admin use)
async function saveDataToJSON() {
    const data = {
        diaryEntries: diaryEntries,
        bookEntries: bookEntries,
        subscribers: subscribers,
        comments: comments,
        profilePhoto: profilePhoto
    };
    
    // This will be handled by admin panel
    console.log('Data to save:', data);
    return data;
}

// Initialize all event listeners
function initializeEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Diary form events (only if elements exist)
    const newDiaryBtn = document.getElementById('newDiaryBtn');
    if (newDiaryBtn) {
        newDiaryBtn.addEventListener('click', showDiaryForm);
    }
    
    const cancelDiaryBtn = document.getElementById('cancelDiaryBtn');
    if (cancelDiaryBtn) {
        cancelDiaryBtn.addEventListener('click', hideDiaryForm);
    }
    
    const diaryEntryForm = document.getElementById('diaryEntryForm');
    if (diaryEntryForm) {
        diaryEntryForm.addEventListener('submit', handleDiarySubmit);
    }

    // Book form events (only if elements exist)
    const newBookBtn = document.getElementById('newBookBtn');
    if (newBookBtn) {
        newBookBtn.addEventListener('click', showBookForm);
    }
    
    const cancelBookBtn = document.getElementById('cancelBookBtn');
    if (cancelBookBtn) {
        cancelBookBtn.addEventListener('click', hideBookForm);
    }
    
    const bookRecommendationForm = document.getElementById('bookRecommendationForm');
    if (bookRecommendationForm) {
        bookRecommendationForm.addEventListener('submit', handleBookSubmit);
    }

    // Rating slider (only if elements exist)
    const ratingSlider = document.getElementById('bookRating');
    if (ratingSlider) {
        const ratingValue = document.querySelector('.rating-value');
        const stars = document.querySelectorAll('.stars i');

        ratingSlider.addEventListener('input', function() {
            const value = this.value;
            if (ratingValue) ratingValue.textContent = value;
            updateStars(stars, value);
        });
    }

    // Image upload events
    initializeImageUpload();
    
    // Profile photo events (disabled for public users)
    // initializeProfilePhoto(); // Only admin can change profile photo
    
    // Subscriber events (only if elements exist)
    const newSubscriberBtn = document.getElementById('newSubscriberBtn');
    if (newSubscriberBtn) {
        newSubscriberBtn.addEventListener('click', showSubscriberForm);
    }
    
    const cancelSubscriberBtn = document.getElementById('cancelSubscriberBtn');
    if (cancelSubscriberBtn) {
        cancelSubscriberBtn.addEventListener('click', hideSubscriberForm);
    }
    
    const subscriberEntryForm = document.getElementById('subscriberEntryForm');
    if (subscriberEntryForm) {
        subscriberEntryForm.addEventListener('submit', handleSubscriberSubmit);
    }
    
    // Public subscribe form (only if element exists)
    const publicSubscribeForm = document.getElementById('publicSubscribeForm');
    if (publicSubscribeForm) {
        publicSubscribeForm.addEventListener('submit', handlePublicSubscribe);
    }
}

// Tab switching functionality
function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    currentTab = tabName;
    hideAllForms();
}

// Form visibility functions
function showDiaryForm() {
    hideAllForms();
    document.getElementById('diaryForm').style.display = 'block';
    document.getElementById('diaryTitle').focus();
}

function hideDiaryForm() {
    document.getElementById('diaryForm').style.display = 'none';
    document.getElementById('diaryEntryForm').reset();
    setCurrentDate();
}

function showBookForm() {
    hideAllForms();
    document.getElementById('bookForm').style.display = 'block';
    document.getElementById('bookTitle').focus();
}

function hideBookForm() {
    document.getElementById('bookForm').style.display = 'none';
    document.getElementById('bookRecommendationForm').reset();
    updateStars(document.querySelectorAll('.stars i'), 5);
    document.querySelector('.rating-value').textContent = '5';
    document.getElementById('bookRating').value = 5;
    clearImagePreview();
}

function hideAllForms() {
    document.getElementById('diaryForm').style.display = 'none';
    document.getElementById('bookForm').style.display = 'none';
    document.getElementById('subscriberForm').style.display = 'none';
}

// Set current date
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('diaryDate').value = today;
}

// Handle diary form submission
function handleDiarySubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('diaryTitle').value.trim();
    const date = document.getElementById('diaryDate').value;
    const content = document.getElementById('diaryContent').value.trim();
    
    if (!title || !date || !content) {
        alert('Lütfen tüm alanları doldurun.');
        return;
    }
    
    const entry = {
        id: Date.now(),
        title: title,
        date: date,
        content: content,
        createdAt: new Date().toISOString()
    };
    
    diaryEntries.unshift(entry); // Add to beginning
    saveData();
    displayEntries();
    hideDiaryForm();
    
    showNotification('Mektubunuz başarıyla kaydedildi!', 'success');
    
    // Send notification to subscribers
    sendNotificationToSubscribers('Yeni Mektup', title, 'Yeni bir mektup yayınlandı!');
}

// Handle book form submission
function handleBookSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const genre = document.getElementById('bookGenre').value;
    const rating = document.getElementById('bookRating').value;
    const review = document.getElementById('bookReview').value.trim();
    const amazonLink = document.getElementById('bookAmazonLink').value.trim();
    
    if (!title || !author || !genre || !review) {
        alert('Lütfen tüm zorunlu alanları doldurun.');
        return;
    }
    
    const entry = {
        id: Date.now(),
        title: title,
        author: author,
        genre: genre,
        rating: parseInt(rating),
        review: review,
        amazonLink: amazonLink,
        image: selectedImage,
        createdAt: new Date().toISOString()
    };
    
    bookEntries.unshift(entry); // Add to beginning
    saveData();
    displayEntries();
    hideBookForm();
    
    showNotification('Kitap başarıyla kaydedildi!', 'success');
    
    // Send notification to subscribers
    sendNotificationToSubscribers('Yeni Kitap', title, `"${title}" kitabı eklendi!`);
}

// Display entries
function displayEntries() {
    displayDiaryEntries();
    displayBookEntries();
}

// Display diary entries
function displayDiaryEntries() {
    const container = document.getElementById('diaryEntries');
    
    if (diaryEntries.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-scroll"></i>
                <h3>Henüz mektubunuz yok</h3>
                <p>İlk mektubunuzu yazmak için "Yeni Mektup" butonuna tıklayın.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = diaryEntries.map(entry => {
        const entryComments = getCommentsForEntry(entry.id, 'diary');
        return `
        <div class="entry-card" data-id="${entry.id}">
            <div class="entry-header">
                <div>
                    <div class="entry-title">${escapeHtml(entry.title)}</div>
                    <div class="entry-date">${formatDate(entry.date)}</div>
                </div>
                <!-- Delete button removed for public users -->
            </div>
            <div class="entry-content">${escapeHtml(entry.content).replace(/\n/g, '<br>')}</div>
            
            <!-- Comments Section -->
            <div class="comments-section">
                <div class="comments-header">
                    <h4><i class="fas fa-comments"></i> Yorumlar (${entryComments.length})</h4>
                </div>
                
                <!-- Add Comment Form -->
                <div class="add-comment-form">
                    <div class="form-group">
                        <input type="text" id="commentAuthor_${entry.id}" placeholder="Adınız (isteğe bağlı)" class="comment-author-input">
                        <textarea id="commentText_${entry.id}" placeholder="Yorumunuzu yazın..." class="comment-text-input" required></textarea>
                        <button class="btn btn-primary btn-sm" onclick="submitComment(${entry.id}, 'diary')">
                            <i class="fas fa-paper-plane"></i> Yorum Yap
                        </button>
                    </div>
                </div>
                
                <!-- Comments List -->
                <div class="comments-list">
                    ${entryComments.map(comment => `
                        <div class="comment-item">
                            <div class="comment-header">
                                <strong>${escapeHtml(comment.author)}</strong>
                                <span class="comment-date">${formatDate(comment.date)}</span>
                            </div>
                            <div class="comment-content">${escapeHtml(comment.text).replace(/\n/g, '<br>')}</div>
                            
                            <!-- Replies -->
                            ${comment.replies.length > 0 ? `
                                <div class="replies-section">
                                    ${comment.replies.map(reply => `
                                        <div class="reply-item">
                                            <div class="reply-header">
                                                <strong>${escapeHtml(reply.author)}</strong>
                                                <span class="reply-date">${formatDate(reply.date)}</span>
                                            </div>
                                            <div class="reply-content">${escapeHtml(reply.text).replace(/\n/g, '<br>')}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            <!-- Add Reply Form -->
                            <div class="add-reply-form">
                                <input type="text" id="replyAuthor_${comment.id}" placeholder="Adınız (isteğe bağlı)" class="reply-author-input">
                                <textarea id="replyText_${comment.id}" placeholder="Cevabınızı yazın..." class="reply-text-input" required></textarea>
                                <button class="btn btn-secondary btn-sm" onclick="submitReply(${comment.id})">
                                    <i class="fas fa-reply"></i> Cevapla
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Display book entries
function displayBookEntries() {
    const container = document.getElementById('bookEntries');
    
    if (bookEntries.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>Henüz kitap yok</h3>
                <p>İlk kitabınızı eklemek için "Yeni Kitap Ekle" butonuna tıklayın.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = bookEntries.map(entry => {
        const hasImage = entry.image;
        const hasAmazonLink = entry.amazonLink;
        
        return `
            <div class="entry-card book-entry ${hasImage ? 'book-entry-with-image' : ''}" data-id="${entry.id}">
                ${hasImage ? `
                    <div class="book-entry-image">
                        <img src="${entry.image}" alt="${escapeHtml(entry.title)}" loading="lazy">
                    </div>
                ` : ''}
                <div class="book-entry-content">
                    <div class="entry-header">
                        <div>
                            <div class="book-title">${escapeHtml(entry.title)}</div>
                            <div class="book-author">${escapeHtml(entry.author)}</div>
                        </div>
                        <!-- Delete button removed for public users -->
                    </div>
                    <div class="book-meta">
                        <span class="book-genre">${escapeHtml(entry.genre)}</span>
                        <div class="book-rating">
                            <span>Puanım:</span>
                            <div class="stars">
                                ${generateStars(entry.rating)}
                            </div>
                        </div>
                    </div>
                    <div class="book-review">${escapeHtml(entry.review).replace(/\n/g, '<br>')}</div>
                    ${hasAmazonLink ? `
                        <a href="${entry.amazonLink}" target="_blank" rel="noopener noreferrer" class="amazon-link-btn">
                            <i class="fab fa-amazon"></i> Amazon'da Görüntüle
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Delete diary entry
function deleteDiaryEntry(id) {
    if (confirm('Bu mektubu silmek istediğinizden emin misiniz?')) {
        diaryEntries = diaryEntries.filter(entry => entry.id !== id);
        saveData();
        displayEntries();
        showNotification('Mektup silindi.', 'info');
    }
}

// Delete book entry
function deleteBookEntry(id) {
    if (confirm('Bu kitabı silmek istediğinizden emin misiniz?')) {
        bookEntries = bookEntries.filter(entry => entry.id !== id);
        saveData();
        displayEntries();
        showNotification('Kitap silindi.', 'info');
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star active"></i>';
        } else {
            stars += '<i class="fas fa-star"></i>';
        }
    }
    return stars;
}

function updateStars(stars, rating) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        success: '#48bb78',
        error: '#f56565',
        warning: '#ed8936',
        info: '#4299e1'
    };
    return colors[type] || '#4299e1';
}

// Export data functionality
function exportData() {
    const data = {
        diaryEntries: diaryEntries,
        bookEntries: bookEntries,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `okuma-kulubu-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Verileriniz başarıyla dışa aktarıldı!', 'success');
}

// Import data functionality
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.diaryEntries && data.bookEntries) {
                if (confirm('Mevcut verileriniz silinecek. Devam etmek istiyor musunuz?')) {
                    diaryEntries = data.diaryEntries;
                    bookEntries = data.bookEntries;
                    saveData();
                    displayEntries();
                    showNotification('Verileriniz başarıyla içe aktarıldı!', 'success');
                }
            } else {
                showNotification('Geçersiz dosya formatı!', 'error');
            }
        } catch (error) {
            showNotification('Dosya okunamadı!', 'error');
        }
    };
    reader.readAsText(file);
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N for new entry
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (currentTab === 'diary') {
            showDiaryForm();
        } else {
            showBookForm();
        }
    }
    
    // Escape to close forms
    if (e.key === 'Escape') {
        hideAllForms();
    }
});

// Add search functionality
function searchEntries(query) {
    const searchTerm = query.toLowerCase();
    
    // Filter diary entries
    const filteredDiary = diaryEntries.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm) ||
        entry.content.toLowerCase().includes(searchTerm)
    );
    
    // Filter book entries
    const filteredBooks = bookEntries.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm) ||
        entry.author.toLowerCase().includes(searchTerm) ||
        entry.genre.toLowerCase().includes(searchTerm) ||
        entry.review.toLowerCase().includes(searchTerm)
    );
    
    return { diary: filteredDiary, books: filteredBooks };
}

// Auto-save functionality (save every 30 seconds if there are changes)
let hasUnsavedChanges = false;
setInterval(() => {
    if (hasUnsavedChanges) {
        saveData();
        hasUnsavedChanges = false;
    }
}, 30000);

// Mark as changed when forms are modified
document.addEventListener('input', function(e) {
    if (e.target.closest('#diaryForm, #bookForm')) {
        hasUnsavedChanges = true;
    }
});

// Image upload functionality
function initializeImageUpload() {
    const imageInput = document.getElementById('bookImage');
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImageBtn = document.getElementById('removeImageBtn');

    // Click to upload
    imageUploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // File input change
    imageInput.addEventListener('change', handleImageSelect);

    // Drag and drop
    imageUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUploadArea.classList.add('dragover');
    });

    imageUploadArea.addEventListener('dragleave', () => {
        imageUploadArea.classList.remove('dragover');
    });

    imageUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageFile(files[0]);
        }
    });

    // Remove image
    removeImageBtn.addEventListener('click', clearImagePreview);
}

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
}

function handleImageFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Lütfen sadece resim dosyası seçin.', 'error');
        return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Dosya boyutu 5MB\'dan küçük olmalıdır.', 'error');
        return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedImage = e.target.result;
        showImagePreview(selectedImage);
    };
    reader.readAsDataURL(file);
}

function showImagePreview(imageSrc) {
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    previewImg.src = imageSrc;
    imageUploadArea.style.display = 'none';
    imagePreview.style.display = 'block';
}

function clearImagePreview() {
    const imageInput = document.getElementById('bookImage');
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    selectedImage = null;
    imageInput.value = '';
    previewImg.src = '';
    imageUploadArea.style.display = 'block';
    imagePreview.style.display = 'none';
}

// Profile photo functionality
function initializeProfilePhoto() {
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    const profilePhotoBtn = document.getElementById('profilePhotoBtn');
    const profilePhotoPlaceholder = document.getElementById('profilePhotoPlaceholder');

    // Click to upload
    profilePhotoBtn.addEventListener('click', () => {
        profilePhotoInput.click();
    });

    profilePhotoPlaceholder.addEventListener('click', () => {
        profilePhotoInput.click();
    });

    // File input change
    profilePhotoInput.addEventListener('change', handleProfilePhotoSelect);
}

function handleProfilePhotoSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleProfilePhotoFile(file);
    }
}

function handleProfilePhotoFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Lütfen sadece resim dosyası seçin.', 'error');
        return;
    }

    // Validate file size (2MB max for profile photo)
    if (file.size > 2 * 1024 * 1024) {
        showNotification('Profil fotoğrafı 2MB\'dan küçük olmalıdır.', 'error');
        return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = function(e) {
        profilePhoto = e.target.result;
        showProfilePhoto(profilePhoto);
        saveData();
        showNotification('Profil fotoğrafınız güncellendi!', 'success');
    };
    reader.readAsDataURL(file);
}

function showProfilePhoto(imageSrc) {
    const profilePhotoImg = document.getElementById('profilePhoto');
    const profilePhotoPlaceholder = document.getElementById('profilePhotoPlaceholder');

    profilePhotoImg.src = imageSrc;
    profilePhotoImg.style.display = 'block';
    profilePhotoPlaceholder.style.display = 'none';
}

function showDefaultProfilePhoto() {
    const profilePhotoImg = document.getElementById('profilePhoto');
    const profilePhotoPlaceholder = document.getElementById('profilePhotoPlaceholder');

    // Use local JPG file
    profilePhotoImg.src = 'default-profile.jpg';
    profilePhotoImg.style.display = 'block';
    profilePhotoPlaceholder.style.display = 'none';
}

// Comment system functions
function addComment(entryId, entryType, commentText, authorName = 'Anonim') {
    const comment = {
        id: Date.now(),
        entryId: entryId,
        entryType: entryType, // 'diary' or 'book'
        text: commentText,
        author: authorName,
        date: new Date().toISOString(),
        replies: []
    };
    
    comments.push(comment);
    saveData();
    displayEntries();
    
    showNotification('Yorumunuz eklendi!', 'success');
}

function addReply(commentId, replyText, authorName = 'Anonim') {
    const reply = {
        id: Date.now(),
        text: replyText,
        author: authorName,
        date: new Date().toISOString()
    };
    
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
        comment.replies.push(reply);
        saveData();
        displayEntries();
        showNotification('Cevabınız eklendi!', 'success');
    }
}

function getCommentsForEntry(entryId, entryType) {
    return comments.filter(c => c.entryId === entryId && c.entryType === entryType);
}

function submitComment(entryId, entryType) {
    const authorInput = document.getElementById(`commentAuthor_${entryId}`);
    const textInput = document.getElementById(`commentText_${entryId}`);
    
    const author = authorInput.value.trim() || 'Anonim';
    const text = textInput.value.trim();
    
    if (!text) {
        showNotification('Lütfen yorumunuzu yazın.', 'warning');
        return;
    }
    
    addComment(entryId, entryType, text, author);
    
    // Clear form
    authorInput.value = '';
    textInput.value = '';
}

function submitReply(commentId) {
    const authorInput = document.getElementById(`replyAuthor_${commentId}`);
    const textInput = document.getElementById(`replyText_${commentId}`);
    
    const author = authorInput.value.trim() || 'Anonim';
    const text = textInput.value.trim();
    
    if (!text) {
        showNotification('Lütfen cevabınızı yazın.', 'warning');
        return;
    }
    
    addReply(commentId, text, author);
    
    // Clear form
    authorInput.value = '';
    textInput.value = '';
}

function clearProfilePhoto() {
    const profilePhotoImg = document.getElementById('profilePhoto');
    const profilePhotoPlaceholder = document.getElementById('profilePhotoPlaceholder');
    const profilePhotoInput = document.getElementById('profilePhotoInput');

    profilePhoto = null;
    profilePhotoInput.value = '';
    profilePhotoImg.src = '';
    profilePhotoImg.style.display = 'none';
    profilePhotoPlaceholder.style.display = 'flex';
    
    localStorage.removeItem('profilePhoto');
    showNotification('Profil fotoğrafı kaldırıldı.', 'info');
}

// Subscriber management functions
function showSubscriberForm() {
    hideAllForms();
    document.getElementById('subscriberForm').style.display = 'block';
    document.getElementById('subscriberNickname').focus();
}

function hideSubscriberForm() {
    document.getElementById('subscriberForm').style.display = 'none';
    document.getElementById('subscriberEntryForm').reset();
}

function handleSubscriberSubmit(e) {
    e.preventDefault();
    
    const nickname = document.getElementById('subscriberNickname').value.trim();
    const email = document.getElementById('subscriberEmail').value.trim();
    
    if (!nickname || !email) {
        alert('Lütfen tüm alanları doldurun.');
        return;
    }
    
    // Check if email already exists
    if (subscribers.some(sub => sub.email === email)) {
        alert('Bu e-posta adresi zaten kayıtlı.');
        return;
    }
    
    const subscriber = {
        id: Date.now(),
        nickname: nickname,
        email: email,
        subscribedAt: new Date().toISOString(),
        status: 'active'
    };
    
    subscribers.unshift(subscriber);
    saveData();
    displayEntries();
    hideSubscriberForm();
    
    showNotification('Abone başarıyla eklendi!', 'success');
}

function displaySubscribers() {
    const container = document.getElementById('subscribersList');
    
    if (subscribers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-address-book"></i>
                <h3>Henüz abone yok</h3>
                <p>İlk abonenizi eklemek için "Yeni Abone Ekle" butonuna tıklayın.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = subscribers.map(subscriber => `
        <div class="subscriber-card" data-id="${subscriber.id}">
            <div class="subscriber-info">
                <div class="subscriber-avatar">
                    ${subscriber.nickname.charAt(0).toUpperCase()}
                </div>
                <div class="subscriber-details">
                    <h4>${escapeHtml(subscriber.nickname)}</h4>
                    <p>${escapeHtml(subscriber.email)}</p>
                    <span class="email-status ${subscriber.status}">
                        <i class="fas fa-${subscriber.status === 'active' ? 'check-circle' : 'clock'}"></i>
                        ${subscriber.status === 'active' ? 'Aktif' : 'Beklemede'}
                    </span>
                </div>
            </div>
            <div class="subscriber-actions">
                <button class="btn btn-secondary" onclick="sendTestEmail('${subscriber.email}', '${escapeHtml(subscriber.nickname)}')">
                    <i class="fas fa-paper-plane"></i> Test Mail
                </button>
                <button class="btn btn-danger" onclick="deleteSubscriber(${subscriber.id})">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </div>
        </div>
    `).join('');
}

function deleteSubscriber(id) {
    if (confirm('Bu aboneyi silmek istediğinizden emin misiniz?')) {
        subscribers = subscribers.filter(sub => sub.id !== id);
        saveData();
        displayEntries();
        showNotification('Abone silindi.', 'info');
    }
}

function sendTestEmail(email, nickname) {
    // Check if EmailJS is properly configured
    if (EMAILJS_CONFIG.serviceId === 'service_test' || 
        EMAILJS_CONFIG.templateId === 'template_test' || 
        EMAILJS_CONFIG.publicKey === 'test_public_key') {
        showNotification('EmailJS ayarları yapılmamış! Lütfen EMAILJS_KURULUM.md dosyasını okuyun.', 'error');
        return;
    }
    
    if (confirm(`${nickname} adlı aboneye test maili gönderilsin mi?`)) {
        sendEmail(email, nickname, 'Test Maili', 'Bu bir test mailidir. Mail sistemi çalışıyor!');
    }
}

// Email sending functionality
function sendNotificationToSubscribers(subject, title, message) {
    if (subscribers.length === 0) return;
    
    subscribers.forEach(subscriber => {
        if (subscriber.status === 'active') {
            sendEmail(subscriber.email, subscriber.nickname, subject, message);
        }
    });
    
    showNotification(`${subscribers.length} aboneye bildirim gönderildi.`, 'info');
}

function sendEmail(toEmail, toName, subject, message) {
    // Check if EmailJS is configured
    if (EMAILJS_CONFIG.serviceId === 'YOUR_SERVICE_ID') {
        console.log('EmailJS not configured. Email would be sent to:', toEmail);
        showNotification('Mail sistemi henüz yapılandırılmamış. Lütfen EmailJS ayarlarını yapın.', 'warning');
        return;
    }
    
    // Initialize EmailJS
    emailjs.init(EMAILJS_CONFIG.publicKey);
    
    const templateParams = {
        to_email: toEmail,
        to_name: toName,
        subject: subject,
        message: message,
        from_name: 'Zırva Aforizmalar'
    };
    
    console.log('Sending email with params:', templateParams);
    console.log('Using service:', EMAILJS_CONFIG.serviceId);
    console.log('Using template:', EMAILJS_CONFIG.templateId);
    
    emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, templateParams)
        .then(function(response) {
            console.log('Email sent successfully:', response);
            showNotification('E-posta başarıyla gönderildi!', 'success');
        }, function(error) {
            console.error('Email sending failed:', error);
            console.error('Error details:', error.text || error.message);
            
            let errorMessage = 'E-posta gönderilemedi. ';
            
            if (error.text) {
                if (error.text.includes('recipients address is empty')) {
                    errorMessage += 'Şablon ayarlarında "To Email" alanına {{to_email}} yazın.';
                } else if (error.text.includes('Invalid service ID')) {
                    errorMessage += 'Service ID yanlış. EmailJS dashboard\'da kontrol edin.';
                } else if (error.text.includes('Invalid template ID')) {
                    errorMessage += 'Template ID yanlış. EmailJS dashboard\'da kontrol edin.';
                } else if (error.text.includes('Invalid public key')) {
                    errorMessage += 'Public Key yanlış. EmailJS dashboard\'da kontrol edin.';
                } else {
                    errorMessage += 'Hata: ' + error.text;
                }
            } else {
                errorMessage += 'Lütfen ayarları kontrol edin.';
            }
            
            showNotification(errorMessage, 'error');
        });
}

// Public subscribe functionality
function handlePublicSubscribe(e) {
    e.preventDefault();
    
    const nickname = document.getElementById('publicNickname').value.trim();
    const email = document.getElementById('publicEmail').value.trim();
    
    if (!nickname || !email) {
        showNotification('Lütfen tüm alanları doldurun.', 'error');
        return;
    }
    
    // Check if email already exists
    if (subscribers.some(sub => sub.email === email)) {
        showNotification('Bu e-posta adresi zaten kayıtlı.', 'warning');
        return;
    }
    
    const subscriber = {
        id: Date.now(),
        nickname: nickname,
        email: email,
        subscribedAt: new Date().toISOString(),
        status: 'active',
        source: 'public' // Mark as public subscription
    };
    
    subscribers.unshift(subscriber);
    saveData();
    displayEntries();
    
    // Show success state
    showSubscribeSuccess();
    
    // Send welcome email
            sendEmail(email, nickname, 'Hoş Geldiniz!', 
                `Merhaba ${nickname},\n\nZırva Aforizmalar'a abone olduğunuz için teşekkürler! Yeni mektup ve kitap tavsiyeleri e-posta adresinize gönderilecek.\n\nİyi okumalar!`);
    
    showNotification('Başarıyla abone oldunuz! Hoş geldiniz!', 'success');
}

function showSubscribeSuccess() {
    const subscribeForm = document.querySelector('.subscribe-form');
    const form = document.getElementById('publicSubscribeForm');
    
    // Add success class
    subscribeForm.classList.add('success');
    
    // Change form content
    form.innerHTML = `
        <div class="subscribe-success">
            <h3><i class="fas fa-check-circle"></i> Abone Oldunuz!</h3>
            <p>Yeni içerikler e-posta adresinize gönderilecek.</p>
            <button type="button" class="btn btn-secondary" onclick="resetSubscribeForm()">
                <i class="fas fa-plus"></i> Yeni Abone Ekle
            </button>
        </div>
    `;
}

function resetSubscribeForm() {
    const subscribeForm = document.querySelector('.subscribe-form');
    const form = document.getElementById('publicSubscribeForm');
    
    // Remove success class
    subscribeForm.classList.remove('success');
    
    // Reset form content
    form.innerHTML = `
        <div class="subscribe-inputs">
            <input type="text" id="publicNickname" placeholder="Nickname'iniz" required>
            <input type="email" id="publicEmail" placeholder="E-posta adresiniz" required>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-paper-plane"></i> Abone Ol
            </button>
        </div>
        <small class="subscribe-note">Yeni mektup ve kitap tavsiyeleri e-posta adresinize gönderilir</small>
    `;
    
    // Re-attach event listener
    form.addEventListener('submit', handlePublicSubscribe);
}
