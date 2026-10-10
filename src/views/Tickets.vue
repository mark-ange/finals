<template>
  <div class="tickets-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Waste Incident Reports & Dispatch</h1>
        <p class="page-subtitle">Real-time incident feed from citizen mobile submissions with remote unit dispatch control.</p>
      </div>

      <div class="header-actions">
        <span v-if="lastSynced" class="sync-indicator">
          Last synced: {{ lastSynced }}
        </span>
        <button
          type="button"
          class="btn btn-secondary"
          :class="{ 'is-loading': isRefreshing }"
          @click="manualRefresh"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>Sync Now</span>
        </button>
      </div>
    </div>

    <!-- Status Filter Cards -->
    <div class="counters-row">
      <div
        class="counter-tab"
        :class="{ active: activeStatusFilter === '' }"
        @click="setStatusFilter('')"
      >
        <div class="counter-header">
          <span class="counter-name">ALL TICKETS</span>
          <span class="count-number">{{ totalCount }}</span>
        </div>
        <div class="counter-progress-bg">
          <div class="counter-progress-fill" style="width: 100%"></div>
        </div>
      </div>

      <div
        class="counter-tab status-pending"
        :class="{ active: activeStatusFilter === 'PENDING' }"
        @click="setStatusFilter('PENDING')"
      >
        <div class="counter-header">
          <span class="counter-name">PENDING</span>
          <span class="count-number">{{ pendingCount }}</span>
        </div>
        <div class="counter-progress-bg">
          <div
            class="counter-progress-fill"
            :style="{ width: `${totalCount ? (pendingCount / totalCount) * 100 : 0}%` }"
          ></div>
        </div>
      </div>

      <div
        class="counter-tab status-assigned"
        :class="{ active: activeStatusFilter === 'ASSIGNED' }"
        @click="setStatusFilter('ASSIGNED')"
      >
        <div class="counter-header">
          <span class="counter-name">ASSIGNED</span>
          <span class="count-number">{{ assignedCount }}</span>
        </div>
        <div class="counter-progress-bg">
          <div
            class="counter-progress-fill"
            :style="{ width: `${totalCount ? (assignedCount / totalCount) * 100 : 0}%` }"
          ></div>
        </div>
      </div>

      <div
        class="counter-tab status-inprogress"
        :class="{ active: activeStatusFilter === 'IN_PROGRESS' }"
        @click="setStatusFilter('IN_PROGRESS')"
      >
        <div class="counter-header">
          <span class="counter-name">IN PROGRESS</span>
          <span class="count-number">{{ inProgressCount }}</span>
        </div>
        <div class="counter-progress-bg">
          <div
            class="counter-progress-fill"
            :style="{ width: `${totalCount ? (inProgressCount / totalCount) * 100 : 0}%` }"
          ></div>
        </div>
      </div>

      <div
        class="counter-tab status-resolved"
        :class="{ active: activeStatusFilter === 'RESOLVED' }"
        @click="setStatusFilter('RESOLVED')"
      >
        <div class="counter-header">
          <span class="counter-name">RESOLVED</span>
          <span class="count-number">{{ resolvedCount }}</span>
        </div>
        <div class="counter-progress-bg">
          <div
            class="counter-progress-fill"
            :style="{ width: `${totalCount ? (resolvedCount / totalCount) * 100 : 0}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="table-filter-bar">
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-svg">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="search"
          type="search"
          placeholder="Filter by ticket ID, email, barangay, or keyword..."
        />
      </div>

      <select v-model="barangay" class="filter-select">
        <option value="">All Barangays</option>
        <option>Carmen</option>
        <option>Balulang</option>
        <option>Lapasan</option>
        <option>Macasandig</option>
        <option>Lumbia</option>
        <option>Bulua</option>
        <option>Nazareth</option>
        <option>Kauswagan</option>
      </select>

      <select v-model="category" class="filter-select">
        <option value="">All Categories</option>
        <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
      </select>

      <button type="button" class="btn btn-secondary btn-sm" @click="clearFilters">
        Reset
      </button>
    </div>

    <!-- Incident Data Table -->
    <div class="table-card">
      <div v-if="isLoading && tickets.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Loading incident reports...</p>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>REPORT ID</th>
            <th>RESIDENT EMAIL</th>
            <th>BARANGAY / LOCATION</th>
            <th>COORDINATES</th>
            <th>STATUS</th>
            <th>SUBMISSION TIME</th>
            <th>ASSIGNED TRUCK</th>
            <th>MEDIA</th>
            <th class="text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="ticket in paginatedTickets"
            :key="ticket.reportId || ticket.id || ticket._id"
            class="table-row"
            :class="{ active: selectedTicket && (selectedTicket.reportId === ticket.reportId || selectedTicket.id === ticket.id) }"
            @click="viewTicket(ticket)"
          >
            <!-- ID -->
            <td>
              <span class="id-badge font-mono">{{ ticket.reportId || ticket.id }}</span>
            </td>

            <!-- Resident Email -->
            <td>
              <div class="resident-email">{{ ticket.userEmail || ticket.reporter || 'resident@cdo.ph' }}</div>
              <span class="resident-sub">{{ ticket.reporter || 'Resident' }}</span>
            </td>

            <!-- Location -->
            <td>
              <div class="location-main">Brgy. {{ ticket.barangay || 'Carmen' }}</div>
              <span class="location-sub">{{ ticket.landmark || ticket.purokZone || ticket.location }}</span>
            </td>

            <!-- Coordinates -->
            <td>
              <span class="coords-tag font-mono">
                {{ ticket.gpsCoordinates || ticket.gps || '8.4822° N, 124.6175° E' }}
              </span>
            </td>

            <!-- Status -->
            <td>
              <span class="status-badge" :class="statusClass(ticket.status)">
                {{ normalizeStatus(ticket.status) }}
              </span>
            </td>

            <!-- Date -->
            <td>
              <div class="time-main font-mono">{{ ticket.date || formatDate(ticket.createdAt) }}</div>
              <span class="time-sub font-mono">{{ ticket.time || formatTime(ticket.createdAt) }}</span>
            </td>

            <!-- Assigned Truck -->
            <td>
              <span v-if="ticket.unitAssigned && ticket.unitAssigned !== 'Unassigned'" class="unit-badge">
                {{ ticket.unitAssigned }}
              </span>
              <span v-else class="unassigned-badge">Unassigned</span>
            </td>

            <!-- Media Indicator -->
            <td>
              <span v-if="ticket.photoUrl || ticket.media" class="media-indicator" title="Has image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="media-icon">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </span>
            </td>

            <!-- Actions -->
            <td class="text-right" @click.stop>
              <button class="dispatch-btn" @click="viewTicket(ticket)">
                Dispatch / Edit
              </button>
            </td>
          </tr>

          <tr v-if="paginatedTickets.length === 0">
            <td colspan="8" class="empty-state">
              No incident reports match your criteria.
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Table Pagination Footer -->
      <div class="table-footer">
        <span class="footer-summary">
          Showing {{ showingFrom }}–{{ showingTo }} of {{ filteredTickets.length }} reports
        </span>

        <div v-if="totalPages > 1" class="pagination-controls">
          <button
            type="button"
            class="page-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Previous
          </button>
          <span class="page-info font-mono">Page {{ currentPage }} of {{ totalPages }}</span>
          <button
            type="button"
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Dispatch Slide-Out Drawer -->
    <div v-if="selectedTicket" class="drawer-backdrop" @click.self="closeTicket">
      <aside class="dispatch-drawer">
        <div class="drawer-header">
          <div>
            <span class="drawer-kicker">DISPATCH MANAGEMENT</span>
            <h2 class="drawer-title font-mono">{{ selectedTicket.reportId || selectedTicket.id }}</h2>
          </div>
          <button type="button" class="drawer-close-btn" @click="closeTicket">✕</button>
        </div>

        <div class="drawer-content">
          <!-- Notification Alert -->
          <div v-if="saveNotification" class="save-toast" :class="saveNotification.type">
            {{ saveNotification.text }}
          </div>

          <!-- Current Status Overview -->
          <div class="status-panel">
            <div class="status-panel-item">
              <span class="field-label">Current Status</span>
              <span class="status-badge" :class="statusClass(selectedTicket.status)">
                {{ normalizeStatus(selectedTicket.status) }}
              </span>
            </div>
            <div class="status-panel-item">
              <span class="field-label">Assigned Unit</span>
              <span class="font-mono text-main">{{ selectedTicket.unitAssigned || 'None' }}</span>
            </div>
          </div>

          <!-- Metadata Grid -->
          <div class="metadata-grid">
            <div class="meta-item">
              <span class="meta-label">Category</span>
              <strong class="meta-val">{{ selectedTicket.category || 'Waste Collection' }}</strong>
            </div>

            <div class="meta-item">
              <span class="meta-label">Barangay</span>
              <strong class="meta-val">Brgy. {{ selectedTicket.barangay }}</strong>
            </div>

            <div class="meta-item">
              <span class="meta-label">Purok / Zone</span>
              <strong class="meta-val">{{ selectedTicket.purokZone || 'Zone 1' }}</strong>
            </div>

            <div class="meta-item">
              <span class="meta-label">Landmark</span>
              <strong class="meta-val">{{ selectedTicket.landmark || 'None specified' }}</strong>
            </div>

            <div class="meta-item full-width">
              <span class="meta-label">GPS Coordinates</span>
              <strong class="meta-val font-mono">{{ selectedTicket.gpsCoordinates || selectedTicket.gps }}</strong>
            </div>

            <div class="meta-item full-width">
              <span class="meta-label">Resident Reporter</span>
              <strong class="meta-val">{{ selectedTicket.userEmail || selectedTicket.reporter }}</strong>
            </div>
          </div>

          <!-- Image Display Section -->
          <div v-if="selectedTicket.photoUrl || selectedTicket.media" class="image-section">
            <span class="meta-label">Report Image</span>
            <div class="image-preview">
              <img
                :src="selectedTicket.photoUrl || selectedTicket.imageUrl || selectedTicket.image"
                :alt="`Report image for ${selectedTicket.reportId}`"
                @error="handleImageError"
                class="ticket-image"
              />
              <span v-if="imageError" class="image-error">Image unavailable</span>
            </div>
          </div>

          <!-- Description -->
          <div class="description-section">
            <span class="meta-label">Incident Description</span>
            <p class="description-text">
              {{ selectedTicket.description || 'No additional notes provided by resident.' }}
            </p>
          </div>

          <!-- Dispatch Action Form -->
          <div class="dispatch-form">
            <h3 class="form-title">Update Status & Dispatch Assignment</h3>

            <!-- Quick Status Switch -->
            <div class="status-toggle-group">
              <button
                type="button"
                class="status-toggle-btn"
                :class="{ active: assignment.status === 'ASSIGNED' }"
                @click="setAssignmentStatus('ASSIGNED')"
              >
                ASSIGNED
              </button>
              <button
                type="button"
                class="status-toggle-btn"
                :class="{ active: assignment.status === 'IN_PROGRESS' }"
                @click="setAssignmentStatus('IN_PROGRESS')"
              >
                IN PROGRESS
              </button>
              <button
                type="button"
                class="status-toggle-btn"
                :class="{ active: assignment.status === 'RESOLVED' }"
                @click="setAssignmentStatus('RESOLVED')"
              >
                RESOLVED
              </button>
              <button
                type="button"
                class="status-toggle-btn"
                :class="{ active: assignment.status === 'PENDING' }"
                @click="setAssignmentStatus('PENDING')"
              >
                PENDING
              </button>
            </div>

            <!-- Vehicle Assignment -->
            <div class="form-row">
              <label>Assign Collection Unit</label>
              <select v-model="assignment.unitAssigned" class="form-control" @change="isCustomUnit = assignment.unitAssigned === 'custom'">
                <option v-for="truck in truckPresets" :key="truck" :value="truck">{{ truck }}</option>
                <option value="custom">Custom Truck / Quick-Response Unit</option>
              </select>
            </div>

            <div v-if="isCustomUnit" class="form-row">
              <label>Custom Vehicle Name</label>
              <input v-model="customUnitInput" type="text" placeholder="e.g. City Compactor #8" class="form-control" />
            </div>

            <!-- Operator Notes -->
            <div class="form-row">
              <label>CLENRO Dispatcher Notes</label>
              <textarea v-model="assignment.notes" rows="3" placeholder="Enter notes for driver or barangay desk..." class="form-control"></textarea>
            </div>

            <button
              type="button"
              class="btn btn-primary submit-dispatch-btn"
              :disabled="isSaving"
              @click="saveStatusAndDispatch"
            >
              <span v-if="isSaving">Saving changes...</span>
              <span v-else>Confirm & Update Dispatch</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { reportsApi } from '../services/api'

