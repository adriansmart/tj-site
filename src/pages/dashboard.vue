<template>
  <v-container fluid>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Dashboard</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Welcome back, {{ userEmail }}</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="5">
        <v-card>
          <v-card-title>Distinct Symbol Counts Per Day</v-card-title>
          <v-card-text>
            <div v-if="loading" class="d-flex justify-center py-8">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <v-alert v-else-if="error" type="error" variant="tonal">
              {{ error }}
            </v-alert>

            <v-alert v-else-if="symbolCounts.length === 0" type="info" variant="tonal">
              No data available for today's collection.
            </v-alert>

            <div v-else>
              <p class="text-body-2 text-medium-emphasis mb-3">
                {{ symbolCounts.length }} dates found
              </p>
              <v-table density="comfortable" fixed-header height="500">
                <thead>
                  <tr>
                    <th class="text-left">Date</th>
                    <th class="text-right">Distinct Symbols</th>
                    <th class="text-right">Publishers</th>
                    <th class="text-right">Entries</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in symbolCounts" :key="row.date">
                    <td>{{ row.date }}</td>
                    <td class="text-right">{{ row.count.toLocaleString() }}</td>
                    <td class="text-right">{{ row.publishers.toLocaleString() }}</td>
                    <td class="text-right">{{ row.entries.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="7">
        <v-card>
          <v-card-title>Entry Anomalies</v-card-title>
          <v-card-text>
            <div v-if="loading" class="d-flex justify-center py-8">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <v-alert v-else-if="anomalies.length === 0" type="success" variant="tonal">
              No anomalies detected.
            </v-alert>

            <div v-else>
              <p class="text-body-2 text-medium-emphasis mb-3">
                {{ anomalies.length }} anomalies detected
              </p>
              <v-table density="compact" fixed-header height="500" class="anomaly-table">
                <thead>
                  <tr>
                    <th class="text-left">Date</th>
                    <th class="text-left">Day</th>
                    <th class="text-left">Note</th>
                    <th class="text-right">Pubs</th>
                    <th class="text-right">Base Pubs</th>
                    <th class="text-right">Entries</th>
                    <th class="text-right">Baseline</th>
                    <th class="text-left">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in anomalies"
                    :key="row.date"
                    :class="row.type === 'Level shift' ? 'bg-warning-subtle' : 'bg-error-subtle'"
                  >
                    <td>{{ row.date }}</td>
                    <td>{{ row.dayOfWeek }}</td>
                    <td>
                      <v-chip
                        v-if="row.marketNote"
                        size="x-small"
                        variant="tonal"
                        :color="row.marketNote === 'Holiday' ? 'error' : 'orange'"
                      >
                        {{ row.marketNote }}
                      </v-chip>
                    </td>
                    <td class="text-right">{{ row.publishers.toLocaleString() }}</td>
                    <td class="text-right">{{ row.baselinePublishers.toLocaleString() }}</td>
                    <td class="text-right">{{ row.entries.toLocaleString() }}</td>
                    <td class="text-right">{{ row.baseline.toLocaleString() }}</td>
                    <td>
                      <v-chip
                        :color="row.type === 'Level shift' ? 'warning' : 'error'"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ row.type }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { supabase } from '@/plugins/supabase'

  interface SymbolCount {
    date: string
    count: number
    publishers: number
    entries: number
  }

  interface Anomaly {
    date: string
    dayOfWeek: string
    marketNote: string
    publishers: number
    baselinePublishers: number
    entries: number
    baseline: number
    type: 'Anomaly' | 'Level shift'
  }

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // NYSE market holidays (fixed dates and computed floating holidays)
  function getMarketHolidays(year: number): Map<string, string> {
    const holidays = new Map<string, string>()

    const fmt = (m: number, d: number) =>
      `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

    // New Year's Day
    holidays.set(fmt(1, 1), 'Holiday')

    // MLK Day — 3rd Monday of January
    const mlk = nthWeekday(year, 1, 1, 3)
    holidays.set(fmt(1, mlk), 'Holiday')

    // Presidents' Day — 3rd Monday of February
    const pres = nthWeekday(year, 2, 1, 3)
    holidays.set(fmt(2, pres), 'Holiday')

    // Good Friday — 2 days before Easter
    const easter = computeEaster(year)
    const gf = new Date(easter)
    gf.setDate(gf.getDate() - 2)
    holidays.set(gf.toISOString().slice(0, 10), 'Holiday')

    // Memorial Day — last Monday of May
    const mem = lastWeekday(year, 5, 1)
    holidays.set(fmt(5, mem), 'Holiday')

    // Juneteenth
    holidays.set(fmt(6, 19), 'Holiday')

    // Independence Day
    holidays.set(fmt(7, 4), 'Holiday')

    // Labor Day — 1st Monday of September
    const labor = nthWeekday(year, 9, 1, 1)
    holidays.set(fmt(9, labor), 'Holiday')

    // Thanksgiving — 4th Thursday of November
    const thx = nthWeekday(year, 11, 4, 4)
    holidays.set(fmt(11, thx), 'Holiday')

    // Christmas
    holidays.set(fmt(12, 25), 'Holiday')

    // Early close days
    // Day before Independence Day (Jul 3)
    holidays.set(fmt(7, 3), 'Early close')
    // Day after Thanksgiving
    holidays.set(fmt(11, thx + 1), 'Early close')
    // Christmas Eve
    holidays.set(fmt(12, 24), 'Early close')

    return holidays
  }

  function nthWeekday(year: number, month: number, dow: number, n: number): number {
    let count = 0
    for (let d = 1; d <= 31; d++) {
      const dt = new Date(year, month - 1, d)
      if (dt.getMonth() !== month - 1) break
      if (dt.getDay() === dow) {
        count++
        if (count === n) return d
      }
    }
    return 1
  }

  function lastWeekday(year: number, month: number, dow: number): number {
    let last = 1
    for (let d = 1; d <= 31; d++) {
      const dt = new Date(year, month - 1, d)
      if (dt.getMonth() !== month - 1) break
      if (dt.getDay() === dow) last = d
    }
    return last
  }

  function computeEaster(year: number): Date {
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31)
    const day = ((h + l - 7 * m + 114) % 31) + 1
    return new Date(year, month - 1, day)
  }

  // Cache holidays for all years in the data
  const holidayCache = new Map<number, Map<string, string>>()
  function getMarketNote(dateStr: string): string {
    const dt = new Date(dateStr + 'T00:00:00')
    const dow = dt.getDay()
    if (dow === 0 || dow === 6) return 'Weekend'

    const year = dt.getFullYear()
    if (!holidayCache.has(year)) {
      holidayCache.set(year, getMarketHolidays(year))
    }
    return holidayCache.get(year)!.get(dateStr) ?? ''
  }

  const router = useRouter()
  const userEmail = ref('')
  const symbolCounts = ref<SymbolCount[]>([])
  const loading = ref(true)
  const error = ref('')

  function getMedian(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
  }

  const anomalies = computed<Anomaly[]>(() => {
    const data = symbolCounts.value
    if (data.length < 5) return []

    const result: Anomaly[] = []
    const baselineWindow: number[] = data.slice(0, 5).map(r => r.entries)
    const pubBaselineWindow: number[] = data.slice(0, 5).map(r => r.publishers)

    for (let i = 1; i < data.length; i++) {
      const baseline = getMedian(baselineWindow)
      const pubBaseline = getMedian(pubBaselineWindow)
      const current = data[i]!.entries

      const ratio = current / baseline

      if (ratio < 0.5 || ratio > 2.0) {
        const ahead = data.slice(i + 1, i + 5)
        const isLevelShift = ahead.length >= 3 && ahead.every(r => {
          const ar = r.entries / current
          return ar > 0.7 && ar < 1.3
        })

        const dateStr = data[i]!.date
        const dt = new Date(dateStr + 'T00:00:00')

        result.push({
          date: dateStr,
          dayOfWeek: DAYS[dt.getDay()]!,
          marketNote: getMarketNote(dateStr),
          publishers: data[i]!.publishers,
          baselinePublishers: Math.round(pubBaseline),
          entries: current,
          baseline: Math.round(baseline),
          type: isLevelShift ? 'Level shift' : 'Anomaly',
        })

        if (isLevelShift) {
          baselineWindow.length = 0
          baselineWindow.push(current, ...ahead.map(r => r.entries))
          pubBaselineWindow.length = 0
          pubBaselineWindow.push(data[i]!.publishers, ...ahead.map(r => r.publishers))
        }
      } else {
        baselineWindow.push(current)
        if (baselineWindow.length > 10) baselineWindow.shift()
        pubBaselineWindow.push(data[i]!.publishers)
        if (pubBaselineWindow.length > 10) pubBaselineWindow.shift()
      }
    }

    return result
  })

  onMounted(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    userEmail.value = user.email ?? ''

    try {
      const res = await fetch('/api/symbol-counts')
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`)
      }
      const data = await res.json()
      if (data.error) {
        throw new Error(data.error)
      }
      symbolCounts.value = data
    } catch (err: any) {
      error.value = err.message || 'Failed to load symbol counts'
    } finally {
      loading.value = false
    }
  })
</script>

<style scoped>
  .bg-error-subtle {
    background-color: rgba(var(--v-theme-error), 0.08);
  }
  .bg-warning-subtle {
    background-color: rgba(var(--v-theme-warning), 0.08);
  }
  .anomaly-table td,
  .anomaly-table th {
    white-space: nowrap;
  }
</style>
