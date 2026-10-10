<template>
  <div class="stat-card">

    <div class="stat-top">
      <span class="label">{{ label }}</span>
      <span class="indicator" :class="color"></span>
    </div>

    <div class="value">
      {{ value }}
    </div>

    <div class="description">
      {{ description }}
    </div>

  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  description: String,
  color: String
})
</script>

<style scoped>
.stat-card {
  flex: 1;
  min-width: 0;

  background: #ffffff;

  border: 1px solid #e1e6eb;
  border-radius: 7px;

  padding: 15px 17px;

  box-sizing: border-box;
}

.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 10px;
  font-weight: 600;
  color: #667085;
  letter-spacing: 0.3px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.indicator.green {
  background: #2e8b3c;
}

.indicator.yellow {
  background: #f2b72b;
}

.indicator.blue {
  background: #3686d9;
}

.indicator.gray {
  background: #98a2b3;
}

.value {
  margin-top: 8px;

  font-size: 25px;
  line-height: 1;

  font-weight: 700;
  color: #182230;
}

.description {
  margin-top: 8px;

  font-size: 9px;
  color: #98a2b3;
}
</style>