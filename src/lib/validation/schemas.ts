import { z } from "zod";

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(3, "Informe seu nome completo"),
    email: z.string().trim().email("E-mail inválido"),
    phone: z
      .string()
      .trim()
      .min(10, "Informe um WhatsApp válido com DDD")
      .max(20),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

export const eventSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome do evento"),
  slug: z
    .string()
    .trim()
    .min(3, "Informe um slug")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens"),
  description: z.string().trim().optional().nullable(),
  event_date: z.string().min(1, "Informe a data"),
  event_time: z.string().min(1, "Informe o horário"),
  location: z.string().trim().min(2, "Informe o local"),
  address: z.string().trim().optional().nullable(),
  capacity: z.coerce.number().int().positive("A capacidade deve ser maior que zero"),
  ticket_price: z.coerce.number().min(0, "O preço não pode ser negativo"),
  max_tickets_per_order: z.coerce.number().int().positive().max(50).default(6),
  pix_key: z.string().trim().min(3, "Informe a chave PIX"),
  pix_holder_name: z.string().trim().min(3, "Informe o nome do favorecido"),
  image_url: z.string().trim().url().optional().nullable().or(z.literal("")),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "FINISHED", "CANCELLED"]),
});
export type EventInput = z.infer<typeof eventSchema>;

export const createOrderSchema = z
  .object({
    eventId: z.string().uuid(),
    quantity: z.coerce.number().int().min(1, "Escolha ao menos 1 ingresso"),
    attendeeNames: z
      .array(z.string().trim().min(2, "Informe o nome completo de cada participante"))
      .min(1, "Informe o nome de cada participante"),
  })
  .refine((data) => data.attendeeNames.length === data.quantity, {
    message: "Informe um nome para cada ingresso",
    path: ["attendeeNames"],
  });
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const reviewOrderSchema = z.object({
  orderId: z.string().uuid(),
  observation: z.string().trim().max(1000).optional(),
});

export const rejectOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().trim().min(3, "Informe o motivo da rejeição").max(1000),
});

export const manualCheckinSchema = z.object({
  ticketId: z.string().uuid(),
  eventId: z.string().uuid(),
});

export const ACCEPTED_PROOF_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const MAX_PROOF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
