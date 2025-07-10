import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Tạo Supabase server client cho Next.js API Route, Server Component, Server Action.
 * Tự động lấy cookies từ next/headers để duy trì session.
 * @returns Supabase server client instance đã sẵn sàng cho truy vấn bảo mật (RLS, Auth)
 * @example
 * const supabase = await createClient();
 * const { data } = await supabase.from('users').select('*');
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
