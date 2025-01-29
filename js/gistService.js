class GistService {
    constructor() {
        this.gistId = 'YOUR_GIST_ID'; // Replace with your Gist ID
        this.filename = 'bookings_data.json';
        this.githubToken = 'YOUR_GITHUB_TOKEN'; // Replace with your GitHub token
    }

    async getBookings() {
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                headers: {
                    'Authorization': `token ${this.githubToken}`
                }
            });
            const data = await response.json();
            return JSON.parse(data.files[this.filename].content);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            return { bookings: [] };
        }
    }

    async saveBooking(bookingData) {
        try {
            const currentData = await this.getBookings();
            
            // Clean up empty fields
            const cleanBookingData = Object.fromEntries(
                Object.entries({
                    id: `booking-${Date.now()}`,
                    ...bookingData
                }).filter(([_, value]) => {
                    if (typeof value === 'object') {
                        return Object.values(value).some(v => v !== '');
                    }
                    return value !== '';
                })
            );

            // Only include contact if it has data
            if (cleanBookingData.contact && 
                (!cleanBookingData.contact.info || !cleanBookingData.contact.type)) {
                delete cleanBookingData.contact;
            }

            currentData.bookings.push(cleanBookingData);

            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files: {
                        [this.filename]: {
                            content: JSON.stringify(currentData, null, 2)
                        }
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save booking');
            }

            return cleanBookingData;
        } catch (error) {
            console.error('Error saving booking:', error);
            throw error;
        }
    }

    isTimeSlotBooked(date, time) {
        return this.getBookings().then(data => {
            return data.bookings.some(booking => 
                booking.date === date.toISOString().split('T')[0] && 
                booking.time === time
            );
        });
    }

    async updateBookings(data) {
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files: {
                        [this.filename]: {
                            content: JSON.stringify(data, null, 2)
                        }
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update bookings');
            }

            return true;
        } catch (error) {
            console.error('Error updating bookings:', error);
            throw error;
        }
    }

    async deleteBooking(bookingId) {
        try {
            const currentData = await this.getBookings();
            currentData.bookings = currentData.bookings.filter(booking => booking.id !== bookingId);
            return this.updateBookings(currentData);
        } catch (error) {
            console.error('Error deleting booking:', error);
            throw error;
        }
    }
}
