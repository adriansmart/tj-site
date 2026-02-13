<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="pa-4" elevation="8">
          <v-card-title class="text-h5 text-center">
            {{ isSignUp ? 'Sign Up' : 'Login' }}
          </v-card-title>

          <v-card-text>
            <v-alert
              v-if="errorMessage"
              type="error"
              class="mb-4"
              closable
              @click:close="errorMessage = ''"
            >
              {{ errorMessage }}
            </v-alert>

            <v-alert
              v-if="successMessage"
              type="success"
              class="mb-4"
              closable
              @click:close="successMessage = ''"
            >
              {{ successMessage }}
            </v-alert>

            <v-form ref="form" v-model="valid" @submit.prevent="onSubmit">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                prepend-inner-icon="mdi-email-outline"
                :rules="emailRules"
                required
              />

              <v-text-field
                v-model="password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                :rules="passwordRules"
                required
                @click:append-inner="showPassword = !showPassword"
              />

              <v-btn
                block
                color="primary"
                size="large"
                type="submit"
                class="mt-4"
                :disabled="!valid"
                :loading="loading"
              >
                {{ isSignUp ? 'Sign Up' : 'Login' }}
              </v-btn>
            </v-form>

            <div class="text-center mt-4">
              <v-btn variant="text" size="small" @click="isSignUp = !isSignUp">
                {{ isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up" }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { supabase } from '@/plugins/supabase'

  const ALLOWED_EMAIL = 'adriansmart11@gmail.com'

  const router = useRouter()
  const form = ref()
  const valid = ref(false)
  const email = ref('')
  const password = ref('')
  const showPassword = ref(false)
  const loading = ref(false)
  const isSignUp = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  const emailRules = [
    (v: string) => !!v || 'Email is required',
    (v: string) => /.+@.+\..+/.test(v) || 'Enter a valid email',
  ]

  const passwordRules = [
    (v: string) => !!v || 'Password is required',
    (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
  ]

  async function onSubmit () {
    errorMessage.value = ''
    successMessage.value = ''
    loading.value = true

    try {
      if (isSignUp.value) {
        const { error } = await supabase.auth.signUp({
          email: email.value,
          password: password.value,
        })
        if (error) throw error
        successMessage.value = 'Account created successfully.'
        isSignUp.value = false
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.value,
          password: password.value,
        })
        if (error) throw error

        if (data.user?.email !== ALLOWED_EMAIL) {
          await supabase.auth.signOut()
          throw new Error('Login is not permitted for this account.')
        }

        router.push('/dashboard')
      }
    } catch (err: any) {
      errorMessage.value = err.message || 'Something went wrong'
    } finally {
      loading.value = false
    }
  }
</script>
