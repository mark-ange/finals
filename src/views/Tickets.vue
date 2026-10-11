<template>
  <div class="tickets-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Waste Incident Reports & Dispatch</h1>
        <p class="page-subtitle">Real-time incident feed from citizen mobile submissions with remote unit dispatch control.</p>
        <p v-if="reportsError" class="text-red" role="alert">{{ reportsError }}</p>
        <p v-if="barangaysError" class="text-red" role="alert">{{ barangaysError }}</p>
        <p v-if="fleetError" class="text-red" role="alert">{{ fleetError }}</p>
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

      <div
        class="counter-tab status-rejected"
        :class="{ active: activeStatusFilter === 'REJECTED' }"
        @click="setStatusFilter('REJECTED')"
      >
        <div class="counter-header">
          <span class="counter-name">REJECTED</span>
          <span class="count-number">{{ rejectedCount }}</span>
        </div>
        <div class="counter-progress-bg">
          <div
            class="counter-progress-fill"
            :style="{ width: `${totalCount ? (rejectedCount / totalCount) * 100 : 0}%` }"
          ></div>
        </div>
      </div>
    </div>
    <p v-if="activeStatusFilter || search || barangay || category" class="filter-summary">
      {{ filteredTotalCount }} {{ filteredTotalCount === 1 ? 'report' : 'reports' }} match the current filters.
    </p>

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
        <option v-for="item in barangayOptions" :key="item._id" :value="item.name">{{ item.name }}</option>
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
              <div class="location-main">Brgy. {{ ticket.barangay || 'Unknown' }}</div>
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
          Showing {{ showingFrom }}–{{ showingTo }} of {{ filteredTotalCount }} {{ filteredTotalCount === 1 ? 'report' : 'reports' }}
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
          <template v-if="selectedTicket.photoUrl || selectedTicket.imageUrl || selectedTicket.image">
            <div class="image-section">
              <div class="image-section-header">
                <span class="meta-label">Citizen Photo Evidence</span>
                <button
                  v-if="!imageError"
                  type="button"
                  class="view-full-btn"
                  @click="openLightbox(selectedTicket.photoUrl || selectedTicket.imageUrl || selectedTicket.image)"
                >
                  🔍 Click to Enlarge
                </button>
              </div>
              <div
                class="image-preview"
                :class="{ 'has-zoom': !imageError }"
                @click="openLightbox(selectedTicket.photoUrl || selectedTicket.imageUrl || selectedTicket.image)"
              >
                <img
                  :src="selectedTicket.photoUrl || selectedTicket.imageUrl || selectedTicket.image"
                  :alt="`Report image for ${selectedTicket.reportId}`"
                  @error="handleImageError"
                  class="ticket-image"
                />
                <span v-if="imageError" class="image-error">Image unavailable</span>
                <div v-if="!imageError" class="image-hover-overlay">
                  <span>🔍 Click to View Full Resolution</span>
                </div>
              </div>
            </div>
          </template>
          <p v-else-if="selectedTicket.media" class="image-error">
            The report is marked as containing evidence, but no photo URL was included with the submission.
          </p>

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
              <button
                type="button"
                class="status-toggle-btn status-btn-rejected"
                :class="{ active: assignment.status === 'REJECTED' }"
                @click="setAssignmentStatus('REJECTED')"
              >
                REJECTED
              </button>
            </div>

            <!-- Vehicle Assignment -->
            <div class="form-row">
              <label>Assign Collection Unit</label>
              <select v-model="assignment.unitAssigned" class="form-control" @change="isCustomUnit = assignment.unitAssigned === 'custom'">
                <option v-for="truck in fleet" :key="truck.id" :value="truck.id">
                  {{ truck.id }} (Driver: {{ truck.driver }}) — {{ truck.status }}
                </option>
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

    <!-- Image Lightbox Modal -->
    <div v-if="lightboxImage" class="lightbox-backdrop" @click="lightboxImage = null">
      <div class="lightbox-modal" @click.stop>
        <div class="lightbox-header">
          <h3>📷 Citizen Incident Evidence Photo</h3>
          <button type="button" class="lightbox-close-btn" @click="lightboxImage = null">✕</button>
        </div>
        <div class="lightbox-body">
          <img :src="lightboxImage" alt="Citizen Photo Evidence" class="lightbox-img" />
        </div>
        <div class="lightbox-footer">
          <a :href="lightboxImage" target="_blank" download="incident-evidence.jpg" class="btn btn-secondary">
            Open in New Tab ↗
          </a>
          <button type="button" class="btn btn-primary" @click="lightboxImage = null">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { barangayApi, fleetApi, reportsApi } from '../services/api'

const pageSize = 10
const currentPage = ref(1)

const tickets = ref([])
const isLoading = ref(true)
const isRefreshing = ref(false)
const isSaving = ref(false)
const reportsError = ref('')
const barangaysError = ref('')
const fleetError = ref('')
const lastSynced = ref('')
const saveNotification = ref(null)

let pollTimer = null
let filterTimer = null
let latestFetchId = 0

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

const fleet = ref([])
const barangayOptions = ref([])
const categories = ref([])
const truckPresets = computed(() => fleet.value.map(truck => truck.id))

const totalCount = ref(0)
const filteredTotalCount = ref(0)
const totalPages = ref(1)
const statusCounts = ref({})
const pendingCount = computed(() => statusCounts.value.PENDING || 0)
const assignedCount = computed(() => statusCounts.value.ASSIGNED || 0)
const inProgressCount = computed(() => statusCounts.value.IN_PROGRESS || 0)
const resolvedCount = computed(() => statusCounts.value.RESOLVED || 0)
const rejectedCount = computed(() => statusCounts.value.REJECTED || 0)

