import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
export type Coupon = Database['public']['Tables']['coupons']['Row']

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)