<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser } from '../services/api'

const router = useRouter()
const currentUser = computed(() => getCurrentUser())

const initials = computed(() => {
  const user = currentUser.value
  if (!user || !user.fullName) return 'AD'
  return user.fullName
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})
</script>

<template>
  <header class="header">

    <div class="search-box">
      <span class="search-icon">⌕</span>
      <input
        type="text"
        placeholder="Search areas, tickets, or personnel..."
        @keyup.enter="router.push('/tickets')"
      />
    </div>

    <div class="header-actions">
      <span class="admin-label" v-if="currentUser">
        {{ currentUser.fullName || 'CLENRO Admin' }}
      </span>

      <div class="avatar" @click="router.push('/settings')" :title="'Profile Settings (' + (currentUser?.email || 'admin') + ')'">
        {{ initials }}
      </div>
    </div>

  </header>
</template>

<style scoped>
.header {
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.search-box {
  width: 300px;
  height: 34px;

  display: flex;
  align-items: center;

  border: 1px solid #dfe4ea;
  border-radius: 5px;

  background: #ffffff;
}

.search-icon {
  padding-left: 10px;
  color: #98a2b3;
  font-size: 18px;
}

.search-box input {
  flex: 1;
  height: 100%;

  border: none;
  outline: none;

  padding: 0 8px;

  font-size: 11px;
  color: #344054;
  background: transparent;
}

.search-box input::placeholder {
  color: #98a2b3;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-button {
  border: none;
  background: transparent;

  color: #667085;
  font-size: 19px;

  cursor: pointer;
}

.admin-label {
  font-size: 11px;
  font-weight: 600;
  color: #344054;
}

.avatar {
  width: 30px;
  height: 30px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #278c37;
  color: white;

  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.avatar:hover {
  transform: scale(1.05);
}
</style>