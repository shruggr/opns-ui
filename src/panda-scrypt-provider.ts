
import { DummyProvider, TransactionResponse, UtxoQueryOptions, bsv } from "scrypt-ts";
import { PandaProviderType } from "panda-wallet-provider";

const SATS_PER_KB = 20;
const ONESAT_MAIN = 'https://ordinals.gorillapool.io'
const ONESAT_TEST = 'https://testnet.ordinals.gorillapool.io'
export class PandaSCryptProvider extends DummyProvider {
    constructor(private panda: PandaProviderType, private network: bsv.Networks.Network) {
        super();
    }
    
    isConnected(): boolean {
        return true
    }

    async connect(): Promise<this> {
        try {
            await this.panda.connect()
            if(!await this.panda.isConnected()) {
                this.emit('connected', true)
            }
        } catch (error) {
            this.emit('connected', false)
        }
        return this
    }

    updateNetwork(network: bsv.Networks.Network): void {
        this.network = network
        this.emit('networkChange', network)
    }

    getNetwork(): bsv.Networks.Network {
        return this.network
    }


    override async getBalance(address: bsv.Address) {
        const balance = await this.panda?.getBalance();
        return {confirmed: 0, unconfirmed: balance!.satoshis};
    }

    override async getEstimateFee(tx: bsv.Transaction): Promise<number> {
        const size = tx.toBuffer().length;
        return Math.ceil(size * SATS_PER_KB / 1000);
    }

    override async getFeePerKb(): Promise<number> {
        return SATS_PER_KB;
    }

    override async getTransaction(txHash: string): Promise<TransactionResponse> {
        const API = this.network === bsv.Networks.mainnet ? ONESAT_MAIN : ONESAT_TEST;
        const resp = await fetch(`${API}/rest/tx/${txHash}.bin`);
        if(!resp.ok) {
            throw new Error(`${resp.status} ${resp.statusText}`);
        }
        return new bsv.Transaction(
            Buffer.from(await resp.arrayBuffer()).toString('hex')
        );
    }

    // override isConnected(): boolean {
    //     return true
    // }

    override async listUnspent(address: bsv.Address, options?: UtxoQueryOptions | undefined): Promise<bsv.Transaction.IUnspentOutput[]> {
        const addresses = await this.panda?.getAddresses();
        const utxos = (await this.panda?.getPaymentUtxos()) || [];
        return utxos.map(u => ({
            txId: u.txid,
            outputIndex: u.vout,
            satoshis: u.satoshis,
            address: addresses?.bsvAddress,
            script: u.script,
        }))
    }

    override async sendRawTransaction(rawtx: string): Promise<string> {
        console.log('sendRawTransaction', rawtx)
         const txid = await this.panda?.broadcast({rawtx});
         return txid!;
    }

    override async sendTransaction(tx: bsv.Transaction): Promise<string> {
        return this.sendRawTransaction(tx.toBuffer().toString('hex'));
    }
}