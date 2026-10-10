<template>
  <div class="barangays-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Municipal Coverage & Barangay Matrix</h1>
        <p class="page-subtitle">Urban district monitoring, weekly garbage collection timetables, and incident density.</p>
      </div>

      <button type="button" class="btn btn-primary" @click="openAddForm">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Add Barangay</span>
      </button>
    </div>

    <!-- Summary Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">COVERED SECTORS</span>
        <div class="metric-val">{{ barangays.length }}</div>
        <span class="metric-sub">Districts monitored in Cagayan de Oro</span>
      </div>

      <div class="metric-card">
        <span class="metric-label">ACTIVE INCIDENTS</span>
        <div class="metric-val text-yellow">{{ activeIncidents }}</div>
        <span class="metric-sub">Pending or currently under collection</span>
      </div>

      <div class="metric-card">
        <span class="metric-label">RESOLVED THIS MONTH</span>
        <div class="metric-val text-green">{{ resolvedIncidents }}</div>
        <span class="metric-sub">Successfully cleared by CLENRO units</span>
      </div>

      <div class="metric-card">
        <span class="metric-label">COLLECTION SCHEDULES</span>
        <div class="metric-val text-blue">{{ schedules.length }}</div>
        <span class="metric-sub">Active municipal route timetables</span>
      </div>
    </div>

    <!-- Coverage Table -->
    <div class="table-card">
      <div class="table-card-header">
        <div>
          <h2 class="panel-title">Barangay Coverage & Weekly Schedules</h2>
          <span class="panel-subtitle">Incident load and dedicated garbage collection trucks</span>
        </div>

        <div class="table-search">
          <input
            v-model="search"
            type="search"
            placeholder="Search by barangay or district..."
          />
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>BARANGAY</th>
            <th>DISTRICT</th>
            <th>ACTIVE REPORTS</th>
            <th>RESOLVED</th>
            <th>COLLECTION SCHEDULE</th>
            <th>ASSIGNED TRUCK</th>
            <th>STATUS</th>
            <th class="text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="b in filteredBarangays"
            :key="b.id || b._id || b.name"
            class="table-row"
            @click="viewBarangay(b)"
          >
            <td>
              <span class="barangay-title">Brgy. {{ b.name }}</span>
            </td>
            <td>
              <span class="district-badge font-mono">{{ b.district }}</span>
            </td>
            <td>
              <span class="active-badge font-mono">{{ b.active || 0 }}</span>
            </td>
            <td>
              <span class="resolved-badge font-mono">{{ b.resolved || 0 }}</span>
            </td>
            <td>
              <div v-if="getBarangaySchedule(b.name)" class="schedule-text">
                <span class="days-text">{{ getBarangaySchedule(b.name).days.join(', ') }}</span>
                <span class="time-text font-mono">{{ getBarangaySchedule(b.name).time }}</span>
              </div>
              <span v-else class="text-muted">Mon, Wed, Fri (Regular)</span>
            </td>
            <td>
              <span v-if="getBarangaySchedule(b.name)" class="truck-pill font-mono">
                {{ getBarangaySchedule(b.name).truck }}
              </span>
              <span v-else class="truck-pill font-mono">CLENRO Truck #1</span>
            </td>
            <td>
              <span class="status-badge active-status">Active</span>
            </td>
            <td class="text-right" @click.stop>
              <button class="action-btn" @click="viewBarangay(b)">
                Inspect
              </button>
            </td>
          </tr>

          <tr v-if="filteredBarangays.length === 0">
            <td colspan="8" class="empty-state">
              No barangays found matching "{{ search }}".
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Barangay Details Drawer / Modal -->
    <div v-if="selectedBarangay" class="modal-backdrop" @click.self="closeBarangay">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <span class="modal-kicker">MUNICIPAL DISTRICT INSPECTION</span>
            <h3 class="modal-title">Brgy. {{ selectedBarangay.name }}</h3>
          </div>
          <button class="modal-close" @click="closeBarangay">✕</button>
        </div>

        <div class="modal-body">
          <div class="details-grid">
            <div class="detail-item">
              <span class="item-label">Congressional District</span>
              <strong class="item-val">{{ selectedBarangay.district }}</strong>
            </div>
            <div class="detail-item">
              <span class="item-label">Active Incident Tickets</span>
              <strong class="item-val text-yellow">{{ selectedBarangay.active || 0 }} reports</strong>
            </div>
            <div class="detail-item">
              <span class="item-label">Resolved Cleanups</span>
              <strong class="item-val text-green">{{ selectedBarangay.resolved || 0 }} completed</strong>
            </div>
            <div class="detail-item">
              <span class="item-label">District Status</span>
              <strong class="item-val">Covered & Active</strong>
            </div>
          </div>

          <div v-if="getBarangaySchedule(selectedBarangay.name)" class="schedule-box">
            <span class="schedule-box-title">Official Collection Timetable</span>
            <div class="schedule-box-row">
              <span>Collection Days:</span>
              <strong>{{ getBarangaySchedule(selectedBarangay.name).days.join(', ') }}</strong>
            </div>
            <div class="schedule-box-row">
              <span>Collection Window:</span>
              <strong>{{ getBarangaySchedule(selectedBarangay.name).time }}</strong>
            </div>
            <div class="schedule-box-row">
              <span>Primary Compactor Unit:</span>
              <strong>{{ getBarangaySchedule(selectedBarangay.name).truck }}</strong>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeBarangay">Close</button>
            <button class="btn btn-primary" @click="goToTicketsForBarangay(selectedBarangay.name)">
              View Barangay Incident Feed
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Sector Modal -->
    <div v-if="showAddForm" class="modal-backdrop" @click.self="closeAddForm">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Register Barangay Sector</h3>
          <button class="modal-close" @click="closeAddForm">✕</button>
        </div>

        <form @submit.prevent="addBarangay" class="modal-form">
          <div class="form-item">
            <label>Barangay Name</label>
            <input v-model="newBarangay.name" type="text" placeholder="e.g. Puntod" class="form-input" required />
          </div>

          <div class="form-item">
            <label>District</label>
            <select v-model="newBarangay.district" class="form-input select-input">
              <option>District 1</option>
              <option>District 2</option>
            </select>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAddForm">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Sector</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { barangayApi, scheduleApi } from '../services/api'

