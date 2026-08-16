import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const CUSTOMER_PREFIXES = ["/minha-conta", "/minhas-inscricoes", "/meus-ingressos"];
const ADMIN_PREFIXES = ["/admin"];
const CHECKIN_PREFIXES = ["/checkin"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isCustomerRoute = CUSTOMER_PREFIXES.some((p) => path.startsWith(p));
  const isAdminRoute = ADMIN_PREFIXES.some((p) => path.startsWith(p));
  const isCheckinRoute = CHECKIN_PREFIXES.some((p) => path.startsWith(p));

  if (!isCustomerRoute && !isAdminRoute && !isCheckinRoute) {
    return response;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute || isCheckinRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = profile?.role;
    const allowed =
      (isAdminRoute && role === "ADMIN") ||
      (isCheckinRoute && (role === "ADMIN" || role === "CHECKIN"));

    if (!allowed) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/minha-conta/:path*", "/minhas-inscricoes/:path*", "/meus-ingressos/:path*", "/admin/:path*", "/checkin/:path*"],
};
