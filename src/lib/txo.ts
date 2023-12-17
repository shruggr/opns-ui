export class InscriptionData {
    type?: string = '';
    data?: Buffer = Buffer.alloc(0);
}

export class Origin {
    outpoint: string = '';
    data?: TxoData;
    num?: number;
    map?: { [key: string]: any };
}

export enum Bsv20Status {
    Invalid = -1,
    Pending = 0,
    Valid = 1
}

export class TxoData {
    types?: string[];
    insc?: Inscription;
    map?: { [key: string]: any };
    b?: File;
    sigma?: Sigma[];
    list?: {
        price?: number;
        payout?: string;
    };
    bsv20?: {
        id?: string;
        p?: string;
        op?: string;
        tick?: string;
        sym?: string;
        amt?: string;
        status?: Bsv20Status;
        implied?: boolean; 
    };
    lock?: {
        address: string;
        until: number;
    };
    sigil?: {[key: string]: any};
    opns?: {
        genesis?: string;
        domain?: string;
        status?: number;
    };
    opnsMine?: {
        genesis?: string;
        domain?: string;
        status?: number;
        pow?: string;
    };
}

export class File {
    hash?: string;
    size?: number;
    type?: string;
}

export interface Sigma {
    algorithm?: string;
    address?: string;
    signature?: string;
    vin?: number;
}

export interface Inscription {
    json?: any;
    text?: string;
    words?: string[];
    file?: File;
}
export class Txo {
    txid: string = '';
    vout: number = 0;
    outpoint: string = '';
    satoshis: number = 0;
    accSats: number = 0;
    owner?: string;
    script?: string;
    spend?: string;
    origin?: Origin;
    height: number = 0;
    idx: number = 0;
    data?: TxoData;
}