const router = useRouter()

const search = ref('')
const selectedBarangay = ref(null)
const showAddForm = ref(false)
const isLoading = ref(true)

const newBarangay = ref({
  name: '',
  district: 'District 1'
})

const barangays = ref([])
const schedules = ref([])

async function loadBarangays() {
  try {
    isLoading.value = true
    const [bgRes, schRes] = await Promise.all([
      barangayApi.getAll(),
      scheduleApi.getAll().catch(() => ({ data: [] }))
    ])
    if (bgRes && bgRes.data) {
      barangays.value = bgRes.data
    }
    if (schRes && schRes.data) {
      schedules.value = schRes.data
    }
  } catch (err) {
    console.error('Failed to load barangays:', err)
  } finally {
    isLoading.value = false
  }
}

function getBarangaySchedule(name) {
  if (!name) return null
  return schedules.value.find(s => s.barangay.toLowerCase() === name.toLowerCase())
}

onMounted(() => {
  loadBarangays()
})

const activeIncidents = computed(() => barangays.value.reduce((total, b) => total + (b.active || 0), 0))
const resolvedIncidents = computed(() => barangays.value.reduce((total, b) => total + (b.resolved || 0), 0))

const filteredBarangays = computed(() => {
  const kw = search.value.toLowerCase().trim()
  if (!kw) return barangays.value

  return barangays.value.filter(b => {
    return b.name.toLowerCase().includes(kw) || b.district.toLowerCase().includes(kw)
  })
})

function viewBarangay(b) {
  selectedBarangay.value = b
}

function closeBarangay() {
  selectedBarangay.value = null
}

function openAddForm() {
  newBarangay.value = { name: '', district: 'District 1' }
  showAddForm.value = true
}

function closeAddForm() {
  showAddForm.value = false
}

async function addBarangay() {
  if (!newBarangay.value.name.trim()) return

  const payload = {
    name: newBarangay.value.name.trim(),
    district: newBarangay.value.district,
    active: 0,
    resolved: 0,
    total: 0,
    status: 'Active'
  }

  try {
    await barangayApi.create(payload)
  } catch {}

  barangays.value.push(payload)
  closeAddForm()
}

function goToTicketsForBarangay(name) {
  router.push({ path: '/tickets', query: { q: name } })
}
</script>

<style scoped>
.barangays-container {
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

/* Metrics */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  font-family: var(--font-mono);
}

.metric-val {
  margin: 8px 0 4px;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-main);
  font-family: var(--font-mono);
}

.text-yellow { color: var(--status-pending); }
.text-green { color: var(--primary); }
.text-blue { color: var(--accent-sage); }

.metric-sub {
  font-size: 11px;
  color: var(--text-muted);
}

/* Table */
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

.barangay-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.district-badge {
  font-size: 11px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-muted);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-secondary);
}

.active-badge {
  font-size: 12px;
  font-weight: 700;
  color: var(--status-pending);
}

.resolved-badge {
  font-size: 12px;
  font-weight: 700;
  color: var(--primary);
}

.schedule-text {
  display: flex;
  flex-direction: column;
}

.days-text {
  font-size: 12px;
  font-weight: 500;
}

.time-text {
  font-size: 10px;
  color: var(--text-muted);
}

.truck-pill {
  font-size: 11px;
  color: var(--accent-sage);
}

.status-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-mono);
}

.active-status {
  background-color: var(--status-resolved-bg);
  color: var(--status-resolved);
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

/* Modals */
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
  max-width: 460px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: 8px;
  padding: 24px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-kicker {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  font-family: var(--font-mono);
}

.modal-title {
  margin: 2px 0 0;
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

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.item-label {
  font-size: 11px;
  color: var(--text-muted);
}

.item-val {
  font-size: 13px;
  color: var(--text-main);
}

.schedule-box {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}

.schedule-box-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 4px;
}

.schedule-box-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
</style>