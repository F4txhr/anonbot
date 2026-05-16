import { Context } from 'grammy';
export declare class RelayService {
    private redis;
    private env;
    relayMessage(ctx: Context): Promise<void>;
    private getUserState;
    private relayToPartner;
}
export declare const relayService: RelayService;
//# sourceMappingURL=relay.service.d.ts.map