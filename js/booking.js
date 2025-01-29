class BookingCalendar {
    constructor() {
        this.calendar = document.getElementById('calendar');
        this.timeSlots = document.getElementById('time-slots');
        this.selectedDate = null;
        this.selectedTime = null;
        this.currentMonth = new Date();
        
        this.schedule = {
            // Monday through Thursday
            '1,2,3,4': {
                start: '17:00', // 5 PM
                end: '20:00',   // 8 PM
                duration: 60     // 1 hour slots
            },
            // Friday, Saturday and Sunday
            '5,6,0': {
                start: '13:00', // 1 PM
                end: '18:00',   // 6 PM
                duration: 60     // 1 hour slots
            }
        };
        
        this.initCalendar();
        this.addMonthNavigation();
        this.gistService = new GistService();
    }

    addMonthNavigation() {
        const header = this.calendar.parentNode.querySelector('.calendar-header');
        if (!header) return;

        // Set initial month/year text
        header.querySelector('h3').textContent = this.getMonthYear();

        header.querySelector('.prev-month').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
            header.querySelector('h3').textContent = this.getMonthYear();
            this.initCalendar();
        });

        header.querySelector('.next-month').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
            header.querySelector('h3').textContent = this.getMonthYear();
            this.initCalendar();
        });
    }

    getMonthYear() {
        return this.currentMonth.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
    }

    async getAvailableTimeSlots(date) {
        const slots = [];
        const day = date.getDay();
        let schedule;
        
        // Find matching schedule for the day
        for (let days in this.schedule) {
            if (days.split(',').map(Number).includes(day)) {
                schedule = this.schedule[days];
                break;
            }
        }

        if (!schedule) return slots;

        const [startHour, startMinute] = schedule.start.split(':').map(Number);
        const [endHour, endMinute] = schedule.end.split(':').map(Number);
        
        let currentTime = new Date(date);
        currentTime.setHours(startHour, startMinute, 0);
        
        const endTime = new Date(date);
        endTime.setHours(endHour, endMinute, 0);
        endTime.setMinutes(endTime.getMinutes() - schedule.duration);

        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        while (currentTime <= endTime) {
            if (!isToday || currentTime > now) {
                const slotEnd = new Date(currentTime);
                slotEnd.setMinutes(slotEnd.getMinutes() + schedule.duration);
                
                const timeString = currentTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });

                // Check if slot is already booked
                const isBooked = await this.gistService.isTimeSlotBooked(date, timeString);
                
                slots.push({
                    start: timeString,
                    end: slotEnd.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    }),
                    isBooked: isBooked
                });
            }
            currentTime.setMinutes(currentTime.getMinutes() + schedule.duration);
        }

        return slots;
    }

    async initCalendar() {
        const daysInMonth = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth() + 1,
            0
        ).getDate();

        const firstDay = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth(),
            1
        ).getDay();

        this.calendar.innerHTML = '';
        
        // Add day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'text-sm font-medium text-gray-500';
            dayEl.textContent = day;
            this.calendar.appendChild(dayEl);
        });

        // Add empty cells for days before first of month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day disabled';
            this.calendar.appendChild(emptyDay);
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateEl = document.createElement('div');
            dateEl.className = 'calendar-day';
            dateEl.textContent = day;
            
            const date = new Date(
                this.currentMonth.getFullYear(),
                this.currentMonth.getMonth(),
                day
            );

            // Only disable past dates
            if (date < new Date().setHours(0,0,0,0)) {
                dateEl.classList.add('disabled');
            } else {
                dateEl.addEventListener('click', async () => {
                    await this.selectDate(date, dateEl);
                });
            }

            this.calendar.appendChild(dateEl);
        }
    }

    async selectDate(date, element) {
        try {
            if (!element || !date) return;
            
            // Clear previous selection
            this.calendar.querySelectorAll('.calendar-day').forEach(day => {
                day.classList.remove('selected');
            });
            element.classList.add('selected');
            this.selectedDate = date;

            // Clear previous time selection
            this.selectedTime = null;
            
            // Show loading state
            this.timeSlots.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    Loading available times...
                </div>
            `;

            const timeSlots = await this.getAvailableTimeSlots(date);
            
            if (timeSlots.length === 0) {
                this.timeSlots.innerHTML = `
                    <div class="text-center text-gray-500 py-4">
                        No available time slots for this date
                    </div>
                `;
                return;
            }

            // Update time slots with loading state removed
            this.renderTimeSlots(timeSlots);
        } catch (error) {
            console.error('Error in selectDate:', error);
            this.timeSlots.innerHTML = `
                <div class="text-center text-red-500 py-4">
                    Error loading available times. Please try again.
                </div>
            `;
        }
    }

    renderTimeSlots(slots) {
        this.timeSlots.innerHTML = slots.map(slot => `
            <div class="time-slot ${slot.isBooked ? 'booked' : ''}" 
                 data-time="${slot.start}" 
                 ${slot.isBooked ? 'disabled' : ''}>
                ${slot.start} - ${slot.end}
                <div class="text-xs ${slot.isBooked ? 'text-red-400' : 'text-gray-500'}">
                    ${slot.isBooked ? 'Booked' : '1 hour slot'}
                </div>
            </div>
        `).join('');

        // Only attach click listeners to available slots
        this.timeSlots.querySelectorAll('.time-slot:not(.booked)').forEach(slot => {
            slot.addEventListener('click', () => this.selectTime(slot));
        });
    }

    selectTime(element) {
        this.timeSlots.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        element.classList.add('selected');
        this.selectedTime = element.dataset.time;
    }

    async renderCalendar() {
        const daysInMonth = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth() + 1,
            0
        ).getDate();

        const firstDay = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth(),
            1
        ).getDay();

        this.calendar.innerHTML = '';
        
        // Add day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'text-sm font-medium text-gray-500';
            dayEl.textContent = day;
            this.calendar.appendChild(dayEl);
        });

        // Add empty cells for days before first of month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day disabled';
            this.calendar.appendChild(emptyDay);
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateEl = document.createElement('div');
            dateEl.className = 'calendar-day';
            dateEl.textContent = day;
            
            const date = new Date(
                this.currentMonth.getFullYear(),
                this.currentMonth.getMonth(),
                day
            );

            // Only disable past dates
            if (date < new Date().setHours(0,0,0,0)) {
                dateEl.classList.add('disabled');
            } else {
                dateEl.addEventListener('click', async () => {
                    await this.selectDate(date, dateEl);
                });
            }

            this.calendar.appendChild(dateEl);
        }
    }
}

// Initialize booking calendar
document.addEventListener('DOMContentLoaded', () => {
    const booking = new BookingCalendar();
    const modal = document.getElementById('booking-modal');
    const bookingForm = document.getElementById('booking-form');
    const contactType = document.getElementById('contact-type');
    const contactInfo = document.getElementById('contact-info');
    const cancelBtn = document.getElementById('cancel-booking');

    // Update contact field placeholder based on selected type
    contactType.addEventListener('change', () => {
        const type = contactType.value;
        contactInfo.setAttribute('type', type === 'email' ? 'email' : 'text');
        switch(type) {
            case 'phone':
                contactInfo.placeholder = '(123) 456-7890';
                break;
            case 'email':
                contactInfo.placeholder = 'your@email.com';
                break;
            case 'instagram':
                contactInfo.placeholder = '@yourusername';
                break;
        }
    });

    // Update show/hide modal methods
    document.getElementById('book-btn').addEventListener('click', () => {
        const service = document.getElementById('service-select');
        if (!booking.selectedDate || !booking.selectedTime) {
            alert('Please select both a date and time.');
            return;
        }

        // Update booking summary
        document.getElementById('summary-date').textContent = booking.selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('summary-time').textContent = booking.selectedTime;
        document.getElementById('summary-service').textContent = service.options[service.selectedIndex].text;

        // Show modal
        modal.classList.add('visible');
    });

    // Update all modal close handlers
    function closeModal() {
        modal.classList.remove('visible');
        bookingForm.reset();
    }

    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Update form submission handler
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const service = document.getElementById('service-select');
        const bookingData = {
            name: document.getElementById('client-name').value,
            service: service.options[service.selectedIndex].text,
            date: booking.selectedDate.toISOString().split('T')[0],
            time: booking.selectedTime,
            contact: {
                type: contactType.value,
                info: contactInfo.value
            },
            notes: document.getElementById('booking-notes').value
        };
        
        try {
            await booking.gistService.saveBooking(bookingData);
            alert('Thank you for booking! We will confirm your appointment shortly.');
            closeModal();
            
            // Refresh the time slots to show updated availability
            if (booking.selectedDate) {
                booking.selectDate(booking.selectedDate, 
                    document.querySelector('.calendar-day.selected'));
            }
        } catch (error) {
            alert('Sorry, there was an error saving your booking. Please try again.');
        }
    });
});
