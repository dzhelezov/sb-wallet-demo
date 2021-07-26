"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.balancesTransfer = void 0;
const tslib_1 = require("tslib");
const model_1 = require("../generated/graphql-server/model");
// run 'NODE_URL=<RPC_ENDPOINT> EVENTS=<comma separated list of events> yarn codegen:mappings-types'
// to genenerate typescript classes for events, such as Balances.TransferEvent
const types_1 = require("./generated/types");
const bn_js_1 = tslib_1.__importDefault(require("bn.js"));
async function getOrCreate(e, id, store) {
    let entity = await store.get(e, {
        where: { id },
    });
    if (entity === undefined) {
        entity = new e();
        entity.id = id;
    }
    return entity;
}
async function balancesTransfer({ store, event, block, extrinsic, }) {
    const [from, to, value] = new types_1.Balances.TransferEvent(event).params;
    const fromAcc = await getOrCreate(model_1.Account, from.toHex(), store);
    fromAcc.wallet = from.toHuman();
    const tip = extrinsic ? new bn_js_1.default(extrinsic.tip.toString(10)) : new bn_js_1.default(0);
    fromAcc.balance = fromAcc.balance || new bn_js_1.default(0);
    fromAcc.balance = fromAcc.balance.sub(value);
    fromAcc.balance = fromAcc.balance.sub(tip);
    await store.save(fromAcc);
    const toAcc = await getOrCreate(model_1.Account, to.toHex(), store);
    toAcc.wallet = to.toHuman();
    toAcc.balance = toAcc.balance || new bn_js_1.default(0);
    toAcc.balance = toAcc.balance.add(value);
    await store.save(toAcc);
    const hbFrom = new model_1.HistoricalBalance();
    hbFrom.account = fromAcc;
    hbFrom.balance = fromAcc.balance;
    hbFrom.timestamp = new bn_js_1.default(block.timestamp);
    await store.save(hbFrom);
    const hbTo = new model_1.HistoricalBalance();
    hbTo.account = toAcc;
    hbTo.balance = toAcc.balance;
    hbTo.timestamp = new bn_js_1.default(block.timestamp);
    await store.save(hbTo);
}
exports.balancesTransfer = balancesTransfer;
