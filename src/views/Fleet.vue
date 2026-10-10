<template>
  <div class="fleet-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Garbage Truck Fleet Management</h1>
        <p class="page-subtitle">Real-time collection vehicle status, driver assignments, and depot routes.</p>
      </div>

      <button type="button" class="btn btn-primary" @click="openAddForm">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Add Vehicle</span>
      </button>
    </div>

    <!-- Status Cards -->
    <div class="status-grid">
      <div class="status-card transit-state">
        <div class="status-header">
          <span class="status-label">IN TRANSIT</span>
          <div class="status-dot green"></div>
        </div>
        <div class="status-val text-green">{{ fleetStats.inTransit }}</div>
        <span class="status-sub">Active collection routes</span>
      </div>

      <div class="status-card idle-state">
        <div class="status-header">
          <span class="status-label">STANDBY / DEPOT</span>
          <div class="status-dot yellow"></div>
        </div>
        <div class="status-val text-yellow">{{ fleetStats.idle }}</div>
        <span class="status-sub">Ready for dispatch</span>
      </div>

      <div class="status-card maint-state">
        <div class="status-header">
          <span class="status-label">MAINTENANCE</span>
          <div class="status-dot red"></div>
        </div>
        <div class="status-val text-red">{{ fleetStats.maintenance }}</div>
        <span class="status-sub">Scheduled repair in depot</span>
      </div>
    </div>

    <!-- City Sector Map Section -->
    <div class="map-card">
      <div class="map-header">
        <div>
          <h2 class="panel-title">City Sector Map & Vehicle Positions</h2>
          <span class="panel-subtitle">Urban district monitoring across Cagayan de Oro City</span>
        </div>

        <div class="map-legend">
          <span class="legend-item"><span class="dot green"></span> In Transit</span>
          <span class="legend-item"><span class="dot yellow"></span> Standby</span>
          <span class="legend-item"><span class="dot red"></span> Maintenance</span>
        </div>
      </div>

      <div class="map-viewport">
        <!-- City District Outposts -->
        <div class="district-marker district-carmen">Carmen Sector</div>
        <div class="district-marker district-lapasan">Lapasan Sector</div>
        <div class="district-marker district-macasandig">Macasandig Sector</div>
        <div class="district-marker district-bugo">Bugo Terminal</div>

        <!-- Vehicle markers -->
        <button
          v-for="truck in trucks"
          :key="truck.id"
          type="button"
          class="vehicle-pin"
          :class="truck.status.toLowerCase().replace(' ', '-')"
          :style="truck.position"
          @click="selectTruck(truck)"
          :title="`${truck.id} • ${truck.driver}`"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pin-svg">
            <rect x="1" y="3" width="15" height="13"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          <span class="pin-label font-mono">{{ truck.id }}</span>
        </button>

        <!-- Selected Vehicle Inspection Card -->
        <div v-if="selectedTruck" class="vehicle-inspector">
          <div class="inspector-header">
            <div>
              <span class="inspector-kicker">VEHICLE DETAILS</span>
              <h3 class="inspector-id font-mono">{{ selectedTruck.id }}</h3>
            </div>
            <button class="inspector-close" @click="selectedTruck = null">✕</button>
          </div>

          <div class="inspector-grid">
            <div class="inspector-item">
              <span class="item-label">Plate Number</span>
              <strong class="item-val font-mono">{{ selectedTruck.plate }}</strong>
            </div>
            <div class="inspector-item">
              <span class="item-label">Driver / Operator</span>
              <strong class="item-val">{{ selectedTruck.driver }}</strong>
            </div>
            <div class="inspector-item">
              <span class="item-label">Assigned Sector</span>
              <strong class="item-val">Brgy. {{ selectedTruck.barangay }}</strong>
            </div>
            <div class="inspector-item">
              <span class="item-label">Operational Status</span>
              <strong class="item-val font-mono">{{ selectedTruck.status }}</strong>
            </div>
          </div>

          <div class="inspector-footer">
            <button class="btn btn-secondary btn-sm" @click="changeVehicleStatus">
              Cycle Status ({{ selectedTruck.status }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Fleet Inventory Table -->
    <div class="table-card">
      <div class="table-card-header">
        <div>
          <h2 class="panel-title">Active Fleet Inventory</h2>
          <span class="panel-subtitle">Registered dump trucks and compactor units</span>
        </div>

        <div class="table-search">
          <input
            v-model="search"
            type="search"
            placeholder="Search by ID, plate, or driver..."
          />
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>VEHICLE ID</th>
            <th>LICENSE PLATE</th>
            <th>ASSIGNED BARANGAY</th>
            <th>ASSIGNED DRIVER</th>
            <th>STATUS</th>
            <th class="text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="truck in filteredTrucks"
            :key="truck.id"
            class="table-row"
            :class="{ active: selectedTruck && selectedTruck.id === truck.id }"
            @click="selectTruck(truck)"
          >
            <td>
              <span class="id-badge font-mono">{{ truck.id }}</span>
            </td>
            <td>
              <span class="plate-badge font-mono">{{ truck.plate }}</span>
            </td>
            <td>
              <span class="location-text">Brgy. {{ truck.barangay }}</span>
            </td>
            <td>
              <div class="driver-wrap">
                <span class="driver-avatar">{{ getInitials(truck.driver) }}</span>
                <span class="driver-name">{{ truck.driver }}</span>
              </div>
            </td>
            <td>
              <span class="status-badge" :class="statusClass(truck.status)">
                {{ truck.status }}
              </span>
            </td>
            <td class="text-right" @click.stop>
              <button class="action-btn" @click="selectTruck(truck)">
                Inspect
              </button>
            </td>
          </tr>

          <tr v-if="filteredTrucks.length === 0">
            <td colspan="6" class="empty-state">
              No vehicles found matching "{{ search }}".
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Vehicle Modal -->
    <div v-if="showAddForm" class="modal-backdrop" @click.self="closeAddForm">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Register Vehicle / Driver</h3>
          <button class="modal-close" @click="closeAddForm">✕</button>
        </div>

        <form @submit.prevent="addTruck" class="modal-form">
          <div class="form-item">
            <label>Vehicle ID</label>
            <input v-model="newTruck.id" type="text" class="form-input" required />
          </div>

          <div class="form-item">
            <label>License Plate</label>
            <input v-model="newTruck.plate" type="text" class="form-input" required />
          </div>

          <div class="form-item">
            <label>Assigned Barangay</label>
            <select v-model="newTruck.barangay" class="form-input select-input">
              <option>Carmen</option>
              <option>Lapasan</option>
              <option>Macasandig</option>
              <option>Balulang</option>
              <option>Bulua</option>
              <option>Nazareth</option>
            </select>
          </div>

          <div class="form-item">
            <label>Assigned Driver</label>
            <input v-model="newTruck.driver" type="text" placeholder="Driver Full Name" class="form-input" required />
          </div>

          <div class="form-item">
            <label>Initial Status</label>
            <select v-model="newTruck.status" class="form-input select-input">
              <option>In Transit</option>
              <option>Idle</option>
              <option>Maintenance</option>
            </select>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAddForm">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Vehicle</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fleetApi } from '../services/api'

const search = ref('')
const selectedTruck = ref(null)
const showAddForm = ref(false)

const newTruck = ref({
  id: '',
  plate: '',
  barangay: 'Carmen',
  driver: '',
  status: 'Idle'
})

const trucks = ref([
  {
    id: 'TRK-01',
    plate: 'KGA-1024',
    barangay: 'Carmen',
    driver: 'Mario Reyes',
    status: 'In Transit',
    position: { top: '35%', left: '28%' }
  },
  {
    id: 'TRK-02',
    plate: 'KGA-2048',
    barangay: 'Lapasan',
    driver: 'Danilo Cruz',
    status: 'In Transit',
    position: { top: '48%', left: '62%' }
  },
  {
    id: 'TRK-03',
    plate: 'KGA-4096',
    barangay: 'Macasandig',
    driver: 'Roberto Tan',
    status: 'Idle',
    position: { top: '65%', left: '38%' }
  },
  {
    id: 'TRK-04',
    plate: 'KGA-8192',
    barangay: 'Bulua',
    driver: 'Jose Santos',
    status: 'Idle',
    position: { top: '22%', left: '45%' }
  },
  {
    id: 'TRK-05',
    plate: 'KGA-9912',
    barangay: 'Lumbia',
    driver: 'Pedro Flores',
    status: 'Maintenance',
    position: { top: '78%', left: '55%' }
  }
])

async function loadFleet() {
  try {
    const res = await fleetApi.getAll()
    if (res && res.data && res.data.length > 0) {
      trucks.value = res.data.map((t, idx) => ({
        ...t,
        position: t.position || {
          top: `${25 + (idx * 14)}%`,
          left: `${20 + (idx * 15)}%`
        }
      }))
    }
  } catch (err) {
    console.error('Failed to load fleet data:', err)
  }
}

onMounted(() => {
  loadFleet()
})

const fleetStats = computed(() => ({
  inTransit: trucks.value.filter(t => t.status === 'In Transit').length,
  idle: trucks.value.filter(t => t.status === 'Idle').length,
  maintenance: trucks.value.filter(t => t.status === 'Maintenance').length
}))

const filteredTrucks = computed(() => {
  const kw = search.value.toLowerCase().trim()
  if (!kw) return trucks.value

  return trucks.value.filter(t => {
    return [t.id, t.plate, t.barangay, t.driver, t.status].join(' ').toLowerCase().includes(kw)
  })
})

function getInitials(name) {
  if (!name) return 'TR'
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function statusClass(st) {
  return (st || 'idle').toLowerCase().replace(' ', '-')
}

function selectTruck(truck) {
  selectedTruck.value = truck
}

async function changeVehicleStatus() {
  if (!selectedTruck.value) return

  const cycle = {
    'In Transit': 'Idle',
    'Idle': 'Maintenance',
    'Maintenance': 'In Transit'
  }
  const next = cycle[selectedTruck.value.status] || 'In Transit'

  try {
    await fleetApi.update(selectedTruck.value.id, { status: next })
  } catch {}

  selectedTruck.value.status = next
  const found = trucks.value.find(t => t.id === selectedTruck.value.id)
  if (found) found.status = next
}

function openAddForm() {
  newTruck.value = {
    id: `TRK-0${trucks.value.length + 1}`,
    plate: 'KGA-8800',
    barangay: 'Carmen',
    driver: '',
    status: 'Idle'
  }
  showAddForm.value = true
}

function closeAddForm() {
  showAddForm.value = false
}

async function addTruck() {
  const truckPayload = {
    ...newTruck.value,
    position: {
      top: `${Math.floor(25 + Math.random() * 45)}%`,
      left: `${Math.floor(20 + Math.random() * 55)}%`
    }
  }

  try {
    await fleetApi.create(truckPayload)
  } catch {}

  trucks.value.push(truckPayload)
  closeAddForm()
}
</script>

<style scoped>
.fleet-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-main);
}

.page-subtitle {
  margin: 3px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.btn-secondary {
  background-color: var(--bg-surface);
  color: var(--text-main);
  border: 1px solid var(--border-muted);
}

.btn-secondary:hover {
  background-color: var(--bg-surface-elevated);
}

.btn-primary {
  background-color: var(--primary);
  color: #04140a;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
}

.btn-sm {
  padding: 6px 10px;
  font-size: 11px;
}

/* Status Grid */
.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.status-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  font-family: var(--font-mono);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.green { background-color: var(--primary); }
.status-dot.yellow { background-color: var(--status-pending); }
.status-dot.red { background-color: var(--status-urgent); }

.status-val {
  margin: 10px 0 4px;
  font-size: 26px;
  font-weight: 700;
  font-family: var(--font-mono);
}

.text-green { color: var(--primary); }
.text-yellow { color: var(--status-pending); }
.text-red { color: var(--status-urgent); }

.status-sub {
  font-size: 11px;
  color: var(--text-muted);
}

/* Map Card */
.map-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 18px 20px;
}

.map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.panel-subtitle {
  font-size: 11px;
  color: var(--text-secondary);
}

.map-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 11px;
  color: var(--text-secondary);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-item .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.legend-item .dot.green { background-color: var(--primary); }
.legend-item .dot.yellow { background-color: var(--status-pending); }
.legend-item .dot.red { background-color: var(--status-urgent); }

.map-viewport {
  position: relative;
  height: 340px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  overflow: hidden;
  background-image: 
    linear-gradient(var(--border-subtle) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px);
  background-size: 40px 40px;
}

.district-marker {
  position: absolute;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.district-carmen { top: 25%; left: 15%; }
.district-lapasan { top: 40%; left: 70%; }
.district-macasandig { top: 75%; left: 25%; }
.district-bugo { top: 15%; left: 75%; }

.vehicle-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--border-muted);
  background-color: var(--bg-card);
  transition: transform 0.15s ease;
}

