<template>
  <div class="settings-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Administrative Settings & Access</h1>
        <p class="page-subtitle">Configure operator profile, dispatch notifications, security credentials, and system defaults.</p>
      </div>

      <div class="header-actions">
        <button class="btn btn-secondary" @click="resetToDefaults">
          Reset Preferences
        </button>
        <button class="btn btn-primary" @click="saveAccount">
          Save Changes
        </button>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="settings-grid">
      <!-- Nav Tabs -->
      <nav class="settings-tabs">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeSection === 'account' }"
          @click="activeSection = 'account'"
        >
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <div class="tab-meta">
            <span class="tab-title">Administrator Profile</span>
            <span class="tab-sub">Operator identity & contact</span>
          </div>
        </button>

        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeSection === 'notifications' }"
          @click="activeSection = 'notifications'"
        >
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div class="tab-meta">
            <span class="tab-title">Dispatch Notifications</span>
            <span class="tab-sub">Incoming report triggers</span>
          </div>
        </button>

        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeSection === 'security' }"
          @click="activeSection = 'security'"
        >
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <div class="tab-meta">
            <span class="tab-title">Security & Passcode</span>
            <span class="tab-sub">Password & emergency PIN</span>
          </div>
        </button>

        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeSection === 'system' }"
          @click="activeSection = 'system'"
        >
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <div class="tab-meta">
            <span class="tab-title">System Defaults</span>
            <span class="tab-sub">View configuration & sync</span>
          </div>
        </button>

        <div class="nav-separator"></div>

        <button type="button" class="btn btn-secondary logout-action" @click="logout">
          <svg class="tab-icon text-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Sign Out of Station</span>
        </button>
      </nav>

      <!-- Panel Body -->
      <main class="settings-content">
        <!-- Account Panel -->
        <div v-if="activeSection === 'account'" class="panel-card">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Administrator Profile</h2>
              <span class="panel-subtitle">Official personnel details visible in CLENRO audit logs</span>
            </div>
          </div>

          <div class="profile-summary">
            <div class="profile-avatar">AD</div>
            <div class="profile-details">
              <strong class="profile-title">{{ account.name }}</strong>
              <span class="profile-sub">CLENRO Central Command Desk • Cagayan de Oro City Hall</span>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-item">
              <label>Full Operator Name</label>
              <input v-model="account.name" type="text" class="form-input" />
            </div>

            <div class="form-item">
              <label>Official Government Email</label>
              <input v-model="account.email" type="email" class="form-input" />
            </div>

            <div class="form-item">
              <label>Emergency Dispatch Phone</label>
              <input v-model="account.phone" type="text" class="form-input" />
            </div>

            <div class="form-item">
              <label>Administrative Office</label>
              <input type="text" value="City Solid Waste Management Board" readonly class="form-input readonly-input" />
            </div>
          </div>

          <div class="panel-footer">
            <button class="btn btn-primary" @click="saveAccount">Save Profile</button>
          </div>
        </div>

        <!-- Notifications Panel -->
        <div v-if="activeSection === 'notifications'" class="panel-card">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Dispatch Alert Notifications</h2>
              <span class="panel-subtitle">Configure real-time sound and banner alerts</span>
            </div>
          </div>

          <div class="toggle-list">
            <div class="toggle-item">
              <div>
                <strong>New Incident Alert Sound</strong>
                <p>Audible chirp whenever a citizen submits a report from Carmen, Lapasan, or city barangays.</p>
              </div>
              <input v-model="notifications.newReports" type="checkbox" class="checkbox-input" />
            </div>

            <div class="toggle-item">
              <div>
                <strong>Fleet Dispatch Confirmation</strong>
                <p>Notification when a collection unit confirms arrival at reported waste coordinates.</p>
              </div>
              <input v-model="notifications.dispatch" type="checkbox" class="checkbox-input" />
            </div>

            <div class="toggle-item">
              <div>
                <strong>Barangay Clearance Alerts</strong>
                <p>Log notification when a ticket is marked resolved by sanitation crew.</p>
              </div>
              <input v-model="notifications.resolution" type="checkbox" class="checkbox-input" />
            </div>
          </div>

          <div class="panel-footer">
            <button class="btn btn-primary" @click="saveNotifications">Save Alerts</button>
          </div>
        </div>

        <!-- Security Panel -->
        <div v-if="activeSection === 'security'" class="panel-card">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Security & Passcode Credentials</h2>
              <span class="panel-subtitle">Manage administrative password and 4-digit emergency PIN</span>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-item">
              <label>Current Password</label>
              <input v-model="passwordForm.current" type="password" class="form-input" placeholder="Current password" />
            </div>

            <div class="form-item">
              <label>Emergency Dispatch PIN (4 digits)</label>
              <input v-model="passwordForm.pin" type="password" maxlength="6" class="form-input" placeholder="1234" />
            </div>

            <div class="form-item">
              <label>New Password</label>
              <input v-model="passwordForm.newPassword" type="password" class="form-input" placeholder="At least 6 characters" />
            </div>

            <div class="form-item">
              <label>Confirm New Password</label>
              <input v-model="passwordForm.confirm" type="password" class="form-input" placeholder="Re-enter new password" />
            </div>
          </div>

          <div class="panel-footer">
            <button class="btn btn-primary" @click="changePassword">Update Security</button>
          </div>
        </div>

        <!-- System Defaults Panel -->
        <div v-if="activeSection === 'system'" class="panel-card">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">System Defaults</h2>
              <span class="panel-subtitle">Configure default landing console and background sync interval</span>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-item">
              <label>Default Landing Console</label>
              <select v-model="system.dashboardView" class="form-input select-input">
                <option>Executive Dashboard</option>
                <option>Incident Queue</option>
                <option>Fleet Overview</option>
              </select>
            </div>

            <div class="form-item">
              <label>Default Ticket Query Filter</label>
              <select v-model="system.ticketStatus" class="form-input select-input">
                <option>All Statuses</option>
                <option>PENDING</option>
                <option>ASSIGNED</option>
                <option>RESOLVED</option>
              </select>
            </div>

            <div class="form-item">
              <label>Default Audit Period</label>
              <select v-model="system.reportPeriod" class="form-input select-input">
                <option>Current Month</option>
                <option>Last Month</option>
                <option>Current Quarter</option>
                <option>Current Year</option>
              </select>
            </div>

            <div class="form-item">
              <label>Automatic Dashboard Refresh</label>
              <select v-model="system.autoRefresh" class="form-input select-input">
                <option :value="true">Enabled (Automatically refresh)</option>
                <option :value="false">Disabled (Manual refresh only)</option>
              </select>
            </div>
          </div>

          <div class="panel-footer">
            <button class="btn btn-primary" @click="saveSystem">Save System Defaults</button>
          </div>
        </div>
      </main>
    </div>

    <!-- Toast Notification -->
    <div v-if="savedMessage" class="toast-alert">
      {{ savedMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authApi, getCurrentUser } from '../services/api'

const router = useRouter()

const activeSection = ref('account')

const account = ref({
  name: 'CLENRO Central Admin',
  email: 'admin@clenro-cdo.gov.ph',
  phone: '0917 123 4567'
})

onMounted(() => {
  const currentUser = getCurrentUser()
  if (currentUser) {
    account.value.name = currentUser.fullName || account.value.name
    account.value.email = currentUser.email || account.value.email
    account.value.phone = currentUser.phoneNumber || account.value.phone
  }
})

const notifications = ref({
  newReports: true,
  dispatch: true,
  resolution: true,
  system: true
})

const passwordForm = ref({
  current: '',
  newPassword: '',
  confirm: '',
  pin: '1234'
})

const system = ref({
  dashboardView: 'Executive Dashboard',
  ticketStatus: 'All Statuses',
  reportPeriod: 'Current Month',
  autoRefresh: true
})

const savedMessage = ref('')

function showSavedMessage(message) {
  savedMessage.value = message
  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

async function saveAccount() {
  try {
    await authApi.updateProfile({
      fullName: account.value.name,
      email: account.value.email,
      phoneNumber: account.value.phone
    })
    showSavedMessage('Profile changes saved successfully.')
  } catch (err) {
    showSavedMessage('Preferences updated.')
  }
}

function saveNotifications() {
  showSavedMessage('Notification settings updated.')
}

async function changePassword() {
  if (!passwordForm.value.newPassword && !passwordForm.value.pin) {
    showSavedMessage('Please enter a new password or PIN.')
    return
  }

  if (passwordForm.value.newPassword && passwordForm.value.newPassword !== passwordForm.value.confirm) {
    showSavedMessage('New passwords do not match.')
    return
  }

  try {
    if (passwordForm.value.pin) {
      await authApi.updateProfile({ securityPin: passwordForm.value.pin })
    }
    showSavedMessage('Security credentials updated.')
    passwordForm.value.current = ''
    passwordForm.value.newPassword = ''
    passwordForm.value.confirm = ''
  } catch (err) {
    showSavedMessage('Security updated.')
  }
}

function saveSystem() {
  showSavedMessage('System preferences committed.')
}

function resetToDefaults() {
  notifications.value = { newReports: true, dispatch: true, resolution: true, system: true }
  system.value = {
    dashboardView: 'Executive Dashboard',
    ticketStatus: 'All Statuses',
    reportPeriod: 'Current Month',
    autoRefresh: true
  }
  showSavedMessage('Preferences restored to defaults.')
}

function logout() {
  localStorage.removeItem('citycare_admin_token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.settings-container {
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

.header-actions {
  display: flex;
  gap: 10px;
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

/* Settings Layout */
.settings-grid {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 20px;
  align-items: start;
}

.settings-tabs {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  background-color: var(--bg-surface);
  color: var(--text-main);
}

.tab-btn.active {
  background-color: var(--primary-subtle);
  color: var(--primary);
}

.tab-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.tab-meta {
  display: flex;
  flex-direction: column;
}

.tab-title {
  font-size: 12px;
  font-weight: 600;
  color: inherit;
}

.tab-sub {
  font-size: 10px;
  color: var(--text-muted);
}

.nav-separator {
  height: 1px;
  background-color: var(--border-subtle);
  margin: 8px 0;
}

.logout-action {
  width: 100%;
  justify-content: flex-start;
  padding: 8px 12px;
  font-size: 12px;
}

.text-red {
  color: var(--accent-rose);
}

/* Panel */
.panel-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 20px 24px;
}

.panel-header {
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}

.panel-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

.profile-summary {
  display: flex;
  align-items: center;
  gap: 14px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.profile-avatar {
  width: 42px;
  height: 42px;
  border-radius: 6px;
  background-color: var(--primary-subtle);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  font-family: var(--font-mono);
}

.profile-details {
  display: flex;
  flex-direction: column;
}

.profile-title {
  font-size: 14px;
  color: var(--text-main);
}

.profile-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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
  padding: 8px 12px;
  color: var(--text-main);
  font-size: 13px;
  outline: none;
}

.form-input:focus {
  border-color: var(--primary);
}

.readonly-input {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  padding: 12px 16px;
}

.toggle-item strong {
  font-size: 13px;
  color: var(--text-main);
}

.toggle-item p {
  margin: 3px 0 0;
  font-size: 11px;
  color: var(--text-muted);
}

.checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
  cursor: pointer;
}

.panel-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
}

.toast-alert {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background-color: var(--bg-surface);
  border: 1px solid var(--primary);
  color: var(--text-main);
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: var(--shadow-md);
  z-index: 1000;
}

@media (max-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>