/**
 * ===========================================================
 * @file BWMtest.mjs
 * @description BWMクラスの単体テスト
 * @author tono(gs-mister)
 * ===========================================================

    cd frontend
    node ./lib/BWMtest.mjs
*/
// シードを手入力
const debug_random_seed = "test";

console.log("======================================");
console.log("BitcoinWalletMaker 単体テスト開始");
console.log("======================================");
import BitcoinWalletMaker from './BitcoinWalletMaker.ts'; 
const BWM = new BitcoinWalletMaker();
console.log("debug_make");
console.log("　0v Native SegWit (Bech32)");
let uselib;
if(BWM.coincurve_flg){ uselib = "coincurve";
} else {               uselib = "esdsa"; }
console.log("　libraly：" + uselib);
let compress;
if(BWM.compress_flg){  compress = "ON";
} else {               compress = "OFF"; }
console.log("　compress：" + compress);
console.log("　　run...");

// 乱数をバイナリにしてmix済みとしてセット
const encoder = new TextEncoder("utf-8");
const decoder = new TextDecoder("utf-8");
const debug_random_seed_bytes = encoder.encode(debug_random_seed);
BWM.mixed_random_seed  = debug_random_seed_bytes;
console.log("　　　seed_bytes：" + BWM.bdisp(debug_random_seed_bytes));
console.log("　　　(hex) " + BWM.toHex(debug_random_seed_bytes));
console.log("　　　(str) " + decoder.decode(debug_random_seed_bytes));
console.log("");

// 秘密鍵発行
BWM.make_btc_private_key();
console.log("　　　　private_key_bytes：" + BWM.bdisp(BWM.btc_private_key));
console.log("　　　　(hex) " + BWM.toHex(BWM.btc_private_key));
console.log("　　　　(cnt) " + (BWM.toHex(BWM.btc_private_key).length / 2) + " bytes / correct 32 bytes");
console.log("");

// 秘密鍵チェック
if (!BWM.check_btc_private_key()){
	throw new Error("private key curve error.");
}

// 公開鍵発行
BWM.make_btc_public_key();
console.log("　　　　　public_key_bytes：" + BWM.bdisp(BWM.btc_public_key));
console.log("　　　　　(hex) " + BWM.toHex(BWM.btc_public_key));
console.log("　　　　　(cnt) " + (BWM.toHex(BWM.btc_public_key).length / 2) + " bytes / correct 65 bytes compress correct 33 bytes");
console.log("");

// hash160発行
BWM.make_btc_hash160_key();
console.log("　　　　　　public_key_bytes：" + BWM.bdisp(BWM.btc_hash160_key));
console.log("　　　　　　(hex) " + BWM.toHex(BWM.btc_hash160_key));
console.log("　　　　　　(cnt) " + (BWM.toHex(BWM.btc_hash160_key).length / 2) + " bytes / correct 20 bytes");
console.log("");

// アドレス発行
BWM.make_btc_wallet_address()
console.log("　　　　　　　wallet_address：" + BWM.btc_wallet_address);
console.log("　　　　　　　(cnt) " + (BWM.toHex(BWM.btc_wallet_address).length / 2) + " string / correct 42 string");
console.log("");

// WIF鍵発行
BWM.make_btc_wif_key()
console.log("　　　　　　　　wif_key：" + BWM.btc_wif_key);
console.log("　　　　　　　　(cnt) " + (BWM.toHex(BWM.btc_wif_key).length / 2) + " string / correct 51 string compress correct 52 string");
console.log("");