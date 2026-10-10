<template>
  <div class="reports-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Civic Analytics & Operational Reports</h1>
        <p class="page-subtitle">Turnaround benchmarks, district density distribution, and resolution performance for CLENRO.</p>
      </div>

      <button type="button" class="btn btn-primary" @click="generateReport">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>Export Audit Report (PDF)</span>
      </button>
    </div>

    <!-- Top KPI Cards -->
    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">AUDITED INCIDENT VOLUME</span>
        <div class="metric-val">{{ reportStats.totalReports }}</div>
        <span class="metric-sub">Reports filed by citizens</span>
      </div>

      <div class="metric-card">
        <span class="metric-label">AVERAGE TURNAROUND</span>
        <div class="metric-val text-blue">{{ reportStats.avgResponse }} <span class="unit-text">hrs</span></div>
        <span class="metric-sub">Average time to vehicle dispatch</span>
      </div>

      <div class="metric-card">
        <span class="metric-label">CLEARANCE RATE</span>
        <div class="metric-val text-green">{{ reportStats.resolutionRate }}</div>
        <span class="metric-sub">{{ reportStats.resolvedCount }} of {{ reportStats.totalCount }} tickets resolved</span>
      </div>
    </div>

    <!-- Charts Split -->
    <div class="charts-split">
      <!-- Barangay Distribution Bar Chart -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Reports Distribution by Barangay</h2>
            <span class="panel-subtitle">Urban district report density</span>
          </div>
        </div>

        <div class="bar-chart-container">
          <div
            v-for="item in barangayReports"
            :key="item.name"
            class="bar-group"
          >
            <span class="bar-value font-mono">{{ item.value }}</span>
            <div class="bar-slot">
              <div
                class="bar-fill"
                :style="{ height: `${Math.max(16, item.height)}%` }"
              ></div>
            </div>
            <span class="bar-label">Brgy. {{ item.name }}</span>
          </div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Incident Category Breakdown</h2>
            <span class="panel-subtitle">Classification of resident reports</span>
          </div>
        </div>

        <div class="category-list">
          <div
            v-for="cat in categories"
            :key="cat.name"
            class="category-item"
          >
            <div class="category-info">
              <span class="category-name">{{ cat.name }}</span>
              <span class="category-percent font-mono">{{ cat.percent }}%</span>
            </div>
            <div class="category-bar-bg">
              <div class="category-bar-fill" :style="{ width: `${cat.percent}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline Speed Curve -->
    <div class="panel-card">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Daily Response Speed Curve (Past 7 Days)</h2>
          <span class="panel-subtitle">Average hours elapsed from citizen submission to truck arrival</span>
        </div>
      </div>

      <div class="timeline-chart-wrap">
        <svg viewBox="0 0 700 240" class="timeline-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
            </linearGradient>
          </defs>

          <!-- Grid Lines -->
          <line x1="0" y1="40" x2="700" y2="40" stroke="rgba(255,255,255,0.05)" />
          <line x1="0" y1="100" x2="700" y2="100" stroke="rgba(255,255,255,0.05)" />
          <line x1="0" y1="160" x2="700" y2="160" stroke="rgba(255,255,255,0.05)" />
          <line x1="0" y1="220" x2="700" y2="220" stroke="rgba(255,255,255,0.05)" />

          <!-- Area -->
          <polygon :points="areaPoints" fill="url(#areaGradient)" />

          <!-- Line -->
          <polyline
            :points="linePoints"
            fill="none"
            stroke="#10b981"
            stroke-width="2"
            stroke-linecap="round"
          />

          <!-- Dots -->
          <circle
            v-for="p in chartPoints"
            :key="p.label"
            :cx="p.x"
            :cy="p.y"
            r="4"
            fill="#121c15"
            stroke="#10b981"
            stroke-width="2"
          />
        </svg>

        <div class="x-axis-row font-mono">
          <span v-for="p in chartPoints" :key="p.label">{{ p.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { dashboardApi } from '../services/api'

const reportStats = ref({
  totalReports: '6',
  avgResponse: '3.8',
  resolutionRate: '83.3%',
  resolvedCount: 5,
  totalCount: 6
})

const barangayReports = ref([
  { name: 'Carmen', value: 3, height: 100 },
  { name: 'Lapasan', value: 2, height: 66 },
  { name: 'Macasandig', value: 2, height: 66 },
  { name: 'Balulang', value: 1, height: 33 },
  { name: 'Lumbia', value: 1, height: 33 }
])

const categories = [
  { name: 'Waste Collection', percent: 45 },
  { name: 'Illegal Dump Site', percent: 30 },
  { name: 'Overflowing Bin', percent: 15 },
  { name: 'Road & Drainage Waste', percent: 10 }
]

const responseTimes = [
  { label: 'Mon', value: 3.4 },
  { label: 'Tue', value: 4.1 },
  { label: 'Wed', value: 3.8 },
  { label: 'Thu', value: 2.9 },
  { label: 'Fri', value: 3.5 },
  { label: 'Sat', value: 4.2 },
  { label: 'Sun', value: 3.1 }
]

const chartPoints = computed(() => {
  const width = 700
  const height = 200
  const maxVal = 6
  const step = width / (responseTimes.length - 1)

  return responseTimes.map((item, index) => {
    const x = Math.round(index * step)
    const y = Math.round(height - (item.value / maxVal) * height) + 15
    return { ...item, x, y }
  })
})

const linePoints = computed(() => chartPoints.value.map(p => `${p.x},${p.y}`).join(' '))

const areaPoints = computed(() => {
  if (!chartPoints.value.length) return ''
  const last = chartPoints.value[chartPoints.value.length - 1]
  return `0,220 ${linePoints.value} ${last.x},220`
})

async function loadAnalytics() {
  try {
    const res = await dashboardApi.getStats()
    if (res && res.data) {
      const d = res.data
      reportStats.value = {
        totalReports: String(d.totalTickets || 6),
        avgResponse: '3.8',
        resolutionRate: `${d.resolutionRate || 83.3}%`,
        resolvedCount: d.resolved || 5,
        totalCount: d.totalTickets || 6
      }

      if (d.barangayStats && d.barangayStats.length > 0) {
        const maxVal = Math.max(...d.barangayStats.map(b => b.count || 1), 1)
        barangayReports.value = d.barangayStats.slice(0, 5).map(b => ({
          name: b.name,
          value: b.count,
          height: Math.round((b.count / maxVal) * 100)
        }))
      }
    }
  } catch {}
}

function generateReport() {
  window.print()
}

onMounted(() => {
  loadAnalytics()
})
</script>

<style scoped>
.reports-container {
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
  grid-template-columns: repeat(3, 1fr);
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

.text-blue { color: var(--accent-sage); }
.text-green { color: var(--primary); }

.unit-text {
  font-size: 14px;
  color: var(--text-muted);
}

.metric-sub {
  font-size: 11px;
  color: var(--text-muted);
}

/* Split */
.charts-split {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
}

.panel-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 18px 20px;
}

.panel-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
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

/* Bar Chart */
.bar-chart-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 200px;
  padding: 10px 14px 0;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  max-width: 60px;
  height: 100%;
}

.bar-value {
  font-size: 11px;
  color: var(--text-secondary);
}

.bar-slot {
  flex: 1;
  width: 24px;
  background-color: var(--bg-surface);
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background-color: var(--primary);
  border-radius: 4px;
  transition: height 0.3s ease;
}

.bar-label {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

/* Category List */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.category-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.category-name {
  color: var(--text-main);
}

.category-percent {
  color: var(--text-muted);
}

.category-bar-bg {
  height: 6px;
  background-color: var(--bg-surface);
  border-radius: 4px;
  overflow: hidden;
}

.category-bar-fill {
  height: 100%;
  background-color: var(--primary);
  border-radius: 4px;
}

/* Timeline */
.timeline-chart-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-svg {
  width: 100%;
  height: 160px;
}

.x-axis-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
  padding: 0 4px;
}
</style>