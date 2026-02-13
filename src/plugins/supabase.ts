import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://svixdczzwotxgjeejqfh.supabase.co'
const supabaseAnonKey = 'sb_publishable_DbRAeqFxIJtA67ZgKNxshw_GnBTnJD6'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
