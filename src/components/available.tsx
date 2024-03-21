import { bsv, MethodCallOptions, PandaSigner, toByteString } from "scrypt-ts"
import { fetchOpNS, lookupOpNS } from "../lib/opns";
import { useState } from "react";
import { OpNS } from "../contracts/opns";
import artifact from '../../artifacts/opns.json'
import { usePandaWallet } from "panda-wallet-provider";
import { PandaSCryptProvider } from "../panda-scrypt-provider";

const FEE = 25;
const Available = (props: { name: string, signer?: PandaSigner }) => {
    const [miner, setMiner] = useState<Worker | undefined>();
    const [attempts, setAttempts] = useState<number>(0);
    const [name, setName] = useState<string>(props.name);
    const [nonce, setNonce] = useState<Uint8Array>();
    const [nonceStr, setNonceStr] = useState<string>('');
    const wallet = usePandaWallet();

    const mine = async () => {
        OpNS.loadArtifact(artifact)
        let toMine = ''
        let name = props.name
        let txo = await lookupOpNS(name);
        if (txo) return;
        while (!txo && name.length > 0) {
            toMine = name.slice(-1) + toMine;
            name = name.slice(0, -1);
            txo = await lookupOpNS(name);
        }
        if (!txo) {
            alert("Mine not found")
            return;
        }

        let char = ''
        const miner = new Worker(
            new URL('../lib/opns.ts', import.meta.url),
            { type: 'module' }
        )
        setMiner(miner);
        for (let i = 0; i < toMine.length; i++) {
            char = toMine.slice(i, i + 1)
            setName(name + char)
            miner!.postMessage({ type: 'mine', txo, char })
            const nonce = await new Promise((resolve, reject) => {
                miner!.onmessage = ({ data }) => {
                    switch (data.type) {
                        case 'found':
                            resolve(data.nonce);
                            break;
                        case 'error':
                            reject(data.error);
                            break;
                        case 'attempts':
                            setAttempts(data.attempts);
                            break;
                    }
                }
            }) as Uint8Array;
            // setNonce(nonce as Uint8Array);
            // setNonceStr(Buffer.from(nonce as Uint8Array).toString('hex'));
            txo = await fetchOpNS(txo.outpoint)
            const opNS = OpNS.fromUTXO({
                txId: txo.txid,
                outputIndex: txo.vout,
                script: Buffer.from(txo.script!, 'base64').toString('hex'),
                satoshis: txo!.satoshis,
            })

            try {
                if (!(await wallet.isConnected())) {
                    await wallet.connect()
                }
                // await wallet.connect()
                // const provider = new PandaSCryptProvider(wallet, bsv.Networks.mainnet)
                // const signer = new PandaSigner(provider)   // <---- use `PandaSigner`
                // const { isAuthenticated, error } = await signer.requestAuth()
                // if (!isAuthenticated) {
                //     throw new Error(`Unauthenticated: ${error}`)
                // }
                const signer = props.signer!

                await opNS.connect(signer!)
                opNS.bindTxBuilder('mint', OpNS.mintTxBuilder)
                const bsvAddress = await signer.getDefaultAddress()
                const ordAddress = await signer!.getOrdAddress()
                const utxos = await signer!.provider!.listUnspent(bsvAddress)
                const utxo = utxos.find(utxo => utxo.satoshis > FEE)
                const changeOutput = utxo!.satoshis > FEE ?
                    new bsv.Transaction.Output({
                        script: bsv.Script.buildPublicKeyHashOut(bsvAddress),
                        satoshis: utxo!.satoshis - FEE,
                    }).toBufferWriter().toBuffer().toString('hex') :
                    '';

                const tx = new bsv.Transaction();
                tx.from(utxo!);

                const { tx: callTx, atInputIndex } = await opNS.methods.mint(
                    BigInt(char.charCodeAt(0)),
                    toByteString(Buffer.from(nonce).toString('hex')),
                    toByteString(bsv.Script.fromAddress(ordAddress).toHex()),
                    toByteString(changeOutput),
                    {
                        // partiallySigned: true,
                        partialContractTx: {
                            atInputIndex: 0,
                            tx,
                        },
                        pubKeyOrAddrToSign: bsvAddress
                    } as MethodCallOptions<OpNS>
                );

                let result = callTx.verifyScript(atInputIndex);
                console.log("Result:", callTx.id, result, callTx.serialize());
                const resp = await fetch('https://ordinals.gorillapool.io/api/tx/bin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/octet-stream',
                    },
                    body: callTx.toBuffer(),
                })

                if (!resp.ok) {
                    throw new Error('Failed to broadcast transaction')
                } else {

                }

                //   const response = await wallet.broadcast({rawtx: callTx.serialize()})
                console.log(await resp.json())
            } catch (e) {
                console.error(e)
                return
            }
        }
    }
    return (
        <div>
            <div className="w-full max-w-sm">
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-2/3">
                        <strong>{props.name}</strong> is available!
                    </div>
                    <div className="md:w-1/3">
                        <button className="btn btn-primary btn-outline"
                            onClick={mine}>
                            Mine It
                        </button>
                    </div>
                </div>
            </div>
            {!attempts ? '' : nonce ?
                (<div>{nonceStr}</div>) :
                (<Mining miner={miner!} name={name} attempts={attempts} />)}

        </div>
    )
}

const Mining = (props: { miner: Worker; name: string, attempts: number }) => {
    return (
        <div>
            <h3>Mining...</h3>
            <div className="w-full max-w-sm">
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-1/3">
                        Name
                    </div>
                    <div className="md:w-2/3">
                        {props.name}
                    </div>
                </div>
            </div>
            <div className="w-full max-w-sm">
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-1/3">
                        Hashes
                    </div>
                    <div className="md:w-2/3">
                        {props.attempts}
                    </div>
                </div>
            </div>
            <div className="w-full max-w-sm">
                <button className="btn btn-primary btn-outline"
                    onClick={() => props.miner.terminate()}>
                    Cancel
                </button>
            </div>
        </div>
    )
}
export default Available