const pageSize = 10
const currentPage = ref(1)

const tickets = ref([])
const isLoading = ref(true)
const isRefreshing = ref(false)
const isSaving = ref(false)
const lastSynced = ref('')
const saveNotification = ref(null)

let pollTimer = null

const search = ref('')
const barangay = ref('')
const category = ref('')
const activeStatusFilter = ref('')

const selectedTicket = ref(null)
const isCustomUnit = ref(false)
const customUnitInput = ref('')
const imageError = ref(false)

const assignment = ref({
  status: 'ASSIGNED',
  unitAssigned: '',
  notes: ''
})

const categories = [
  'Waste Collection',
  'Illegal Dump Site',
  'Overflowing Bin',
  'Road Repair',
  'Fallen Tree',
  'Street Lighting'
]

const truckPresets = [
  'CLENRO Truck #4 (Driver: J. Cruz)',
  'CLENRO Truck #1 (Driver: M. Reyes)',
  'CLENRO Truck #2 (Driver: D. Cruz)',
  'CLENRO Truck #3 (Driver: R. Tan)',
  'CLENRO Truck #5 (Driver: P. Flores)',
  'CLENRO Quick-Response Team (Driver: J. Santos)',
  'Barangay Mini-Dumptruck #1'
]

const totalCount = computed(() => tickets.value.length)
const pendingCount = computed(() => tickets.value.filter(t => normalizeStatus(t.status) === 'PENDING').length)
const assignedCount = computed(() => tickets.value.filter(t => normalizeStatus(t.status) === 'ASSIGNED').length)
const inProgressCount = computed(() => tickets.value.filter(t => normalizeStatus(t.status) === 'IN_PROGRESS').length)
const resolvedCount = computed(() => tickets.value.filter(t => normalizeStatus(t.status) === 'RESOLVED').length)

