export declare class PaymentService {
    private env;
    handleSuccessfulPayment(paymentId: string, telegramPaymentId: string): Promise<boolean>;
    handleFailedPayment(paymentId: string): Promise<void>;
    createPaymentRecord(userId: string): Promise<{
        id: string;
        amount: number;
    }>;
    extendVip(userId: string, days: number): Promise<Date>;
    revokeVip(userId: string): Promise<void>;
    getVipPrice(): number;
    getVipDurationDays(): number;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=payment.service.d.ts.map