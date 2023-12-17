import React, { useState } from 'react';
import { PandaSigner } from "scrypt-ts/dist/bsv/signers/panda-signer"
import Available from './available';
import { lookupOpNS } from '../lib/opns';

type MineProps = {
    signer: PandaSigner | undefined
}

const Search = (props: MineProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [found, setFound] = useState<boolean | undefined>(undefined);

    const search = () => {
        lookupOpNS(searchTerm).then(txo => setFound(!!txo))
    }


    return (
        <div>
            <div className="w-full max-w-sm">
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-2/3">
                        <input className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
                            type="text" value={searchTerm} 
                            onChange={e => {setSearchTerm(e.target.value); setFound(undefined)}}
                            onKeyDown={e => {if (e.key === 'Enter') search()}}
                            placeholder="Name..." />
                    </div>
                    <div className="md:w-1/3">
                        <button className="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded" 
                            type="button" onClick={search}>
                            Search
                        </button>
                    </div>
                </div>
            </div>
            {found === undefined ? '' : found ? 
                (<div id="exists"><span>{searchTerm}</span> has already been claimed.</div>) :    
                (<Available name={searchTerm} signer={props.signer} />)
            }
        </div>
    );
}


export default Search;