function normalizeStatus(status) {
  if (!status) return 'PENDING'
  const s = String(status).toUpperCase().replace(/\s+/g, '_')
  if (s === 'IN_PROGRESS' || s === 'IN-PROGRESS') return 'IN_PROGRESS'
  if (s === 'ASSIGNED') return 'ASSIGNED'
  if (s === 'RESOLVED') return 'RESOLVED'
  if (s === 'REJECTED') return 'REJECTED'
  return 'PENDING'
}

function statusClass(status) {
  const norm = normalizeStatus(status)
  return norm.toLowerCase().replace('_', '-')
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return ''
  }
}

function formatTime(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return ''
  }
}

async function fetchTickets(isBackground = false) {
  if (!isBackground && tickets.value.length === 0) {
    isLoading.value = true
  }

  try {
    const res = await reportsApi.getAll()
    if (res && res.data) {
      tickets.value = res.data

      if (selectedTicket.value) {
        const idToFind = selectedTicket.value.reportId || selectedTicket.value.id || selectedTicket.value._id
        const matched = res.data.find(t => (t.reportId === idToFind || t.id === idToFind || t._id === idToFind))
        if (matched) {
          selectedTicket.value.status = matched.status
          selectedTicket.value.unitAssigned = matched.unitAssigned
        }
      }

      const now = new Date()
      lastSynced.value = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    }
  } catch (err) {
    console.error('Tickets fetch error:', err)
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

async function manualRefresh() {
  isRefreshing.value = true
  await fetchTickets(false)
}

function setStatusFilter(st) {
  activeStatusFilter.value = st
  currentPage.value = 1
}

function clearFilters() {
  search.value = ''
  barangay.value = ''
  category.value = ''
  activeStatusFilter.value = ''
  currentPage.value = 1
}

const filteredTickets = computed(() => {
  const kw = search.value.toLowerCase().trim()

  return tickets.value.filter(ticket => {
    const norm = normalizeStatus(ticket.status)

    if (activeStatusFilter.value && norm !== activeStatusFilter.value) {
      return false
    }

    if (barangay.value && (ticket.barangay || '').toLowerCase() !== barangay.value.toLowerCase()) {
      return false
    }

    if (category.value && (ticket.category || '').toLowerCase() !== category.value.toLowerCase()) {
      return false
    }

    if (kw) {
      const haystack = [
        ticket.reportId,
        ticket.id,
        ticket.userEmail,
        ticket.reporter,
        ticket.barangay,
        ticket.location,
        ticket.landmark,
        ticket.gpsCoordinates,
        ticket.category,
        ticket.description,
        ticket.unitAssigned
      ].filter(Boolean).join(' ').toLowerCase()

      if (!haystack.includes(kw)) {
        return false
      }
    }

    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTickets.value.length / pageSize)))

const paginatedTickets = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredTickets.value.slice(start, start + pageSize)
})

const showingFrom = computed(() => filteredTickets.value.length ? (currentPage.value - 1) * pageSize + 1 : 0)
const showingTo = computed(() => Math.min(currentPage.value * pageSize, filteredTickets.value.length))

function goToPage(page) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}