.vehicle-pin:hover {
  transform: translate(-50%, -50%) scale(1.1);
  z-index: 50;
}

.vehicle-pin.in-transit {
  border-color: var(--primary);
  color: var(--primary);
}

.vehicle-pin.idle {
  border-color: var(--status-pending);
  color: var(--status-pending);
}

.vehicle-pin.maintenance {
  border-color: var(--status-urgent);
  color: var(--status-urgent);
}

.pin-svg {
  width: 14px;
  height: 14px;
}

.pin-label {
  font-size: 10px;
  font-weight: 700;
}

/* Inspector */
.vehicle-inspector {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 260px;
  background-color: var(--bg-card);
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  padding: 14px;
  box-shadow: var(--shadow-md);
  z-index: 100;
}

.inspector-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.inspector-kicker {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.inspector-id {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.inspector-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
}

.inspector-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11px;
}

.inspector-item {
  display: flex;
  justify-content: space-between;
}

.item-label { color: var(--text-muted); }
.item-val { color: var(--text-main); }

.inspector-footer {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
}

/* Inventory Table */
.table-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
}

.table-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.table-search input {
  background-color: var(--bg-input);
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--text-main);
  font-size: 12px;
  width: 260px;
  outline: none;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.data-table th {
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  padding: 10px 16px;
  font-family: var(--font-mono);
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-main);
}

