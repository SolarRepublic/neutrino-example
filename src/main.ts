import {json_to_bytes} from '@blake.regalia/belt';
import {Wallet, broadcast_result, create_and_sign_tx_direct} from '@solar-republic/neutrino';
import {encodeGoogleProtobufAny} from '@solar-republic/cosmos-grpc/google/protobuf/any';
import {queryCosmosBankAllBalances} from '@solar-republic/cosmos-grpc/cosmos/bank/v1beta1/query';
import {SI_MESSAGE_TYPE_COSMWASM_WASM_MSG_EXECUTE_CONTRACT, encodeCosmwasmWasmMsgExecuteContract} from '@solar-republic/cosmos-grpc/cosmwasm/wasm/v1/tx';

const privateKey = await crypto.getRandomValues(new Uint8Array(32));

const lcdUrl = 'https://rest.cosmos.directory/juno';
const rpcUrl = 'https://rpc.cosmos.directory/juno';

const junoWallet = await Wallet(privateKey, 'juno-1', lcdUrl, rpcUrl);

const [httpResponse, resultText, resultStruct] = await queryCosmosBankAllBalances(junoWallet.lcd, junoWallet.addr);

if(!resultStruct?.balances?.length) {
	throw Error(`Account ${junoWallet.addr} has no balances`);
}

const message = encodeGoogleProtobufAny(
	SI_MESSAGE_TYPE_COSMWASM_WASM_MSG_EXECUTE_CONTRACT,
	encodeCosmwasmWasmMsgExecuteContract(
		junoWallet.addr,
		'juno1anh4pf98fe8uh64uuhaasqdmg89qe6kk5xsklxuvtjmu6rhpg53sj9uejj',
		json_to_bytes({
			mint: {
				token_id: '1',
			},
		})
	)
)

const gasLimit = 150_000n;
const gasAmount = Math.ceil(Number(gasLimit) * 0.125);

const [txRawBytes, signDoc, txHash] = await create_and_sign_tx_direct(junoWallet, [message], [[`${gasAmount}`, 'ujuno']], `${gasLimit}`);

const [errorCode, responseText, result] = await broadcast_result(junoWallet, txRawBytes, txHash);

if(result) {
	console.log(`Gas used: ${result.result?.gas_used}`);
}