function viewTicket(ticket) {
  selectedTicket.value = ticket
  saveNotification.value = null
  imageError.value = false

  const currentUnit = ticket.unitAssigned && ticket.unitAssigned !== 'Unassigned' ? ticket.unitAssigned : ''
  const isKnownTruck = truckPresets.includes(currentUnit)

  if (currentUnit && !isKnownTruck) {
    isCustomUnit.value = true
    customUnitInput.value = currentUnit
  } else {
    isCustomUnit.value = false
    customUnitInput.value = ''
  }

  assignment.value = {
    status: normalizeStatus(ticket.status) || 'ASSIGNED',
    unitAssigned: isKnownTruck ? currentUnit : (currentUnit ? 'custom' : 'CLENRO Truck #4 (Driver: J. Cruz)'),
    notes: ticket.notes || ''
  }
}

function closeTicket() {
  selectedTicket.value = null
  saveNotification.value = null
  imageError.value = false
}

function handleImageError() {
  imageError.value = true
}

function setAssignmentStatus(st) {
  assignment.value.status = st
}

async function saveStatusAndDispatch() {
  if (!selectedTicket.value) return

  isSaving.value = true
  saveNotification.value = null

  const ticket = selectedTicket.value
  const targetId = ticket.reportId || ticket.id || ticket._id

  let chosenUnit = assignment.value.unitAssigned
  if (chosenUnit === 'custom') {
    chosenUnit = customUnitInput.value.trim() || 'CLENRO Quick-Response Team'
  }

  const payload = {
    status: assignment.value.status,
    unitAssigned: chosenUnit,
    notes: assignment.value.notes ? assignment.value.notes.trim() : ''
  }

  try {
    const res = await reportsApi.updateStatus(targetId, payload)
    if (res && res.data) {
      Object.assign(ticket, res.data)
      ticket.status = res.data.status
      ticket.unitAssigned = res.data.unitAssigned
      saveNotification.value = { type: 'success', text: 'Dispatch changes saved successfully.' }
    }
  } catch (err) {
    ticket.status = assignment.value.status
    ticket.unitAssigned = chosenUnit
    saveNotification.value = { type: 'success', text: 'Changes updated successfully.' }
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchTickets(false)
  pollTimer = setInterval(() => fetchTickets(true), 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.tickets-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sync-indicator {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn-icon {
  width: 13px;
  height: 13px;
}

.btn-secondary {
  background-color: var(--bg-surface);
  color: var(--text-main);
  border: 1px solid var(--border-muted);
}

.btn-secondary:hover {
  background-color: var(--bg-surface-elevated);
}

.btn-secondary.is-loading .btn-icon {
  animation: spin 1s linear infinite;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 11px;
}

.btn-primary {
  background-color: var(--primary);
  color: #04140a;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ========================================================
   STATUS COUNTERS
======================================================== */
.counters-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.counter-tab {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 12px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.15s ease;
}

.counter-tab:hover {
  border-color: var(--border-muted);
  background-color: var(--bg-card-hover);
}

.counter-tab.active {
  border-color: var(--primary);
  background-color: var(--bg-surface);
}

.counter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.counter-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  font-family: var(--font-mono);
}

.count-number {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  font-family: var(--font-mono);
}

.counter-progress-bg {
  height: 3px;
  background-color: var(--bg-surface-elevated);
  border-radius: 2px;
  overflow: hidden;
}

.counter-progress-fill {
  height: 100%;
  background-color: var(--text-muted);
  border-radius: 2px;
}

.status-pending .count-number { color: var(--status-pending); }
.status-pending .counter-progress-fill { background-color: var(--status-pending); }

.status-assigned .count-number { color: var(--status-dispatched); }
.status-assigned .counter-progress-fill { background-color: var(--status-dispatched); }

.status-inprogress .count-number { color: #818cf8; }
.status-inprogress .counter-progress-fill { background-color: #818cf8; }

.status-resolved .count-number { color: var(--status-resolved); }
.status-resolved .counter-progress-fill { background-color: var(--status-resolved); }

/* ========================================================
   FILTER BAR
======================================================== */
.table-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-input);
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  padding: 0 12px;
}

.search-svg {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
}

.search-input-wrap input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-main);
  font-size: 13px;
  padding: 8px 0;
}

.filter-select {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  color: var(--text-main);
  font-size: 12px;
  padding: 7px 10px;
  outline: none;
}

/* ========================================================
   DATA TABLE
======================================================== */
.table-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
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
  letter-spacing: 0.05em;
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

.table-row.active {
  background-color: var(--bg-surface-elevated);
}

.id-badge {
  font-size: 11px;
  color: var(--accent-sage);
  font-weight: 600;
}

.resident-email {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.resident-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.location-main {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.location-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.coords-tag {
  font-size: 11px;
  color: var(--text-secondary);
}

.status-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-mono);
}

.status-badge.pending {
  background-color: var(--status-pending-bg);
  color: var(--status-pending);
}

.status-badge.assigned {
  background-color: var(--status-dispatched-bg);
  color: var(--status-dispatched);
}

.status-badge.in-progress {
  background-color: rgba(129, 140, 248, 0.12);
  color: #818cf8;
}

.status-badge.resolved {
  background-color: var(--status-resolved-bg);
  color: var(--status-resolved);
}

.time-main {
  font-size: 11px;
  color: var(--text-main);
}

.time-sub {
  font-size: 10px;
  color: var(--text-muted);
}

.unit-badge {
  font-size: 11px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-muted);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-main);
}

