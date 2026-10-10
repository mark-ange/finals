<template>
  <aside class="sidebar">

    <!-- Brand -->
    <div class="brand">
      <div class="brand-icon">▦</div>
      <span>CityCare Admin</span>
    </div>

    <!-- Navigation -->
<nav class="navigation">

  <router-link
    to="/dashboard"
    class="nav-item"
    active-class="active"
  >
    <span class="icon">▦</span>
    <span>Dashboard</span>
  </router-link>

  <router-link
    to="/tickets"
    class="nav-item"
    active-class="active"
  >
    <span class="icon">▤</span>
    <span>Tickets</span>
  </router-link>

  <router-link
  to="/fleet"
  class="nav-item"
  active-class="active"
>
  <span class="icon">▣</span>
  <span>Fleet</span>
</router-link>

  <router-link
  to="/barangays"
  class="nav-item"
  active-class="active"
>
  <span class="icon">⌖</span>
  <span>Barangays</span>
</router-link>

  <router-link
  to="/reports"
  class="nav-item"
  active-class="active"
>
  <span class="icon">▥</span>
  <span>Reports</span>
</router-link>

</nav>

    <!-- Bottom -->
<router-link
  to="/settings"
  class="nav-item"
  active-class="active"
>
  <span class="icon">⚙</span>
  <span>Settings</span>
</router-link>

  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  height: 100vh;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;

  background: #ffffff;
  border-right: 1px solid #e5e7eb;

  padding: 22px 14px;
}

/* Brand */

.brand {
  display: flex;
  align-items: center;
  gap: 9px;

  padding: 0 10px;
  margin-bottom: 30px;

  color: #173153;
  font-size: 16px;
  font-weight: 700;
}

.brand-icon {
  width: 27px;
  height: 27px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #278c37;
  color: white;

  border-radius: 5px;

  font-size: 15px;
}

/* Navigation */

.navigation {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  width: 100%;
  height: 39px;

  display: flex;
  align-items: center;
  gap: 11px;

  padding: 0 12px;

  border: none;
  border-radius: 5px;

  background: transparent;

  color: #667085;

  font-size: 13px;
  font-weight: 500;

  text-align: left;

  cursor: pointer;
}
.nav-item {
  text-decoration: none;
  box-sizing: border-box;
}

.nav-item:hover {
  background: #f2f7f3;
  color: #278c37;
}

.nav-item.active {
  background: #e9f4eb;
  color: #278c37;
  font-weight: 600;
}

.icon {
  width: 18px;
  text-align: center;
  font-size: 15px;
}

/* Settings */

.settings {
  margin-top: auto;
}
</style>