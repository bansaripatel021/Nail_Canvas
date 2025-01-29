class AdminPanel {
    constructor(gistService) {
        this.gistService = gistService;
        this.adminPassword = 'bansaripatel';
        this.isAuthenticated = false;

        // Only initialize if elements exist
        this.sidebar = document.getElementById('admin-sidebar');
        if (!this.sidebar) return;

        this.loginSection = document.getElementById('login-section');
        this.bookingsSection = document.getElementById('bookings-section');
        this.bookingsList = document.getElementById('bookings-list');
        this.searchInput = document.getElementById('booking-search');
        this.toggleBtn = document.getElementById('admin-toggle');
        this.currentBookings = [];

        // Initialize with locked icon
        if (this.toggleBtn) {
            this.toggleBtn.innerHTML = '<i class="fas fa-user-lock"></i>';
        }

        this.initEventListeners();
        this.initSidebarEvents();

        // Add session check
        this.checkSession();
    }

    checkSession() {
        const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
        if (isAuthenticated === 'true') {
            this.isAuthenticated = true;
            this.loginSection.classList.add('hidden');
            this.bookingsSection.classList.remove('hidden');
            this.loadBookings();
            this.toggleBtn.innerHTML = '<i class="fas fa-user-check"></i>';
        }
    }

    initEventListeners() {
        const loginBtn = document.getElementById('admin-login');
        const logoutBtn = document.getElementById('admin-logout');
        const clearBtn = document.getElementById('clear-search');
        const passwordInput = document.getElementById('admin-password');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                const password = passwordInput.value;
                this.login(password);
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterBookings(e.target.value);
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (this.searchInput) {
                    this.searchInput.value = '';
                    this.filterBookings('');
                }
            });
        }
    }

    initSidebarEvents() {
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => {
                this.sidebar.classList.toggle('translate-x-full');
            });
        }

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (this.sidebar && 
                this.toggleBtn && 
                !this.sidebar.contains(e.target) && 
                !this.toggleBtn.contains(e.target) && 
                !this.sidebar.classList.contains('translate-x-full')) {
                this.sidebar.classList.add('translate-x-full');
            }
        });
    }

    login(password) {
        if (password === this.adminPassword) {
            this.isAuthenticated = true;
            sessionStorage.setItem('adminAuthenticated', 'true');
            this.loginSection.classList.add('hidden');
            this.bookingsSection.classList.remove('hidden');
            this.loadBookings();
            // Update toggle button to unlocked icon
            this.toggleBtn.innerHTML = '<i class="fas fa-user-check"></i>';
        } else {
            alert('Invalid password');
        }
    }

    logout() {
        this.isAuthenticated = false;
        sessionStorage.removeItem('adminAuthenticated');
        this.loginSection.classList.remove('hidden');
        this.bookingsSection.classList.add('hidden');
        document.getElementById('admin-password').value = '';
        this.sidebar.classList.add('translate-x-full');
        // Reset to locked icon
        this.toggleBtn.innerHTML = '<i class="fas fa-user-lock"></i>';
    }

    async loadBookings() {
        try {
            const data = await this.gistService.getBookings();
            this.currentBookings = data.bookings;
            this.renderBookings(this.currentBookings);
        } catch (error) {
            console.error('Error loading bookings:', error);
        }
    }

    renderBookings(bookings) {
        this.bookingsList.innerHTML = bookings.map(booking => `
            <div class="booking-item bg-pink-50 p-4 rounded-lg" data-booking-id="${booking.id}">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-medium">${booking.name}</h4>
                        <p class="text-sm text-gray-600">${booking.service}</p>
                        <p class="text-sm text-gray-600">${booking.date} at ${booking.time}</p>
                        <p class="text-sm text-gray-600">
                            ${booking.contact.type}: ${booking.contact.info}
                        </p>
                        ${booking.notes ? `
                            <p class="text-sm text-gray-500 mt-2">
                                <span class="font-medium">Notes:</span> ${booking.notes}
                            </p>
                        ` : ''}
                    </div>
                    <button onclick="adminPanel.deleteBooking('${booking.id}')" 
                            class="text-red-400 hover:text-red-500">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterBookings(query) {
        const filtered = this.currentBookings.filter(booking => 
            Object.values(booking).some(value => 
                typeof value === 'string' && 
                value.toLowerCase().includes(query.toLowerCase())
            )
        );
        this.renderBookings(filtered);
    }

    async deleteBooking(id) {
        if (!confirm('Are you sure you want to delete this booking?')) return;

        try {
            const loadingItem = document.querySelector(`[data-booking-id="${id}"]`);
            if (loadingItem) {
                loadingItem.style.opacity = '0.5';
            }

            await this.gistService.deleteBooking(id);
            await this.loadBookings();
        } catch (error) {
            console.error('Error deleting booking:', error);
            alert('Failed to delete booking. Please try again.');
            
            const loadingItem = document.querySelector(`[data-booking-id="${id}"]`);
            if (loadingItem) {
                loadingItem.style.opacity = '1';
            }
        }
    }
}

// Initialize admin panel when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a page with admin functionality
    if (document.getElementById('admin-sidebar')) {
        const gistService = new GistService();
        window.adminPanel = new AdminPanel(gistService);
    }
});