const lightboxImage = ref(null)

function openLightbox(url) {
  if (url && !imageError.value) {
    lightboxImage.value = url
  }
}

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
  const fetchId = ++latestFetchId
  if (!isBackground && tickets.value.length === 0) {
    isLoading.value = true
  }

  try {
    const res = await reportsApi.getAll({
      search: search.value.trim(),
      barangay: barangay.value,
      category: category.value,
      status: activeStatusFilter.value,
      page: currentPage.value,
      limit: pageSize
    })
    if (fetchId !== latestFetchId) return

    if (res && res.data) {
      reportsError.value = ''
      tickets.value = res.data
      totalCount.value = Number(res.total ?? res.count ?? res.data.length)
      filteredTotalCount.value = Number(res.filteredTotal ?? res.total ?? res.count ?? res.data.length)
      totalPages.value = Math.max(1, Number(res.totalPages) || 1)
      statusCounts.value = res.statusCounts || {}
      categories.value = res.categories || [...new Set(res.data.map(ticket => ticket.category).filter(Boolean))]

      if (selectedTicket.value) {
        const idToFind = selectedTicket.value.reportId || selectedTicket.value.id || selectedTicket.value._id
        const matched = res.data.find(t => (t.reportId === idToFind || t.id === idToFind || t._id === idToFind))
        if (matched) {
          Object.assign(selectedTicket.value, matched)
        }
      }

      const now = new Date()
      lastSynced.value = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    }
  } catch (err) {
    if (fetchId !== latestFetchId) return
    console.error('Tickets fetch error:', err)
    reportsError.value = err.message || 'Unable to load incident reports.'
  } finally {
    if (fetchId === latestFetchId) {
      isLoading.value = false
      isRefreshing.value = false
    }
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

const paginatedTickets = computed(() => tickets.value)
const showingFrom = computed(() => totalCount.value ? (currentPage.value - 1) * pageSize + 1 : 0)
const showingTo = computed(() => Math.min((currentPage.value - 1) * pageSize + tickets.value.length, filteredTotalCount.value))

function goToPage(page) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}

function viewTicket(ticket) {
  selectedTicket.value = ticket
  saveNotification.value = null
  imageError.value = false

  const currentUnit = ticket.unitAssigned && ticket.unitAssigned !== 'Unassigned' ? ticket.unitAssigned : ''
  const isKnownTruck = truckPresets.value.includes(currentUnit)

  if (currentUnit && !isKnownTruck) {
    isCustomUnit.value = true
    customUnitInput.value = currentUnit
  } else {
    isCustomUnit.value = false
    customUnitInput.value = ''
  }

  watch([search, barangay, category, activeStatusFilter], () => {
    if (currentPage.value !== 1) {
      currentPage.value = 1
      return
    }
    clearTimeout(filterTimer)
    filterTimer = setTimeout(() => fetchTickets(true), 300)
  })

  watch(currentPage, () => {
    fetchTickets(true)
  })

  assignment.value = {
    status: normalizeStatus(ticket.status) || 'ASSIGNED',
    unitAssigned: isKnownTruck ? currentUnit : (currentUnit ? 'custom' : ''),
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
    chosenUnit = customUnitInput.value.trim()
  }
  if (!chosenUnit) {
    saveNotification.value = { type: 'error', text: 'Select a fleet vehicle or enter a custom unit.' }
    isSaving.value = false
    return
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
    } else {
      throw new Error('The server did not return the updated report.')
    }
  } catch (err) {
    console.error('Failed to save dispatch changes:', err)
    saveNotification.value = { type: 'error', text: err.message || 'Unable to save dispatch changes.' }
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchTickets(false)
  barangayApi.getAll()
    .then(response => {
      barangayOptions.value = response.data || []
      barangaysError.value = ''
    })
    .catch(err => {
      console.error('Failed to load barangay filters:', err)
      barangaysError.value = err.message || 'Unable to load barangay filters.'
    })
  fleetApi.getAll()
    .then(response => {
      fleet.value = response.data || []
      fleetError.value = ''
    })
    .catch(err => {
      console.error('Failed to load fleet assignments:', err)
      fleetError.value = err.message || 'Unable to load fleet assignments.'
    })
  pollTimer = setInterval(() => fetchTickets(true), 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (filterTimer) clearTimeout(filterTimer)
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
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
}

.status-toggle-btn.status-btn-rejected.active {
  background-color: #ef4444;
  border-color: #ef4444;
  color: #ffffff;
}

.counter-tab.status-rejected .count-number {
  color: #ef4444;
}

.counter-tab.status-rejected .counter-progress-fill {
  background-color: #ef4444;
}

.image-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.view-full-btn {
  background: none;
  border: none;
  color: var(--primary, #10b981);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.image-preview {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 8px;
}

.image-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-preview:hover .image-hover-overlay {
  opacity: 1;
}

/* Lightbox Modal */
.lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lightbox-modal {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
}

.lightbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #334155;
  background: #0f172a;
}

.lightbox-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #f8fafc;
}

.lightbox-close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.lightbox-close-btn:hover {
  color: #ffffff;
  background: #334155;
}

.lightbox-body {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #020617;
  max-height: 70vh;
}

.lightbox-img {
  max-width: 100%;
  max-height: 65vh;
  object-fit: contain;
  border-radius: 6px;
}

.lightbox-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid #334155;
  background: #0f172a;
}

.submit-dispatch-btn {
  margin-top: 4px;
  width: 100%;
  justify-content: center;
  padding: 9px;
}
</style>