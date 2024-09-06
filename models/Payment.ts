// models/Payment.ts
export class Payment {
  constructor(
    public paymentId: string,
    public payerId: string,
    public amount: number,
    public invoiceId: string,
    public type: string,
    public organizationId: string,
    public invoiceUrl: string,
    public invoiceData: Record<string, any>,
    public status: string,
    public createdAt: Date,
    public targetId: string
  ) {}
}
