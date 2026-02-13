<template>
  <v-container fluid>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Dashboard</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Welcome back, {{ userEmail }}</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="d-flex align-center">
            <v-avatar :color="stat.color" size="48" class="mr-4">
              <v-icon :icon="stat.icon" color="white" />
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
              <div class="text-caption text-medium-emphasis">{{ stat.title }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Recent Activity</v-card-title>
          <v-list>
            <v-list-item
              v-for="item in recentActivity"
              :key="item.id"
              :prepend-icon="item.icon"
            >
              <v-list-item-title>{{ item.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ item.time }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-btn
              v-for="action in quickActions"
              :key="action.label"
              :prepend-icon="action.icon"
              :color="action.color"
              variant="tonal"
              block
              class="mb-2"
            >
              {{ action.label }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { supabase } from '@/plugins/supabase'

  const router = useRouter()
  const userEmail = ref('')

  onMounted(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    userEmail.value = user.email ?? ''
  })

  const stats = [
    { title: 'Total Users', value: '1,024', icon: 'mdi-account-group', color: 'blue' },
    { title: 'Revenue', value: '$12.4k', icon: 'mdi-currency-usd', color: 'green' },
    { title: 'Orders', value: '342', icon: 'mdi-cart', color: 'orange' },
    { title: 'Visitors', value: '8,721', icon: 'mdi-eye', color: 'purple' },
  ]

  const recentActivity = [
    { id: 1, title: 'New user registered', time: '2 minutes ago', icon: 'mdi-account-plus' },
    { id: 2, title: 'Order #1042 completed', time: '15 minutes ago', icon: 'mdi-check-circle' },
    { id: 3, title: 'Payment received', time: '1 hour ago', icon: 'mdi-cash' },
    { id: 4, title: 'Server backup completed', time: '3 hours ago', icon: 'mdi-cloud-check' },
    { id: 5, title: 'New comment on post', time: '5 hours ago', icon: 'mdi-comment-text' },
  ]

  const quickActions = [
    { label: 'Add User', icon: 'mdi-account-plus', color: 'blue' },
    { label: 'Create Report', icon: 'mdi-file-chart', color: 'green' },
    { label: 'Settings', icon: 'mdi-cog', color: 'grey' },
  ]
</script>
