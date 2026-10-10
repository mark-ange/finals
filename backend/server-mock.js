// Mock backend server without MongoDB for demo purposes
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Mock data
const mockReports = [
  {
    _id: '1',
    reportId: '#CDO-2026-0412',
    title: 'Brgy. Carmen, Purok 2',
    district: 'District 1',
    barangay: 'Carmen',
    purokZone: 'Purok 2',
    landmark: 'Near Barangay Health Center',
    gpsCoordinates: '8.4822° N, 124.6175° E',
    gps: '8.4822° N, 124.6175° E',
    category: 'Waste Collection',
    media: true,
    photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
    status: 'PENDING',
    reporter: 'Resident',
    userEmail: 'resident@cdo.ph',
    description: 'Uncollected waste piled near the drainage. Causing obstruction on the sidewalk.',
    unitAssigned: 'Unassigned',
    team: '',
    personnel: '',
    notes: '',
    createdAt: new Date().toISOString()
  },
  {
    _id: '2',
    reportId: '#CDO-2026-0411',
    title: 'Brgy. Lapasan',
    district: 'District 1',
    barangay: 'Lapasan',
    purokZone: 'Main Market Road',
    landmark: '',
    gpsCoordinates: '8.4850° N, 124.6210° E',
    gps: '8.4850° N, 124.6210° E',
    category: 'Waste Collection',
    media: true,
    photoUrl: 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?auto=format&fit=crop&w=600&q=80',
    status: 'ASSIGNED',
    reporter: 'Resident',
    userEmail: 'resident@cdo.ph',
    description: 'Overflowing garbage bin at market area.',
    unitAssigned: 'CLENRO Truck #4 (Driver: J. Cruz)',
    team: 'CLENRO Team',
    personnel: 'J. Cruz',
    notes: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    _id: '3',
    reportId: '#CDO-2026-0409',
    title: 'Brgy. Macasandig',
    district: 'District 1',
    barangay: 'Macasandig',
    purokZone: 'Near Riverside Chapel',
    landmark: 'Riverside Chapel',
    gpsCoordinates: '8.4710° N, 124.6050° E',
    gps: '8.4710° N, 124.6050° E',
    category: 'Waste Collection',
    media: false,
    photoUrl: '',
    status: 'PENDING',
    reporter: 'Resident',
    userEmail: 'resident@cdo.ph',
    description: 'Illegal dumping site reported near chapel.',
    unitAssigned: 'Unassigned',
    team: '',
    personnel: '',
    notes: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  }
];

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'CityCare CDO Unified Backend API (Web Admin & Mobile App)',
    timestamp: new Date().toISOString()
  });
});

// Reports API
app.get('/api/reports', (req, res) => {
  res.json({ data: mockReports });
});

app.get('/api/reports/:id', (req, res) => {
  const report = mockReports.find(r => r.reportId === req.params.id || r._id === req.params.id);
  if (report) {
    res.json(report);
  } else {
    res.status(404).json({ message: 'Report not found' });
  }
});

app.put('/api/reports/:id/status', (req, res) => {
  const { id } = req.params;
  const report = mockReports.find(r => r.reportId === id || r._id === id);
  if (report) {
    const { status, unitAssigned, notes } = req.body;
    report.status = status || report.status;
    report.unitAssigned = unitAssigned || report.unitAssigned;
    report.notes = notes || report.notes;
    res.json(report);
  } else {
    res.status(404).json({ message: 'Report not found' });
  }
});

// Auth API (mock)
app.post('/api/auth/admin-login', (req, res) => {
  res.json({
    token: 'mock-token',
    data: {
      fullName: 'CLENRO Central Admin',
      email: 'admin@clenro-cdo.gov.ph',
      role: 'CLENRO Central Admin'
    }
  });
});

app.get('/api/auth/profile', (req, res) => {
  res.json({
    fullName: 'CLENRO Central Admin',
    email: 'admin@clenro-cdo.gov.ph',
    role: 'CLENRO Central Admin'
  });
});

// Barangays API
app.get('/api/barangays', (req, res) => {
  res.json([
    { name: 'Carmen', district: 'District 1', teams: 3, status: 'Active' },
    { name: 'Lapasan', district: 'District 1', teams: 2, status: 'Active' },
    { name: 'Macasandig', district: 'District 1', teams: 2, status: 'Active' },
    { name: 'Balulang', district: 'District 2', teams: 2, status: 'Active' }
  ]);
});

// Fleet API
app.get('/api/fleet', (req, res) => {
  res.json([
    { truckId: 'TRK-042', plate: 'KGA-9042', barangay: 'Carmen', driver: 'Mateo Reyes', status: 'In Transit' },
    { truckId: 'TRK-015', plate: 'KGA-8832', barangay: 'Lapasan', driver: 'Juanito Luna', status: 'Idle' }
  ]);
});

// Schedules API
app.get('/api/schedules', (req, res) => {
  res.json([
    { barangay: 'Carmen', biodegradableDays: 'Monday, Wednesday, Friday', nonBiodegradableDays: 'Tuesday, Thursday, Saturday', timeSlot: '06:00 AM - 10:00 AM', assignedTruck: 'CLENRO Truck #4' }
  ]);
});

// Dashboard API
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalReports: mockReports.length,
    pending: mockReports.filter(r => r.status === 'PENDING').length,
    assigned: mockReports.filter(r => r.status === 'ASSIGNED').length,
    inProgress: mockReports.filter(r => r.status === 'IN_PROGRESS').length,
    resolved: mockReports.filter(r => r.status === 'RESOLVED').length
  });
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  res.json([]);
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('CityCare CDO Unified Node.js / Express & MongoDB Backend API Server is running.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 CityCare Mock API Server running on port ${PORT}`);
  console.log(`📡 Local Web Portal endpoint: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