.table-row {
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.table-row:hover {
  background-color: var(--bg-card-hover);
}

.id-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-sage);
}

.plate-badge {
  font-size: 11px;
  color: var(--text-secondary);
}

.location-text {
  font-size: 12px;
  font-weight: 600;
}

.driver-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.driver-avatar {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: var(--bg-surface-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--accent-sage);
}

.driver-name {
  font-size: 12px;
}

.status-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-mono);
}

.status-badge.in-transit {
  background-color: var(--status-resolved-bg);
  color: var(--status-resolved);
}

.status-badge.idle {
  background-color: var(--status-pending-bg);
  color: var(--status-pending);
}

.status-badge.maintenance {
  background-color: var(--status-urgent-bg);
  color: var(--status-urgent);
}

.action-btn {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-muted);
  color: var(--text-main);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.action-btn:hover {
  background-color: var(--bg-surface-elevated);
}

.text-right {
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 30px !important;
  color: var(--text-muted);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-card {
  width: 100%;
  max-width: 440px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: 8px;
  padding: 24px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-item label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-input {
  background-color: var(--bg-input);
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  color: var(--text-main);
  font-size: 13px;
  padding: 8px 10px;
  outline: none;
}

.form-input:focus {
  border-color: var(--primary);
}

.modal-footer {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>