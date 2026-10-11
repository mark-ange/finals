<script setup>
import { computed } from 'vue'

const props = defineProps({
  barangayStats: {
    type: Array,
    default: () => []
  }
})

const positions = [
  { top: '32%', left: '55%', labelTop: '25%', labelLeft: '25%' },
  { top: '43%', left: '62%', labelTop: '40%', labelLeft: '57%' },
  { top: '51%', left: '48%', labelTop: '68%', labelLeft: '65%' },
  { top: '65%', left: '67%', labelTop: '72%', labelLeft: '35%' },
  { top: '25%', left: '70%', labelTop: '18%', labelLeft: '72%' },
  { top: '58%', left: '38%', labelTop: '60%', labelLeft: '15%' }
]

const displayedStats = computed(() => {
  const maximum = Math.max(...props.barangayStats.map(item => item.count || 0), 1)
  return props.barangayStats.slice(0, positions.length).map((item, index) => ({
    ...item,
    position: positions[index],
    color: item.count / maximum >= 0.75 ? '#e5484d' : item.count / maximum >= 0.4 ? '#f79009' : '#65a30d',
    opacity: Math.max(0.25, item.count / maximum)
  }))
})
</script>

<template>
  <section class="panel">

    <div class="panel-header">
      <div>
        <h2>City Heatmap</h2>
        <p>Incident density across Cagayan de Oro.</p>
      </div>

    </div>

    <div class="map-area">
      <div class="map-background">
        <template v-for="item in displayedStats" :key="item.name">
          <div class="map-label" :style="{ top: item.position.labelTop, left: item.position.labelLeft }">
            {{ item.name }}
          </div>
          <div
            class="heat"
            :style="{ top: item.position.top, left: item.position.left, background: item.color, opacity: item.opacity }"
            :title="`${item.count} reports in ${item.name}`"
          ></div>
        </template>
      </div>

      <div v-if="displayedStats.length" class="legend">
        <strong>Incident Density</strong>

        <span>
          <i class="high"></i>
          High
        </span>

        <span>
          <i class="medium"></i>
          Medium
        </span>

        <span>
          <i class="low"></i>
          Low
        </span>
      </div>
      <div v-if="!displayedStats.length" class="map-empty">No report data is available.</div>

    </div>

  </section>
</template>

<style scoped>
.panel {
  background: #ffffff;
  border: 1px solid #e1e6eb;
  border-radius: 7px;
  overflow: hidden;
}

.panel-header {
  min-height: 62px;
  padding: 13px 16px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  border-bottom: 1px solid #edf0f2;
}

.panel-header h2 {
  margin: 0;
  font-size: 14px;
  color: #182230;
}

.panel-header p {
  margin: 4px 0 0;
  font-size: 10px;
  color: #98a2b3;
}

/* Map */

.map-area {
  position: relative;
  height: 330px;
  overflow: hidden;
}

.map-background {
  position: absolute;
  inset: 0;

  background:
    linear-gradient(25deg, transparent 49%, #dfe5e9 50%, transparent 51%),
    linear-gradient(115deg, transparent 49%, #dfe5e9 50%, transparent 51%),
    #eef2f3;
}

/* Fake roads */

.map-background::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 2px;
  top: 48%;
  left: 0;
  background: #d2d9dd;
  transform: rotate(-9deg);
}

.map-background::after {
  content: "";
  position: absolute;
  width: 2px;
  height: 100%;
  top: 0;
  left: 53%;
  background: #d2d9dd;
  transform: rotate(13deg);
}

/* Heat points */

.heat {
  position: absolute;

  width: 45px;
  height: 45px;

  border-radius: 50%;

  opacity: 0.75;

  filter: blur(8px);
}

/* Labels */

.map-label {
  position: absolute;
  z-index: 2;

  padding: 4px 6px;

  background: rgba(255, 255, 255, 0.85);
  border-radius: 3px;

  font-size: 9px;
  color: #475467;
}

.map-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #667085;
  font-size: 12px;
}

/* Legend */

.legend {
  position: absolute;
  bottom: 12px;
  left: 12px;

  display: flex;
  align-items: center;
  gap: 10px;

  padding: 7px 9px;

  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e4e7ec;
  border-radius: 4px;

  font-size: 9px;
  color: #667085;
}

.legend strong {
  color: #344054;
}

.legend span {
  display: flex;
  align-items: center;
  gap: 3px;
}

.legend i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.high {
  background: #e5484d;
}

.medium {
  background: #f79009;
}

.low {
  background: #65a30d;
}
</style>