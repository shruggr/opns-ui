import { EventEmitter } from "events";
import { Txo } from "./txo";
import { API } from './constants';

let opnsMiner = null;
onmessage = async ({data}) => {
    if(data.type !== 'mine') return;
    const { txo, char } = data;
    opnsMiner = new OpNSMiner(txo);
    opnsMiner.on('attempts', (attempts) => {
        postMessage({type: 'attempts', attempts})
    })
    try {
        await opnsMiner.mineChar(char);
        postMessage({type: 'found', nonce: opnsMiner.nonce});
    } catch(e: any) {
        postMessage({type: 'error', error: e.message});
    }
}


export const lookupOpNS = async (domain: string): Promise<Txo|undefined> => {
    let resp = await fetch(API + '/api/txos/search/unspent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ opnsMine: { domain, status: 1 } })
    });
    if (!resp.ok) {
        alert(`Error: ${resp.status} ${resp.statusText}`)
        return;
    }
    let [txo] = await resp.json();
    return txo;
}

export const fetchOpNS = async (outpoint: string): Promise<Txo> => {
    const resp = await fetch(`${API}/api/txos/${outpoint}?script=true`)
    if (!resp.ok) throw new Error(`Error: ${resp.status} ${resp.statusText}`)
    return resp.json();
}

export class OpNSMiner extends EventEmitter {
    pow: Buffer;
    name: string;
    outpoint: string;
    script: string;
    nonce: Uint8Array = new Uint8Array(8);

    constructor(public txo: Txo) {
        super();
        this.pow = Buffer.from(txo.data!.opnsMine!.pow!, "base64");
        this.name = txo.data!.opnsMine!.domain!;
        this.outpoint = txo.outpoint
        this.script = txo.script!
    }

    async mineChar(char: string): Promise<Uint8Array> {
        if (!char.match(/^[a-z0-9-]+$/)) {
            throw new Error("Invalid char: a-z, 0-9, -");
        }
        let hashAttempts = 0;
        const start = Date.now();
        let log = start;
        let pow = null;
        while (!pow) {
            if (Date.now() - log > 100) {
                this.emit('attempts', hashAttempts)
                log = Date.now();
            }
            hashAttempts++;

            crypto.getRandomValues(this.nonce);
            pow = await this.validatePoW(this.pow, char, this.nonce);
        }
        return this.nonce
    }

    async validatePoW(prevPow: Uint8Array, char: string, nonce:Uint8Array): Promise<Uint8Array | undefined> {
        const hash = await crypto.subtle.digest("SHA-256", 
            Buffer.concat([prevPow, Buffer.from(char, 'ascii'), nonce])
        );
        const pow = new Uint8Array(await crypto.subtle.digest("SHA-256", hash));
        // const pow = Hash.sha256Sha256(
        //     Buffer.concat([prevPow, Buffer.from(char, 'ascii'), nonce])
        // );

        const hex = Array.from(pow)
            .reverse()
            .map(b => b.toString(16).padStart(2, "0"))
            .join("")
        const test = BigInt(`0x${hex}`);
        const result = test >> 234n;
        if (result === 0n) return pow;
        return;
    }
}