import { Prisma } from '@prisma/client';
export declare class PaymentRepository {
    private prisma;
    constructor();
    create(data: {
        userId: string;
        starsAmount: number;
        telegramPaymentId?: string;
    }): Promise<Prisma.PaymentGetPayload<{}>>;
    complete(paymentId: string, telegramPaymentId: string): Promise<void>;
    fail(paymentId: string): Promise<void>;
    findById(paymentId: string): Promise<Prisma.PaymentGetPayload<{}> | null>;
    findByTelegramPaymentId(telegramPaymentId: string): Promise<Prisma.PaymentGetPayload<{}> | null>;
    getUserPayments(userId: string): Promise<Prisma.PaymentGetPayload<{}>[]>;
    countCompleted(): Promise<number>;
    getRecentPayments(limit?: number): Promise<Prisma.PaymentGetPayload<{
        include: {
            user: true;
        };
    }>[]>;
}
export declare const paymentRepository: PaymentRepository;
//# sourceMappingURL=payment.repository.d.ts.map