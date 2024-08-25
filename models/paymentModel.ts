export class PaymentModel {
  private paymentId: string;
  private payerId: string;
  private amount: number;
  private invoiceId: string;
  private type: string;
  private organizationId: string;
  private invoiceUrl: string;
  private invoiceData: Record<string, any>;
  private status: string;
  private createdAt: Date;
  private targetId: string;

  constructor(
    paymentId: string,
    payerId: string,
    amount: number,
    invoiceId: string,
    type: string,
    organizationId: string,
    invoiceUrl: string,
    invoiceData: Record<string, any>,
    status: string,
    createdAt: Date,
    targetId: string
  ) {
    this.paymentId = paymentId;
    this.payerId = payerId;
    this.amount = amount;
    this.invoiceId = invoiceId;
    this.type = type;
    this.organizationId = organizationId;
    this.invoiceUrl = invoiceUrl;
    this.invoiceData = invoiceData;
    this.status = status;
    this.createdAt = createdAt;
    this.targetId = targetId;
  }

  public getPaymentId(): string {
    return this.paymentId;
  }

  public setPaymentId(paymentId: string): void {
    this.paymentId = paymentId;
  }

  public getPayerId(): string {
    return this.payerId;
  }

  public setPayerId(payerId: string): void {
    this.payerId = payerId;
  }

  public getAmount(): number {
    return this.amount;
  }

  public setAmount(amount: number): void {
    this.amount = amount;
  }

  public getInvoiceId(): string {
    return this.invoiceId;
  }

  public setInvoiceId(invoiceId: string): void {
    this.invoiceId = invoiceId;
  }

  public getType(): string {
    return this.type;
  }

  public setType(type: string): void {
    this.type = type;
  }

  public getOrganizationId(): string {
    return this.organizationId;
  }

  public setOrganizationId(organizationId: string): void {
    this.organizationId = organizationId;
  }

  public getInvoiceUrl(): string {
    return this.invoiceUrl;
  }

  public setInvoiceUrl(invoiceUrl: string): void {
    this.invoiceUrl = invoiceUrl;
  }

  public getInvoiceData(): Record<string, any> {
    return this.invoiceData;
  }

  public setInvoiceData(invoiceData: Record<string, any>): void {
    this.invoiceData = invoiceData;
  }

  public getStatus(): string {
    return this.status;
  }

  public setStatus(status: string): void {
    this.status = status;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public setCreatedAt(createdAt: Date): void {
    this.createdAt = createdAt;
  }

  public getTargetId(): string {
    return this.targetId;
  }

  public setTargetId(targetId: string): void {
    this.targetId = targetId;
  }
}