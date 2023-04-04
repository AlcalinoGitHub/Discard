import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pvkjnunfzhftwazpyisf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2a2pudW5memhmdHdhenB5aXNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MDA2MzQwNSwiZXhwIjoxOTk1NjM5NDA1fQ.E6NUKVMhtMernYM8wvhZ6xNcyHDDxQNYftl_XsPvOYQ'
const supabase = createClient(supabaseUrl, supabaseKey)

export {supabase}

