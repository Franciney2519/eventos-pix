import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatEventDate(isoDate: string): string {
  return format(parseISO(isoDate), "dd/MM/yyyy", { locale: ptBR });
}

export function formatEventTime(time: string): string {
  return time.slice(0, 5);
}

export function formatDateTime(isoDateTime: string): string {
  return format(new Date(isoDateTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}