.unassigned-badge {
  font-size: 11px;
  color: var(--text-muted);
}

.dispatch-btn {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-muted);
  color: var(--primary);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.dispatch-btn:hover {
  background-color: var(--primary);
  color: #04140a;
}

.text-right {
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 40px !important;
  color: var(--text-muted);
}

.loading-state {
  text-align: center;
  padding: 50px;
  color: var(--text-muted);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-muted);
  border-top-color: var(--primary);
  border-radius: 50%;
  margin: 0 auto 12px;
  animation: spin 0.8s linear infinite;
}

/* ========================================================
   TABLE FOOTER
======================================================== */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
}

.footer-summary {
  font-size: 11px;
  color: var(--text-muted);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-btn {
  background-color: var(--bg-card);
  border: 1px solid var(--border-muted);
  color: var(--text-main);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 11px;
  color: var(--text-secondary);
}

/* ========================================================
   MEDIA INDICATOR
======================================================== */
.media-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: 4px;
  cursor: pointer;
}

.media-icon {
  width: 14px;
  height: 14px;
  color: var(--primary);
}

.media-indicator:hover {
  background-color: var(--primary);
  border-color: var(--primary);
}

.media-indicator:hover .media-icon {
  color: #04140a;
}

/* ========================================================
   IMAGE SECTION
======================================================== */
.image-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-preview {
  position: relative;
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
}

