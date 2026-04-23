import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Service Role Key - bỏ qua RLS, chỉ dùng phía server (API routes)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase server environment variables!');
}

/**
 * Server-only Supabase client với Service Role Key.
 * Bypass tất cả RLS policies - KHÔNG bao giờ expose ra client-side.
 * Việc kiểm soát phân quyền do Next.js API routes đảm nhiệm.
 */
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  global: {
    fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
  }
});
