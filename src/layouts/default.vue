<template>
  <v-app-bar flat>
    <v-app-bar-title>TJ Site</v-app-bar-title>

    <template v-if="user">
      <v-btn to="/dashboard" prepend-icon="mdi-view-dashboard" variant="text">Dashboard</v-btn>
      <v-btn prepend-icon="mdi-logout" variant="text" @click="logout">Logout</v-btn>
    </template>
    <v-btn v-else to="/login" prepend-icon="mdi-login" variant="text">Login</v-btn>
  </v-app-bar>

  <v-main>
    <router-view />
  </v-main>

  <AppFooter />
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { supabase } from '@/plugins/supabase'

  const router = useRouter()
  const user = ref<any>(null)

  onMounted(() => {
    supabase.auth.getUser().then(({ data }) => {
      user.value = data.user
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
  })

  async function logout () {
    await supabase.auth.signOut()
    router.push('/')
  }
</script>
