class ParkingSystem {
    constructor() {
        this.parkingSpots = [];
        this.currentParking = new Map();
        this.timer = null;
        this.rates = {
            Sedan: 100,
            SUV: 150,
            MPV: 200,
            Electric: 50,
            LCGC: 75
        };
        this.totalRevenue = 0;
        this.tooltip = null;
        this.initialize();
    }

    initialize() {
        this.initializeTooltip();
        this.initializeParkingSpots();
        this.initializeEventListeners();
        this.updateClock();
        this.startRealtimeUpdates();
    }

    initializeTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'parking-tooltip';
        tooltip.className = 'fixed hidden bg-gray-900 text-white p-3 rounded-lg text-sm z-50 shadow-lg';
        document.body.appendChild(tooltip);
        this.tooltip = tooltip;
    }

    updateClock() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            document.getElementById('currentTime').textContent = timeString;
        };
        updateTime();
        setInterval(updateTime, 1000);
    }

    createParkingSpotElement(spot) {
        const spotElement = document.createElement('div');
        spotElement.className = `parking-spot ${spot.isOccupied ? 'occupied' : 'available'} p-4 flex flex-col items-center justify-center`;
        spotElement.setAttribute('data-spot', spot.id);
        
        const innerContent = `
            <div class="text-center">
                <div class="spot-number">${spot.id}</div>
                ${spot.vehicleData ? `
                    <div class="spot-details">
                        ${spot.vehicleData.licensePlate}
                    </div>
                ` : ''}
            </div>
            ${spot.isOccupied ? '<div class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>' : ''}
        `;
        
        spotElement.innerHTML = innerContent;
        
        spotElement.addEventListener('mouseenter', (e) => this.handleSpotHover(e, spot));
        spotElement.addEventListener('mouseleave', () => this.hideTooltip());
        spotElement.addEventListener('click', () => this.handleSpotClick(spot));
        
        return spotElement;
    }

    initializeParkingSpots() {
        const container = document.getElementById('parkingSpots');
        const totalSpots = 16;

        container.innerHTML = '';

        const laneConnector = document.createElement('div');
        laneConnector.className = 'lane-connector';
        laneConnector.innerHTML = '<div class="vertical-dashed-line"></div>';
        container.appendChild(laneConnector);

        const leftSide = document.createElement('div');
        const rightSide = document.createElement('div');

        leftSide.className = 'w-[45%] grid grid-cols-2 grid-rows-4 gap-4';
        rightSide.className = 'w-[45%] grid grid-cols-2 grid-rows-4 gap-4';

        this.parkingSpots = Array(16).fill(null).map((_, index) => ({
            id: index + 1,
            isOccupied: false,
            vehicleData: null,
            startTime: null
        }));

        this.parkingSpots.forEach((spot, index) => {
            const spotElement = this.createParkingSpotElement(spot);
            if (index < 8) {
                leftSide.appendChild(spotElement);
            } else {
                rightSide.appendChild(spotElement);
            }
        });

        container.appendChild(leftSide);
        container.appendChild(rightSide);

        console.log('Spots after initialization:', this.parkingSpots.length);
        this.updateStatistics();
    }

    handleSpotHover(event, spot) {
        if (!spot.isOccupied) return;

        const tooltip = this.tooltip;
        const duration = this.calculateDuration(spot.startTime);
        const amount = this.calculatePayment(spot.vehicleData.vehicleType, duration);

        tooltip.innerHTML = `
            <div class="space-y-1">
                <div class="font-semibold text-white">${spot.vehicleData.licensePlate}</div>
                <div class="text-gray-300">Name: ${spot.vehicleData.name}</div>
                <div class="text-gray-300">Type: ${spot.vehicleData.vehicleType}</div>
                <div class="text-gray-300">Duration: ${duration} mins</div>
                <div class="text-gray-300">Amount: Rp ${amount.toLocaleString()}</div>
            </div>
        `;

        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width + 10}px`;
        tooltip.style.top = `${rect.top + (rect.height / 2) - (tooltip.offsetHeight / 2)}px`;
        tooltip.classList.remove('hidden');
    }

    hideTooltip() {
        this.tooltip.classList.add('hidden');
    }

    initializeEventListeners() {
        const vehicleForm = document.getElementById('vehicleForm');
        vehicleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleVehicleRegistration();
        });

        const payBtn = document.getElementById('payBtn');
        payBtn.addEventListener('click', () => this.handlePayment());

        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = 'login.html';
            }
        });
    }

    startRealtimeUpdates() {
        setInterval(() => {
            this.updateAllParkingDetails();
        }, 60000);
    }

    handleSpotClick(spot) {
        console.log('Spot clicked:', spot);
        if (spot.isOccupied) {
            console.log('Showing payment details for spot:', spot.id);
            this.showPaymentDetails(spot);
        } else {
            this.showVehicleForm(spot.id);
        }
        this.hideTooltip();
    }

    showVehicleForm(spotId) {
        const parkingDetails = document.getElementById('parkingDetails');
        parkingDetails.classList.add('hidden');
        
        const form = document.getElementById('vehicleForm');
        form.setAttribute('data-spot-id', spotId);
        form.reset();
        const vehicleFormSection = document.getElementById('vehicleFormSection');
        vehicleFormSection.classList.remove('hidden');
    }

    showPaymentDetails(spot) {
        if (!spot.vehicleData) return;

        const vehicleFormSection = document.getElementById('vehicleFormSection');
        vehicleFormSection.classList.add('hidden');
        
        const detailsContainer = document.getElementById('parkingDetails');
        const licensePlateDisplay = document.getElementById('licensePlateDisplay');
        const durationDisplay = document.getElementById('durationDisplay');
        const amountDisplay = document.getElementById('amountDisplay');

        licensePlateDisplay.textContent = spot.vehicleData.licensePlate;
        
        const updateDetails = () => {
            const duration = this.calculateDuration(spot.startTime);
            const amount = this.calculatePayment(spot.vehicleData.vehicleType, duration);
            durationDisplay.textContent = duration;
            amountDisplay.textContent = amount.toLocaleString();
        };

        updateDetails();
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(updateDetails, 60000);

        detailsContainer.classList.remove('hidden');
    }

    handleVehicleRegistration() {
        const form = document.getElementById('vehicleForm');
        const spotId = parseInt(form.getAttribute('data-spot-id'));
        
        const vehicleData = {
            name: form.elements['name'].value,
            licensePlate: form.elements['licensePlate'].value.toUpperCase(),
            vehicleType: form.elements['vehicleType'].value,
            startTime: new Date().getTime()
        };

        this.parkSpot(spotId, vehicleData);
        form.reset();
        document.getElementById('vehicleFormSection').classList.add('hidden');
    }

    parkSpot(spotId, vehicleData) {
        if (this.parkingSpots.length !== 16) {
            console.error('Invalid parking spots array, reinitializing...');
            this.initializeParkingSpots();
        }

        const spot = this.parkingSpots.find(s => s.id === spotId);
        if (spot) {
            spot.isOccupied = true;
            spot.vehicleData = vehicleData;
            spot.startTime = vehicleData.startTime;
            this.currentParking.set(spotId, vehicleData);
            this.updateParkingDisplay();
        }
    }

    handlePayment() {
        const licensePlate = document.getElementById('licensePlateDisplay').textContent;
        const selectedSpot = this.parkingSpots.find(spot => 
            spot.isOccupied && spot.vehicleData.licensePlate === licensePlate
        );

        if (selectedSpot) {
            const duration = this.calculateDuration(selectedSpot.startTime);
            const amount = this.calculatePayment(selectedSpot.vehicleData.vehicleType, duration);

            const confirmPayment = confirm(`
                Duration: ${duration} minutes
                Amount: Rp ${amount.toLocaleString()}
                Confirm payment?
            `);

            if (confirmPayment) {
                this.totalRevenue += amount;
                this.completeParkingSession(selectedSpot.id);
                this.updateRevenue();
                alert('Payment successful! Thank you for using our parking service.');
            }
        }
    }

    completeParkingSession(spotId) {
        const spot = this.parkingSpots.find(s => s.id === spotId);
        if (spot) {
            spot.isOccupied = false;
            spot.vehicleData = null;
            spot.startTime = null;
            this.currentParking.delete(spotId);
            this.updateParkingDisplay();
            document.getElementById('parkingDetails').classList.add('hidden');
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }
    }

    calculateDuration(startTime) {
        return Math.floor((new Date().getTime() - startTime) / 60000);
    }

    calculatePayment(vehicleType, duration) {
        return this.rates[vehicleType] * duration;
    }

    updateParkingDisplay() {
        if (this.parkingSpots.length !== 16) {
            console.error('Parking spots array corrupted, reinitializing...');
            this.initializeParkingSpots();
            return;
        }

        const spotElements = new Map();
        document.querySelectorAll('.parking-spot').forEach(element => {
            const id = element.getAttribute('data-spot');
            spotElements.set(parseInt(id), element);
        });

        this.parkingSpots.forEach(spot => {
            const existingElement = spotElements.get(spot.id);
            const newElement = this.createParkingSpotElement(spot);
            
            if (existingElement) {
                existingElement.replaceWith(newElement);
            }
        });

        this.updateStatistics();
    }

    updateStatistics() {
        const totalSpots = this.parkingSpots.length;
        const occupiedSpots = this.parkingSpots.filter(spot => spot.isOccupied).length;
        
        console.log('Statistics Update:');
        console.log('Total Spots Array:', this.parkingSpots);
        console.log('Total Spots:', totalSpots);
        console.log('Occupied Spots:', occupiedSpots);
        console.log('Available Spots:', totalSpots - occupiedSpots);

        document.getElementById('totalSpots').textContent = totalSpots;
        document.getElementById('availableSpots').textContent = totalSpots - occupiedSpots;
        document.getElementById('occupiedSpots').textContent = occupiedSpots;
        this.updateRevenue();
    }

    updateRevenue() {
        document.getElementById('totalRevenue').textContent = 
            `Rp ${this.totalRevenue.toLocaleString()}`;
    }

    updateAllParkingDetails() {
        if (this.parkingSpots.length !== 16) {
            console.error('Invalid parking spots array during update, reinitializing...');
            this.initializeParkingSpots();
            return;
        }

        this.parkingSpots.forEach(spot => {
            if (spot.isOccupied && 
                spot.vehicleData.licensePlate === document.getElementById('licensePlateDisplay').textContent) {
                const duration = this.calculateDuration(spot.startTime);
                const amount = this.calculatePayment(spot.vehicleData.vehicleType, duration);
                document.getElementById('durationDisplay').textContent = duration;
                document.getElementById('amountDisplay').textContent = amount.toLocaleString();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const parkingSystem = new ParkingSystem();
});