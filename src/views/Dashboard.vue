<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div>
        <h1>CityCare CDO Dashboard</h1>
        <p>Waste Management & Sanitation Operations</p>
        <p v-if="errorMessage" class="text-red" role="alert">{{ errorMessage }}</p>
      </div>
      
      <div class="header-actions">
        <button class="btn btn-secondary" @click="forceRefresh">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>Refresh</span>
        </button>
        <button class="btn btn-primary" @click="router.push('/tickets')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Report Incident</span>
        </button>
      </div>
    </div>

    <!-- Metrics -->
    <div class="metrics">
      <div class="metric">
        <div class="metric-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="metric-label">Total Incidents</div>
        <div class="metric-value">{{ stats.totalTickets }}</div>
        <div class="metric-trend">All reports</div>
      </div>
      
      <div class="metric warning">
        <div class="metric-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="metric-label">Pending</div>
        <div class="metric-value">{{ stats.pending }}</div>
        <div class="metric-trend">Needs dispatch</div>
      </div>
      
      <div class="metric info">
        <div class="metric-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20">
            <rect x="1" y="3" width="15" height="13"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          </svg>
        </div>
        <div class="metric-label">In Transit</div>
        <div class="metric-value">{{ stats.assigned }}</div>
        <div class="metric-trend">{{ fleetSummary.inTransit }} units active</div>
      </div>
      
      <div class="metric success">
        <div class="metric-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="metric-label">Resolved</div>
        <div class="metric-value">{{ stats.resolved }}</div>
        <div class="metric-trend">Cleared</div>
      </div>
    </div>

    <!-- Content -->
    <div class="content-grid">
      <!-- Left Column -->
      <div class="column">
        <div class="panel">
          <div class="panel-header">
            <h2>Barangay Waste Distribution</h2>
            <button class="link-btn" @click="router.push('/barangays')">View All</button>
          </div>
          
          <div class="barangay-list">
            <div v-for="b in stats.barangayStats" :key="b.name" class="barangay-item">
              <div class="barangay-info">
                <span class="barangay-name">Brgy. {{ b.name }}</span>
                <span class="barangay-count">{{ b.count }} reports</span>
              </div>
              <div class="bar">
                <div class="bar-fill" :style="{ width: `${Math.min(100, b.percentage)}%` }"></div>
              </div>
              <span class="percent">{{ b.percentage }}%</span>
            </div>
            <div v-if="!stats.barangayStats || stats.barangayStats.length === 0" class="empty">
              Loading barangay data...
            </div>
          </div>
        </div>

        <div class="panel" style="margin-top: 16px;">
          <div class="panel-header">
            <h2>Sanitation Fleet</h2>
            <button class="link-btn" @click="router.push('/fleet')">Manage Fleet</button>
          </div>
          
          <div class="fleet-grid">
            <div class="fleet-card">
              <div class="fleet-count">{{ fleetSummary.inTransit }}</div>
              <div class="fleet-label">In Transit</div>
            </div>
            <div class="fleet-card">
              <div class="fleet-count">{{ fleetSummary.idle }}</div>
              <div class="fleet-label">On Standby</div>
            </div>
            <div class="fleet-card">
              <div class="fleet-count">{{ fleetSummary.maintenance }}</div>
              <div class="fleet-label">Maintenance</div>
            </div>
            <div class="fleet-card total">
              <div class="fleet-count">{{ fleetSummary.total }}</div>
              <div class="fleet-label">Total Units</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="column">
        <div class="panel">
          <div class="panel-header">
            <h2>Recent Incidents</h2>
            <button class="link-btn" @click="router.push('/tickets')">View All ({{ stats.liveQueue.length }})</button>
          </div>
          
          <div class="ticket-list">
            <div v-for="item in stats.liveQueue" :key="item.id" class="ticket-item">
              <div class="ticket-header">
                <span class="ticket-id">#{{ item.id }}</span>
                <span class="ticket-status" :class="statusClass(item.status)">
                  {{ normalizeStatus(item.status) }}
                </span>
              </div>
              <div class="ticket-title">{{ item.title }}</div>
              <div class="ticket-location">{{ item.location }}</div>
              <div class="ticket-footer">
                <span class="ticket-time">{{ item.date }}</span>
                <button class="action-btn" @click="router.push('/tickets')">
                  {{ item.status === 'ASSIGNED' ? 'View' : 'Dispatch' }}
                </button>
              </div>
            </div>
            
            <div v-if="!stats.liveQueue || stats.liveQueue.length === 0" class="empty">
              No active incidents
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { dashboardApi } from '../services/api'

const router = useRouter()

