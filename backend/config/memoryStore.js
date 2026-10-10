// In-memory runtime storage fallback used ONLY when MongoDB server is offline
// Initialized with full CityCare CDO civic data

const memoryStore = {
  users: [
    {
      _id: 'usr_admin_001',
      fullName: 'CLENRO Central Admin',
      email: 'admin@clenro-cdo.gov.ph',
      phoneNumber: '0917-123-4567',
      barangay: 'Central District',
      purokZone: 'City Hall Complex',
      password: 'admin123',
      securityPin: '1234',
      role: 'CLENRO Central Admin'
    },
    {
      _id: 'usr_staff_002',
      fullName: 'CLENRO Staff Officer',
      email: 'staff@clenro-cdo.gov.ph',
      phoneNumber: '0917-987-6543',
      barangay: 'Central District',
      purokZone: 'CLENRO Operations Desk',
      password: 'staff123',
      securityPin: '1234',
      role: 'CLENRO Staff'
    }
  ],

  barangays: [
    { _id: 'bg_1', name: 'Carmen', district: 'District 1', teams: 3, status: 'Active' },
    { _id: 'bg_2', name: 'Lapasan', district: 'District 1', teams: 2, status: 'Active' },
    { _id: 'bg_3', name: 'Macasandig', district: 'District 1', teams: 2, status: 'Active' },
    { _id: 'bg_4', name: 'Balulang', district: 'District 2', teams: 2, status: 'Active' },
    { _id: 'bg_5', name: 'Lumbia', district: 'District 3', teams: 1, status: 'Active' },
    { _id: 'bg_6', name: 'Bulua', district: 'District 1', teams: 2, status: 'Active' },
    { _id: 'bg_7', name: 'Nazareth', district: 'District 2', teams: 2, status: 'Active' },
    { _id: 'bg_8', name: 'Kauswagan', district: 'District 1', teams: 2, status: 'Active' }
  ],

  fleet: [
    {
      _id: 'fl_1',
      truckId: 'TRK-042',
      plate: 'KGA-9042',
      barangay: 'Carmen',
      driver: 'Mateo Reyes',
      status: 'In Transit',
      position: { top: '30%', left: '48%' }
    },
    {
      _id: 'fl_2',
      truckId: 'TRK-015',
      plate: 'KGA-8832',
      barangay: 'Lapasan',
      driver: 'Juanito Luna',
      status: 'Idle',
      position: { top: '42%', left: '61%' }
    },
    {
      _id: 'fl_3',
      truckId: 'TRK-008',
      plate: 'KGA-7104',
      barangay: 'Balulang',
      driver: 'Danilo Cruz',
      status: 'In Transit',
      position: { top: '65%', left: '38%' }
    },
    {
      _id: 'fl_4',
      truckId: 'TRK-029',
      plate: 'KGA-6321',
      barangay: 'Macasandig',
      driver: 'Ricardo Tan',
      status: 'Idle',
      position: { top: '55%', left: '52%' }
    },
    {
      _id: 'fl_5',
      truckId: 'TRK-011',
      plate: 'KGA-5509',
      barangay: 'Central Depot',
      driver: 'Pedro Flores',
      status: 'Maintenance',
      position: { top: '20%', left: '30%' }
    }
  ],

  reports: [
    {
      _id: 'rep_1',
      reportId: '#CDO-2026-8901',
      title: 'Brgy. Carmen, Purok 4',
      district: 'District 1',
      barangay: 'Carmen',
      purokZone: 'Purok 4',
      landmark: 'Carmen Public Market',
      gpsCoordinates: '8.4832, 124.6454',
      category: 'Waste Collection',
      media: true,
      photoUrl: '',
      status: 'Pending',
      reporter: 'Maria Santos',
      description: 'Uncollected household waste has accumulated along the roadside for two collection cycles near the market corner.',
      unitAssigned: 'Unassigned',
      team: '',
      personnel: '',
      notes: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
      _id: 'rep_2',
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
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
    },
    {
      _id: 'rep_3',
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
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12)
    },
    {
      _id: 'rep_4',
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
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
    },
    {
      _id: 'rep_5',
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
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
    },
    {
      _id: 'rep_6',
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
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8)
    }
  ],

  schedules: [
    {
      _id: 'sch_1',
      barangay: 'Carmen',
      biodegradableDays: 'Monday, Wednesday, Friday',
      nonBiodegradableDays: 'Tuesday, Thursday, Saturday',
      timeSlot: '06:00 AM - 10:00 AM',
      assignedTruck: 'CLENRO Truck #4'
    },
    {
      _id: 'sch_2',
      barangay: 'Lapasan',
      biodegradableDays: 'Tuesday, Friday',
      nonBiodegradableDays: 'Monday, Thursday',
      timeSlot: '05:00 AM - 09:00 AM',
      assignedTruck: 'CLENRO Truck #1'
    },
    {
      _id: 'sch_3',
      barangay: 'Balulang',
      biodegradableDays: 'Monday, Thursday',
      nonBiodegradableDays: 'Wednesday, Saturday',
      timeSlot: '07:00 AM - 11:00 AM',
      assignedTruck: 'CLENRO Truck #2'
    },
    {
      _id: 'sch_4',
      barangay: 'Macasandig',
      biodegradableDays: 'Tuesday, Thursday, Saturday',
      nonBiodegradableDays: 'Monday, Wednesday, Friday',
      timeSlot: '06:00 AM - 10:00 AM',
      assignedTruck: 'CLENRO Truck #3'
    },
    {
      _id: 'sch_5',
      barangay: 'Lumbia',
      biodegradableDays: 'Wednesday, Saturday',
      nonBiodegradableDays: 'Tuesday, Friday',
      timeSlot: '08:00 AM - 12:00 PM',
      assignedTruck: 'CLENRO Truck #5'
    }
  ]
};

module.exports = memoryStore;
