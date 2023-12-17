import { PandaSigner } from "scrypt-ts/dist/bsv/signers/panda-signer"
import { usePandaWallet } from 'panda-wallet-provider';
import { bsv } from "scrypt-ts";
import { PandaSCryptProvider } from "./panda-scrypt-provider";
import { useState } from 'react';
import Search from "./components/search";
import Inventory from "./components/inventory";

const App = () => {
  const wallet = usePandaWallet();
  const [signer, setSigner] = useState<PandaSigner>();
  const [tab, setTab] = useState<string>("mine");

  const handleTabClick = (selectedTab: string) => {
    setTab(selectedTab);
  };
  
  const connect = async () => {
    // await wallet.connect()
    const provider = new PandaSCryptProvider(wallet, bsv.Networks.testnet)
    const signer = new PandaSigner(provider)   // <---- use `PandaSigner`
    const { isAuthenticated, error } = await signer.requestAuth()
    setSigner(signer)
    if (!isAuthenticated) {
      throw new Error(`Unauthenticated: ${error}`)
    }
  };

  return (
    // build template using tailwindcss which has a header at the top of the page, a footer centered at the bottom of the page, and a main section in the middle of the page
    <div className="flex flex-col h-screen justify-between">
      <header className="bg-gray-800 text-white text-center text-2xl py-4">
        OpNS
        <p className="text-sm">Mine your name.</p>
      </header>
      <main className="flex-col h-screen w-full">
        <div className="p-10 w-1/2">
        {
          !signer ?
          (<button className="btn btn-outline" onClick={connect}>
            <img src="/logo192.png" alt="Connect to Panda"/>
          </button>) :
          (<div>
            <div role="tablist" className="tabs tabs-bordered">
              <div
                role="tab"
                className={`tab ${tab === "mine" ? "tab-active" : ""}`}
                onClick={() => handleTabClick("mine")}
              >
                Mine
              </div>
              <div
                role="tab"
                className={`tab ${tab === "inventory" ? "tab-active" : ""}`}
                onClick={() => handleTabClick("inventory")}
              >
                Inventory
              </div>
            </div>
            <div className="p-10">
            { tab === 'mine' ?
              <Search signer={signer}/> :
              <Inventory  signer={signer}/>
            }
            </div>
          </div>)
        }
        </div>
      </main>
      <footer className="bg-gray-800 text-white text-center text-sm py-3">
        ¯\_(ツ)_/¯
      </footer>
    </div>
  );
};

export default App;
