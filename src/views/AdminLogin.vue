<template>
  <div class="login" :data-theme="theme">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32">
            <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <h1>CityCare CDO</h1>
        <p>Waste Management Portal</p>
      </div>

      <form @submit.prevent="login" class="login-form">
        <div class="form-group">
          <label>Email</label>
          <div class="input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <input 
              v-model="email" 
              type="email" 
              placeholder="admin@clenro-cdo.gov.ph"
              required 
            />
          </div>
        </div>

        <div class="form-group">
          <label>Password</label>
          <div class="input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input v-model="password" type="password" placeholder="Enter password" required />
          </div>
        </div>

        <div class="form-group">
          <label>Security PIN</label>
          <div class="input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <line x1="6" y1="12" x2="6" y2="12"/>
              <line x1="12" y1="12" x2="12" y2="12"/>
              <line x1="18" y1="12" x2="18" y2="12"/>
            </svg>
            <input v-model="securityPin" type="password" placeholder="1234" required />
          </div>
        </div>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
          <span v-if="isLoading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <button class="demo-fill" @click="fillAdminCredentials">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        Use Demo Credentials
      </button>

      <div class="login-footer">
        <span>City Local Environment & Natural Resources Office</span>
        <span>Cagayan de Oro City</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../services/api'

const router = useRouter()

const theme = ref(localStorage.getItem('theme') || 'dark')
const email = ref('admin@clenro-cdo.gov.ph')
const password = ref('')
const securityPin = ref('1234')
const isLoading = ref(false)
const errorMessage = ref('')

function fillAdminCredentials() {
  email.value = 'admin@clenro-cdo.gov.ph'
  password.value = 'admin123'
  securityPin.value = '1234'
  errorMessage.value = ''
}

async function login() {
  errorMessage.value = ''
  const cleanEmail = email.value ? email.value.trim() : ''
  const cleanPass = password.value ? password.value.trim() : ''
  const cleanPin = securityPin.value ? securityPin.value.trim() : ''

  if (!cleanEmail || !cleanPass || !cleanPin) {
    errorMessage.value = 'Please complete all fields.'
    return
  }

  try {
    isLoading.value = true
    await authApi.adminLogin({
      email: cleanEmail,
      password: cleanPass,
      securityPin: cleanPin,
      role: 'CLENRO Central Admin'
    })
    router.push('/dashboard')
  } catch (err) {
    errorMessage.value = err.message || 'Authentication failed. Please verify credentials.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
  if (localStorage.getItem('citycare_admin_token')) {
    router.push('/dashboard')
  }
})
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-app);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow-lg);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  background: var(--primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.login-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-main);
}

.login-header p {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper svg {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
}

.form-group input {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-md);
  padding: 10px 12px 10px 36px;
  color: var(--text-main);
  font-size: 13px;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
}

.form-group input::placeholder {
  color: var(--text-dim);
}

.error-message {
  color: var(--danger);
  font-size: 13px;
  text-align: center;
  padding: 10px;
  background: var(--danger-light);
  border-radius: var(--radius-md);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-block {
  width: 100%;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.demo-fill {
  margin-top: 20px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: none;
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
}

.demo-fill:hover {
  background: var(--bg-surface);
  color: var(--text-main);
}

.login-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted);
}
</style>
