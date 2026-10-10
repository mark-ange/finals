<script setup>
const props = defineProps({
  barangayStats: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
  <section class="panel">

    <div class="panel-header">
      <div>
        <h2>City Heatmap</h2>
        <p>Incident density across Cagayan de Oro.</p>
      </div>

      <div class="filters">
        <select>
          <option>All Districts</option>
          <option>District 1</option>
          <option>District 2</option>
          <option>District 3</option>
        </select>
      </div>
    </div>

    <div class="map-area">

      <!-- Temporary map representation -->
      <div class="map-background">

        <div class="map-label label-1">Carmen</div>
        <div class="map-label label-2">Lapasan</div>
        <div class="map-label label-3">Macasandig</div>
        <div class="map-label label-4">Kauswagan</div>

        <div class="heat heat-1"></div>
        <div class="heat heat-2"></div>
        <div class="heat heat-3"></div>
        <div class="heat heat-4"></div>
        <div class="heat heat-5"></div>
        <div class="heat heat-6"></div>

      </div>

      <div class="legend">
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

.filters {
  display: flex;
  gap: 7px;
}

.filters select {
  height: 29px;
  padding: 0 8px;

  border: 1px solid #d0d5dd;
  border-radius: 4px;

  background: white;
  color: #475467;

  font-size: 10px;
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

.heat-1 {
  top: 32%;
  left: 55%;
  background: #e5484d;
}

.heat-2 {
  top: 43%;
  left: 62%;
  background: #f79009;
}

.heat-3 {
  top: 51%;
  left: 48%;
  background: #e5484d;
}

.heat-4 {
  top: 65%;
  left: 67%;
  background: #f79009;
}

.heat-5 {
  top: 25%;
  left: 70%;
  background: #f5c542;
}

.heat-6 {
  top: 58%;
  left: 38%;
  background: #65a30d;
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

.label-1 {
  top: 25%;
  left: 25%;
}

.label-2 {
  top: 40%;
  left: 57%;
}

.label-3 {
  top: 68%;
  left: 65%;
}

.label-4 {
  top: 72%;
  left: 35%;
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