import { ReportReason, Prisma } from '@prisma/client';
export declare class ReportRepository {
    private prisma;
    constructor();
    create(data: {
        reporterId: string;
        targetId: string;
        reason: ReportReason;
    }): Promise<Prisma.ReportGetPayload<{}>>;
    getReportsForUser(userId: string): Promise<Prisma.ReportGetPayload<{
        include: {
            reporter: true;
        };
    }>[]>;
    countReportsAgainstUser(userId: string): Promise<number>;
    count(): Promise<number>;
    getRecentReports(limit?: number): Promise<Prisma.ReportGetPayload<{
        include: {
            reporter: true;
            target: true;
        };
    }>[]>;
}
export declare const reportRepository: ReportRepository;
//# sourceMappingURL=report.repository.d.ts.map