<template>
  <div class="app" :data-theme="theme">
    <div v-if="isLoginPage" class="login-container">
      <router-view />
    </div>
    
    <div v-else class="layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <div class="brand">
            <h1>CityCare</h1>
            <span>Waste Management</span>
          </div>
        </div>
        
        <nav class="nav">
          <router-link to="/dashboard" class="nav-item" active-class="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18">
              <rect x="3" y="3" width="7" height="9"/>
              <rect x="14" y="3" width="7" height="5"/>
              <rect x="14" y="12" width="7" height="9"/>
              <rect x="3" y="16" width="7" height="5"/>
            </svg>
            <span>Dashboard</span>
          </router-link>
          
          <router-link to="/tickets" class="nav-item" active-class="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>Incidents</span>
            <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
          </router-link>
          
          <router-link to="/fleet" class="nav-item" active-class="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            </svg>
            <span>Fleet</span>
          </router-link>
          
          <router-link to="/barangays" class="nav-item" active-class="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            </svg>
            <span>Barangays</span>
          </router-link>
          
          <router-link to="/reports" class="nav-item" active-class="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span>Reports</span>
          </router-link>
          
          <router-link to="/settings" class="nav-item" active-class="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span>Settings</span>
          </router-link>
        </nav>
        
        <div class="sidebar-footer">
          <div class="user">
            <div class="user-avatar">{{ userInitials }}</div>
            <div class="user-info">
              <div class="user-name">{{ currentUser.fullName || 'Admin' }}</div>
              <div class="user-role">{{ currentUser.role || 'Administrator' }}</div>
            </div>
          </div>
          <button class="logout" @click="handleLogout" title="Sign Out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main class="main">
        <header class="header">
          <div class="header-left">
            <div class="search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                v-model="searchQuery"
                placeholder="Search barangay, ticket ID, or truck unit..."
                @keyup.enter="handleSearch"
              />
            </div>
          </div>
          <div class="header-right">
            <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
              <svg v-if="theme === 'light'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            </button>
            <div class="time">{{ currentTime }}</div>
            <button class="btn btn-primary" @click="$router.push('/tickets')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>New Incident</span>
            </button>
          </div>
        </header>
        
        <div class="content">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { reportsApi, getCurrentUser } from './services/api'

const route = useRoute()
const router = useRouter()

const isLoginPage = computed(() => route.path === '/login' || route.path === '/')
const searchQuery = ref('')
const pendingCount = ref(0)
const currentTime = ref('')
let clockTimer = null
let pollTimer = null

// Theme management
const theme = ref(localStorage.getItem('theme') || 'dark')

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('theme', theme.value)
  updateHtmlTheme()
}

function updateHtmlTheme() {
  document.documentElement.setAttribute('data-theme', theme.value)
}

// Watch for theme changes
watch(theme, () => {
  updateHtmlTheme()
})

const currentUser = ref({
  fullName: 'Admin',
  role: 'Administrator'
})

const userInitials = computed(() => {
  const name = currentUser.value.fullName || 'Admin'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

function updateClock() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function fetchStats() {
  try {
    const res = await reportsApi.getAll()
    const reports = res.data || []
    pendingCount.value = reports.filter(r => (r.status || '').toUpperCase() === 'PENDING').length
  } catch (err) {
    // Quiet background update
  }
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/tickets', query: { q: searchQuery.value.trim() } })
  }
}

function handleLogout() {
  localStorage.removeItem('citycare_admin_token')
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  const user = getCurrentUser()
  if (user) {
    currentUser.value = { ...currentUser.value, ...user }
  }

  updateClock()
  clockTimer = setInterval(updateClock, 1000)

  fetchStats()
  pollTimer = setInterval(fetchStats, 10000)
  
  updateHtmlTheme()
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.login-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: var(--bg);
}

.layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg);
}

/* Sidebar */
.sidebar {
  width: 240px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.logo {
  width: 36px;
  height: 36px;
  background: var(--primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo svg {
  width: 20px;
  height: 20px;
}

.brand h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.brand span {
  font-size: 11px;
  color: var(--text-muted);
}

.nav {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  color: var(--text-secondary);
  font-size: 13px;
  transition: all 0.15s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: var(--bg-surface);
  color: var(--text-main);
}

.nav-item.active {
  background: var(--primary-subtle);
  color: var(--primary);
  border-left-color: var(--primary);
}

.nav-item svg {
  flex-shrink: 0;
  color: currentColor;
}

.badge {
  background: var(--danger);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 10px;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid var(--border);
}

.user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.user-role {
  font-size: 11px;
  color: var(--text-muted);
}

.logout {
  background: none;
  border: none;
  color: var(--text-muted);
  padding: 6px;
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.logout:hover {
  background: var(--bg-surface);
  color: var(--text-main);
}

.logout svg {
  width: 16px;
  height: 16px;
}

/* Main */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 52px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--bg-sidebar);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-input);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-md);
  padding: 0 12px;
  width: 320px;
  transition: border-color 0.15s ease;
}

.search:focus-within {
  border-color: var(--primary);
}

.search svg {
  color: var(--text-muted);
  width: 14px;
  height: 14px;
}

.search input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-main);
  font-size: 13px;
  padding: 8px 0;
}

.search input::placeholder {
  color: var(--text-dim);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-toggle {
  background: none;
  border: none;
  color: var(--text-muted);
  padding: 6px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.theme-toggle:hover {
  background: var(--bg-surface);
  color: var(--text-main);
}

.theme-toggle svg {
  width: 18px;
  height: 18px;
}

.time {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  padding: 6px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-md);
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-primary svg {
  width: 14px;
  height: 14px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--bg-app);
}
</style>