const stats = ref({
  totalTickets: 0,
  pending: 0,
  assigned: 0,
  resolved: 0,
  liveQueue: [],
  barangayStats: []
})

const fleetSummary = ref({
  total: 0,
  inTransit: 0,
  idle: 0,
  maintenance: 0
})

const isRefreshing = ref(false)
const errorMessage = ref('')
let pollTimer = null

function normalizeStatus(status) {
  if (!status) return 'PENDING'
  const s = String(status).toUpperCase().replace(/\s+/g, '_')
  if (s === 'IN_PROGRESS' || s === 'IN-PROGRESS') return 'IN_PROGRESS'
  if (s === 'ASSIGNED') return 'ASSIGNED'
  if (s === 'RESOLVED') return 'RESOLVED'
  return 'PENDING'
}

function statusClass(status) {
  const norm = normalizeStatus(status)
  return norm.toLowerCase()
}

async function loadDashboardData() {
  try {
    const dashRes = await dashboardApi.getStats()

    if (dashRes && dashRes.data) {
      errorMessage.value = ''
      stats.value = {
        totalTickets: dashRes.data.totalTickets || 0,
        pending: dashRes.data.pending || 0,
        assigned: dashRes.data.assigned || 0,
        resolved: dashRes.data.resolved || 0,
        liveQueue: dashRes.data.liveQueue || [],
        barangayStats: dashRes.data.barangayStats || []
      }

      fleetSummary.value = {
        total: dashRes.data.fleet?.total || 0,
        inTransit: dashRes.data.fleet?.inTransit || 0,
        idle: dashRes.data.fleet?.idle || 0,
        maintenance: dashRes.data.fleet?.maintenance || 0
      }
    }
  } catch (err) {
    console.error('Failed to load dashboard data:', err)
    errorMessage.value = err.message || 'Unable to load dashboard data.'
  } finally {
    isRefreshing.value = false
  }
}

async function forceRefresh() {
  isRefreshing.value = true
  await loadDashboardData()
}

onMounted(() => {
  loadDashboardData()
  pollTimer = setInterval(loadDashboardData, 8000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
}

.dashboard-header p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary {
  background: var(--bg-surface);
  color: var(--text-main);
  border: 1px solid var(--border-muted);
}

.btn-secondary:hover {
  background: var(--bg-surface-elevated);
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

/* Metrics Grid */
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.metric::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--primary);
}

.metric.warning::before { background: var(--status-pending); }
.metric.info::before { background: var(--status-dispatched); }
.metric.success::before { background: var(--status-resolved); }

.metric-icon {
  width: 36px;
  height: 36px;
  background: var(--primary-subtle);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: var(--primary);
}

.metric.warning .metric-icon { background: var(--status-pending-bg); color: var(--status-pending); }
.metric.info .metric-icon { background: var(--status-dispatched-bg); color: var(--status-dispatched); }
.metric.success .metric-icon { background: var(--status-resolved-bg); color: var(--status-resolved); }

.metric-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  margin: 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main);
}

.metric-trend {
  font-size: 11px;
  color: var(--text-secondary);
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 20px;
}

.column {
  display: flex;
  flex-direction: column;
}

/* Panel */
.panel {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.panel-header h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.link-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.link-btn:hover {
  text-decoration: underline;
}

/* Barangay List */
.barangay-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.barangay-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.barangay-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.barangay-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.barangay-count {
  font-size: 11px;
  color: var(--text-muted);
}

.bar {
  flex: 1;
  height: 6px;
  background: var(--bg-surface);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
}

.percent {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  min-width: 40px;
}

/* Fleet Grid */
.fleet-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.fleet-card {
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  padding: 12px;
  text-align: center;
}

.fleet-card.total {
  background: var(--primary-subtle);
}

.fleet-count {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.fleet-card.total .fleet-count {
  color: var(--primary);
}

.fleet-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Ticket List */
.ticket-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 500px;
  overflow-y: auto;
}

.ticket-item {
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-md);
  padding: 12px;
}

.ticket-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.ticket-id {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.ticket-status {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
}

.ticket-status.pending {
  background: var(--status-pending-bg);
  color: var(--status-pending);
}

.ticket-status.assigned {
  background: var(--status-dispatched-bg);
  color: var(--status-dispatched);
}

.ticket-status.in_progress {
  background: var(--status-dispatched-bg);
  color: var(--status-dispatched);
}

.ticket-status.resolved {
  background: var(--status-resolved-bg);
  color: var(--status-resolved);
}

.ticket-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 4px;
}

.ticket-location {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.ticket-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}

.ticket-time {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.action-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.action-btn:hover {
  text-decoration: underline;
}

.empty {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 12px;
}

@media (max-width: 1024px) {
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .fleet-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
