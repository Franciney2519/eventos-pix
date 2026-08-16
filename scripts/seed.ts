/**
 * Development seed script.
 * Creates demo users (admin, checkin, participants), one event, and a mix
 * of pending/approved orders with issued and used tickets, so the full flow
 * (login → order → approval → tickets → check-in) can be exercised locally.
 *
 * Usage: npm run seed   (requires .env.local with Supabase service role key)
 */
import "dotenv/config";
import { config as loadEnvLocal } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnvLocal({ path: ".env.local", override: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "Senha123!";

async function upsertUser(email: string, fullName: string, phone: string) {
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing.users.find((u) => u.email === email);
  if (found) return found.id;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });
  if (error) throw error;
  return data.user!.id;
}

async function setRole(userId: string, role: "ADMIN" | "CHECKIN" | "CUSTOMER") {
  const { error } = await admin.from("profiles").update({ role }).eq("user_id", userId);
  if (error) throw error;
}

async function main() {
  console.log("Seeding demo data...");

  const adminId = await upsertUser("admin@demo.com", "Administradora Demo", "11999990001");
  await setRole(adminId, "ADMIN");

  const checkinId = await upsertUser("checkin@demo.com", "Operador Check-in", "11999990002");
  await setRole(checkinId, "CHECKIN");

  const participant1 = await upsertUser("participante@demo.com", "Ana Participante", "11999990003");
  const participant2 = await upsertUser("participante2@demo.com", "Bruno Participante", "11999990004");
  const participant3 = await upsertUser("participante3@demo.com", "Carla Participante", "11999990005");

  const eventSlug = "workshop-de-inovacao";
  let { data: event } = await admin.from("events").select("*").eq("slug", eventSlug).maybeSingle();

  if (!event) {
    const { data: created, error } = await admin
      .from("events")
      .insert({
        name: "Workshop de Inovação",
        slug: eventSlug,
        description: "Um dia inteiro de palestras e workshops práticos sobre inovação e tecnologia.",
        event_date: "2026-11-20",
        event_time: "09:00",
        location: "Centro de Convenções",
        address: "Av. Principal, 1000 - Centro",
        capacity: 100,
        ticket_price: 50,
        max_tickets_per_order: 6,
        pix_key: "eventos@demo.com",
        pix_holder_name: "Organização Demo Eventos",
        status: "OPEN",
      })
      .select("*")
      .single();
    if (error) throw error;
    event = created;
  }

  console.log(`Event: ${event!.name} (${event!.id})`);

  async function createOrder(userId: string, quantity: number) {
    const { data: orderNumber } = await admin.rpc("generate_order_number");
    const { data: order, error } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
        event_id: event!.id,
        quantity,
        unit_price: event!.ticket_price,
        total_amount: Number(event!.ticket_price) * quantity,
      })
      .select("*")
      .single();
    if (error) throw error;

    await admin.from("payment_proofs").insert({
      order_id: order.id,
      file_path: `${userId}/${order.id}/comprovante-demo.png`,
      file_name: "comprovante-demo.png",
      mime_type: "image/png",
      file_size: 12345,
    });

    return order;
  }

  // Pending orders
  await createOrder(participant2, 2);
  await createOrder(participant3, 1);

  // Approved order with tickets issued, one used via check-in
  const approvedOrder = await createOrder(participant1, 3);
  const { error: approveError } = await admin.rpc("approve_order", {
    p_order_id: approvedOrder.id,
    p_admin_id: adminId,
  });
  if (approveError) throw approveError;

  const { data: tickets } = await admin.from("tickets").select("*").eq("order_id", approvedOrder.id);
  if (tickets && tickets[0]) {
    const { error: checkinError } = await admin.rpc("confirm_checkin", {
      p_ticket_id: tickets[0].id,
      p_operator_id: checkinId,
      p_source: "QR",
      p_device_info: "seed-script",
      p_ip_address: null,
    });
    if (checkinError) throw checkinError;
  }

  console.log("\nSeed complete. Local credentials:");
  console.log("  Admin:       admin@demo.com / " + DEMO_PASSWORD);
  console.log("  Check-in:    checkin@demo.com / " + DEMO_PASSWORD);
  console.log("  Participante: participante@demo.com / " + DEMO_PASSWORD);
  console.log("  Participante 2: participante2@demo.com / " + DEMO_PASSWORD + " (pedido pendente)");
  console.log("  Participante 3: participante3@demo.com / " + DEMO_PASSWORD + " (pedido pendente)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
