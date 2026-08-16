export type UserRole = "CUSTOMER" | "ADMIN" | "CHECKIN";
export type EventStatus = "DRAFT" | "OPEN" | "CLOSED" | "FINISHED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED";
export type OrderStatus = "WAITING_PAYMENT_REVIEW" | "CONFIRMED" | "TICKETS_ISSUED" | "CANCELLED";
export type ProofReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
export type TicketStatus = "AVAILABLE" | "USED" | "CANCELLED";
export type CheckinSource = "QR" | "MANUAL";
export type EmailType = "TICKETS_ISSUED" | "ORDER_REJECTED";
export type EmailStatus = "SENT" | "FAILED";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  event_date: string;
  event_time: string;
  location: string;
  address: string | null;
  capacity: number;
  ticket_price: number;
  max_tickets_per_order: number;
  pix_key: string;
  pix_holder_name: string;
  image_url: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
  id: string;
  order_number: string;
  user_id: string;
  event_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
}

export interface PaymentProofRow {
  id: string;
  order_id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  review_status: ProofReviewStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  observation: string | null;
}

export interface TicketRow {
  id: string;
  order_id: string;
  event_id: string;
  ticket_number: string;
  token: string;
  status: TicketStatus;
  issued_at: string;
  used_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface CheckinRow {
  id: string;
  ticket_id: string;
  event_id: string;
  checked_in_at: string;
  checked_in_by: string | null;
  source: CheckinSource;
  device_info: string | null;
  ip_address: string | null;
}

export interface EmailLogRow {
  id: string;
  order_id: string | null;
  user_id: string | null;
  type: EmailType;
  recipient: string;
  status: EmailStatus;
  provider_message_id: string | null;
  sent_at: string;
  error_message: string | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile>; Relationships: [] };
      events: { Row: EventRow; Insert: Partial<EventRow>; Update: Partial<EventRow>; Relationships: [] };
      orders: { Row: OrderRow; Insert: Partial<OrderRow>; Update: Partial<OrderRow>; Relationships: [] };
      payment_proofs: {
        Row: PaymentProofRow;
        Insert: Partial<PaymentProofRow>;
        Update: Partial<PaymentProofRow>;
        Relationships: [];
      };
      tickets: { Row: TicketRow; Insert: Partial<TicketRow>; Update: Partial<TicketRow>; Relationships: [] };
      checkins: { Row: CheckinRow; Insert: Partial<CheckinRow>; Update: Partial<CheckinRow>; Relationships: [] };
      email_logs: { Row: EmailLogRow; Insert: Partial<EmailLogRow>; Update: Partial<EmailLogRow>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      generate_order_number: { Args: Record<string, never>; Returns: string };
      current_user_role: { Args: Record<string, never>; Returns: UserRole };
      approve_order: {
        Args: { p_order_id: string; p_admin_id: string };
        Returns: { out_order_id: string; out_tickets_created: number }[];
      };
      reject_order: {
        Args: { p_order_id: string; p_admin_id: string; p_reason: string };
        Returns: undefined;
      };
      cancel_ticket: {
        Args: { p_ticket_id: string; p_admin_id: string };
        Returns: undefined;
      };
      confirm_checkin: {
        Args: {
          p_ticket_id: string;
          p_operator_id: string;
          p_source: CheckinSource;
          p_device_info?: string | null;
          p_ip_address?: string | null;
        };
        Returns: { success: boolean; message: string; ticket_number: string | null; checked_in_at: string | null }[];
      };
    };
    Enums: {
      user_role: UserRole;
      event_status: EventStatus;
      payment_status: PaymentStatus;
      order_status: OrderStatus;
      proof_review_status: ProofReviewStatus;
      ticket_status: TicketStatus;
      checkin_source: CheckinSource;
      email_type: EmailType;
      email_status: EmailStatus;
    };
  };
}
