import { PandaSigner } from "scrypt-ts";

type InventoryProps = {
    signer: PandaSigner | undefined
}

const Inventory = (props: InventoryProps) => {
    return (
        <div>
        inventory
        </div>
    );
}

export default Inventory