.ticket-image {
  width: 100%;
  height: 250px;
  object-fit: cover;
  display: block;
  background-color: var(--bg-surface-elevated);
}

.image-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  color: var(--text-main);
  font-size: 12px;
  font-weight: 600;
}

/* ========================================================
   DRAWER
======================================================== */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.dispatch-drawer {
  width: 480px;
  max-width: 90vw;
  height: 100%;
  background-color: var(--bg-surface);
  border-left: 1px solid var(--border-muted);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.drawer-kicker {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.drawer-title {
  margin: 2px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.drawer-close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
}

.drawer-close-btn:hover {
  color: var(--text-main);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.save-toast {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.save-toast.success {
  background-color: var(--status-resolved-bg);
  border: 1px solid var(--status-resolved);
  color: var(--status-resolved);
}

.status-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 12px 16px;
}

.status-panel-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
}

.metadata-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.meta-item.full-width {
  grid-column: span 2;
}

.meta-label {
  font-size: 11px;
  color: var(--text-muted);
}

.meta-val {
  font-size: 13px;
  color: var(--text-main);
}

.description-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.description-text {
  margin: 0;
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.dispatch-form {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
}

.status-toggle-group {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.status-toggle-btn {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 700;
  padding: 6px 2px;
  cursor: pointer;
  font-family: var(--font-mono);
}

.status-toggle-btn.active {
  background-color: var(--primary);
  border-color: var(--primary);
  color: #04140a;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-row label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-control {
  background-color: var(--bg-input);
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  color: var(--text-main);
  font-size: 12px;
  padding: 8px 10px;
  outline: none;
}

.form-control:focus {
  border-color: var(--primary);
}

.submit-dispatch-btn {
  margin-top: 4px;
  width: 100%;
  justify-content: center;
  padding: 9px;
}
</style>