// services/PaymentService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Payment } from "../models_/Payment";

export class PaymentService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createPayment(payment: Payment): Promise<Payment> {
    const { data, error } = await this.supabase
      .from("payments")
      .insert(payment)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return new Payment(
      data.paymentId,
      data.payerId,
      data.amount,
      data.invoiceId,
      data.type,
      data.organizationId,
      data.invoiceUrl,
      data.invoiceData,
      data.status,
      new Date(data.createdAt),
      data.targetId
    );
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from("payments")
      .select("*")
      .eq("paymentId", paymentId)
      .single();
    if (error) return null;
    return new Payment(
      data.paymentId,
      data.payerId,
      data.amount,
      data.invoiceId,
      data.type,
      data.organizationId,
      data.invoiceUrl,
      data.invoiceData,
      data.status,
      new Date(data.createdAt),
      data.targetId
    );
  }

  async updatePayment(
    paymentId: string,
    updates: Partial<Payment>
  ): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from("payments")
      .update(updates)
      .eq("paymentId", paymentId)
      .select()
      .single();
    if (error) return null;
    return new Payment(
      data.paymentId,
      data.payerId,
      data.amount,
      data.invoiceId,
      data.type,
      data.organizationId,
      data.invoiceUrl,
      data.invoiceData,
      data.status,
      new Date(data.createdAt),
      data.targetId
    );
  }

  async deletePayment(paymentId: string): Promise<void> {
    const { error } = await this.supabase
      .from("payments")
      .delete()
      .eq("paymentId", paymentId);
    if (error) throw new Error(error.message);
  }
}
