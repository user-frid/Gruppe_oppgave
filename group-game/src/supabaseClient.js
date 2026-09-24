import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://npgqldpfenaxbcvhlgmz.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZ3FsZHBmZW5heGJjdmhsZ216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDc3MzcsImV4cCI6MjEwNTgyMzczN30.2efxlPQRZeRvIPq4SFe35sjErtbV83XtUDZaLFqThhw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
