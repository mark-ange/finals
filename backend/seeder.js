const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Report = require('./models/Report');
const Barangay = require('./models/Barangay');
const Fleet = require('./models/Fleet');
const Schedule = require('./models/Schedule');
const Notification = require('./models/Notification');

const seedData = async (shouldExit = true) => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/citycare_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    }

    console.log('Clearing existing collections to seed fresh database records...');
    await User.deleteMany();
    await Report.deleteMany();
    await Barangay.deleteMany();
    await Fleet.deleteMany();
    await Schedule.deleteMany();
    await Notification.deleteMany();

    console.log('Seeding Administrator Accounts...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const staffPassword = await bcrypt.hash('staff123', salt);

    const adminUser = await User.create({
      fullName: 'CLENRO Central Admin',
      email: 'admin@clenro-cdo.gov.ph',
      phoneNumber: '0917-123-4567',
      barangay: 'Central District',
      purokZone: 'City Hall Complex',
      password: adminPassword,
      securityPin: '1234',
      role: 'CLENRO Central Admin'
    });

    await User.create({
      fullName: 'CLENRO Staff Officer',
      email: 'staff@clenro-cdo.gov.ph',
      phoneNumber: '0917-987-6543',
      barangay: 'Central District',
      purokZone: 'CLENRO Operations Desk',
      password: staffPassword,
      securityPin: '1234',
      role: 'CLENRO Staff'
    });

    console.log('Seeding Cagayan de Oro Barangays...');
    const barangays = await Barangay.insertMany([
      { name: 'Carmen', district: 'District 1', teams: 3, status: 'Active' },
      { name: 'Lapasan', district: 'District 1', teams: 2, status: 'Active' },
      { name: 'Macasandig', district: 'District 1', teams: 2, status: 'Active' },
      { name: 'Balulang', district: 'District 2', teams: 2, status: 'Active' },
      { name: 'Lumbia', district: 'District 3', teams: 1, status: 'Active' },
      { name: 'Bulua', district: 'District 1', teams: 2, status: 'Active' },
      { name: 'Nazareth', district: 'District 2', teams: 2, status: 'Active' },
      { name: 'Kauswagan', district: 'District 1', teams: 2, status: 'Active' }
    ]);

    console.log('Seeding Fleet Vehicles & Drivers...');
    await Fleet.insertMany([
      {
        truckId: 'TRK-042',
        plate: 'KGA-9042',
        barangay: 'Carmen',
        driver: 'Mateo Reyes',
        status: 'In Transit',
        position: { top: '30%', left: '48%' }
      },
      {
        truckId: 'TRK-015',
        plate: 'KGA-8832',
        barangay: 'Lapasan',
        driver: 'Juanito Luna',
        status: 'Idle',
        position: { top: '42%', left: '61%' }
      },
      {
        truckId: 'TRK-008',
        plate: 'KGA-7104',
        barangay: 'Balulang',
        driver: 'Danilo Cruz',
        status: 'In Transit',
        position: { top: '65%', left: '38%' }
      },
      {
        truckId: 'TRK-029',
        plate: 'KGA-6321',
        barangay: 'Macasandig',
        driver: 'Ricardo Tan',
        status: 'Idle',
        position: { top: '55%', left: '52%' }
      },
      {
        truckId: 'TRK-011',
        plate: 'KGA-5509',
        barangay: 'Central Depot',
        driver: 'Pedro Flores',
        status: 'Maintenance',
        position: { top: '20%', left: '30%' }
      }
    ]);

    console.log('Seeding Civic Incident Reports...');
    await Report.insertMany([
      {
        reportId: '#CDO-2026-8901',
        title: 'Brgy. Carmen, Purok 4',
        district: 'District 1',
        barangay: 'Carmen',
        purokZone: 'Purok 4',
        landmark: 'Carmen Public Market',
        gpsCoordinates: '8.4832, 124.6454',
        category: 'Waste Collection',
        media: true,
        photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
        status: 'Pending',
        reporter: 'Maria Santos',
        description: 'Uncollected household waste has accumulated along the roadside for two collection cycles near the market corner.',
        unitAssigned: 'Unassigned',
        team: '',
        personnel: '',
        notes: '',
        user: adminUser._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        reportId: '#CDO-2026-8895',
        title: 'Brgy. Balulang, Macanhan Road',
        district: 'District 2',
        barangay: 'Balulang',
        purokZone: 'Purok 2',
        landmark: 'Macanhan Road Intersection',
        gpsCoordinates: '8.4491, 124.6178',
        category: 'Road Repair',
        media: true,
        status: 'Assigned',
        reporter: 'Carlos Reyes',
        description: 'A growing pothole is affecting vehicles near the intersection and requires immediate inspection and patching.',
        unitAssigned: 'Roads & Infrastructure Team',
        team: 'Roads & Infrastructure Team',
        personnel: 'A. Ramos',
        notes: 'Inspect the road surface and prepare an asphalt patch estimate.',
        user: adminUser._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5 hours ago
      },
      {
        reportId: '#CDO-2026-8891',
        title: 'Brgy. Lapasan, Zone 3 Highway',
        district: 'District 1',
        barangay: 'Lapasan',
        purokZone: 'Zone 3',
        landmark: 'Near Puregold Lapasan',
        gpsCoordinates: '8.4862, 124.6612',
        category: 'Waste Collection',
        media: true,
        status: 'In Progress',
        reporter: 'Elena Dimaculangan',
        description: 'Commercial waste bin overflowing onto pedestrian sidewalk.',
        unitAssigned: 'Sanitation Response Team',
        team: 'Sanitation Response Team',
        personnel: 'R. Dela Cruz',
        notes: 'Dispatched CLENRO Truck #4 to clear site.',
        user: adminUser._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12) // 12 hours ago
      },
      {
        reportId: '#CDO-2026-8874',
        title: 'Brgy. Macasandig, Tibasak',
        district: 'District 1',
        barangay: 'Macasandig',
        purokZone: 'Tibasak',
        landmark: 'Riverside Walkway',
        gpsCoordinates: '8.4688, 124.6415',
        category: 'Clogged Drainage Waste',
        media: false,
        status: 'Resolved',
        reporter: 'Josephine Valerio',
        description: 'Drainage culvert blocked with plastic waste causing slight ponding during heavy rain.',
        unitAssigned: 'Sanitation Response Team',
        team: 'Sanitation Response Team',
        personnel: 'J. Santos',
        notes: 'Debris completely excavated and cleared. Water flowing normally.',
        user: adminUser._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
      },
      {
        reportId: '#CDO-2026-8860',
        title: 'Brgy. Lumbia, Airport Road',
        district: 'District 3',
        barangay: 'Lumbia',
        purokZone: 'Purok 1',
        landmark: 'Near Old Airport Gate',
        gpsCoordinates: '8.4125, 124.6102',
        category: 'Fallen Tree',
        media: true,
        status: 'Resolved',
        reporter: 'Ramon Bautista',
        description: 'Large acacia branch fallen across the outer lane following thunderstorm.',
        unitAssigned: 'Parks & Emergency Team',
        team: 'Parks & Emergency Team',
        personnel: 'L. Navarro',
        notes: 'Branch sawed and hauled away. Lane reopened to traffic.',
        user: adminUser._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) // 3 days ago
      },
      {
        reportId: '#CDO-2026-8842',
        title: 'Brgy. Bulua, Westbound Terminal Zone',
        district: 'District 1',
        barangay: 'Bulua',
        purokZone: 'Zone 5',
        landmark: 'Opposite Jeepney Terminal',
        gpsCoordinates: '8.5012, 124.6288',
        category: 'Street Lighting',
        media: false,
        status: 'Pending',
        reporter: 'Arnel Mendoza',
        description: 'Non-functional solar street light causing low visibility at night.',
        unitAssigned: 'Unassigned',
        team: '',
        personnel: '',
        notes: '',
        user: adminUser._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8) // 8 hours ago
      }
    ]);

    console.log('Seeding Waste Collection Schedules...');
    await Schedule.insertMany([
      {
        barangay: 'Carmen',
        biodegradableDays: 'Monday, Wednesday, Friday',
        nonBiodegradableDays: 'Tuesday, Thursday, Saturday',
        timeSlot: '06:00 AM - 10:00 AM',
        assignedTruck: 'CLENRO Truck #4'
      },
      {
        barangay: 'Lapasan',
        biodegradableDays: 'Tuesday, Friday',
        nonBiodegradableDays: 'Monday, Thursday',
        timeSlot: '05:00 AM - 09:00 AM',
        assignedTruck: 'CLENRO Truck #1'
      },
      {
        barangay: 'Balulang',
        biodegradableDays: 'Monday, Thursday',
        nonBiodegradableDays: 'Wednesday, Saturday',
        timeSlot: '07:00 AM - 11:00 AM',
        assignedTruck: 'CLENRO Truck #2'
      },
      {
        barangay: 'Macasandig',
        biodegradableDays: 'Tuesday, Thursday, Saturday',
        nonBiodegradableDays: 'Monday, Wednesday, Friday',
        timeSlot: '06:00 AM - 10:00 AM',
        assignedTruck: 'CLENRO Truck #3'
      },
      {
        barangay: 'Lumbia',
        biodegradableDays: 'Wednesday, Saturday',
        nonBiodegradableDays: 'Tuesday, Friday',
        timeSlot: '08:00 AM - 12:00 PM',
        assignedTruck: 'CLENRO Truck #5'
      }
    ]);

    console.log('Seeding Notifications & Push Alerts...');
    await Notification.insertMany([
      {
        title: 'New Incident Submitted',
        body: 'Resident reported Waste Collection issue in Carmen Purok 4 (#CDO-2026-8901).',
        type: 'REPORT_UPDATE',
        time: '2 hours ago'
      },
      {
        title: 'Dispatch Truck En Route',
        body: 'CLENRO Truck #4 dispatched to Lapasan Zone 3 for commercial collection.',
        type: 'DISPATCH',
        time: '5 hours ago'
      },
      {
        title: 'Barangay Macasandig Schedule Alert',
        body: 'Collection schedule active for biodegradable waste today.',
        type: 'COLLECTION_SCHEDULE',
        time: 'Yesterday'
      }
    ]);

    console.log('✅ Database Seeding Completed Successfully in MongoDB!');
    console.log('Default Admin Account:');
    console.log('  Email: admin@clenro-cdo.gov.ph');
    console.log('  Password: admin123');
    console.log('  PIN: 1234');
    console.log('  Role: CLENRO Central Admin');

    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Database Seeding Failed:', error.message);
    if (shouldExit) {
      process.exit(1);
    }
  }
};

// Run if called directly
if (require.main === module) {
  seedData(true);
}

module.exports = seedData;
