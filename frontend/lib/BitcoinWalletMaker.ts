/**
 * ===========================================================
 * @file BitcoinWalletMaker.ts
 * @description BWMの自作クラス
 * @author tono(gs-mister)
 * ===========================================================

	代替モジュール(PaulMiller氏)
	cd frontend
	npm install @noble/hashes
	npm install @noble/secp256k1
	npm install @noble/curves
	npm install @scure/base
	※ curvesの58は非推奨になった
	※ nobleシリーズは重いため指定方法が厳格（ファイル名指定）
*/
import { sha256 }         	from '@noble/hashes/sha2.js';
import { ripemd160 }      	from '@noble/hashes/legacy.js';
import { secp256k1 }      	from '@noble/curves/secp256k1.js';
import { concatBytes }		from '@noble/hashes/utils.js';
import { base58, bech32 } 	from '@scure/base';
export default class BitcoinWalletMaker {

	coincurve_flg:			boolean		= false;
	compress_flg:			boolean		= true;
	analog_random_seed:		Uint8Array  = new Uint8Array(0);
	hardware_random_seed:	Uint8Array  = new Uint8Array(0);
	mixed_random_seed:		Uint8Array  = new Uint8Array(0);
	btc_private_key:		Uint8Array  = new Uint8Array(0);
	btc_public_key:			Uint8Array  = new Uint8Array(0);
	btc_hash160_key:		Uint8Array  = new Uint8Array(0);
	btc_wallet_address:		string		= "";
	btc_wif_key:			string		= "";
	user_wif_key:			string		= "";
	salvage_private_key:	Uint8Array	= new Uint8Array(0);

	constructor(){ }

	// JS用ランダムバイナリ生成
	makeRandom(num:number) {
  		const uint8Array = new Uint8Array(num);
  		window.crypto.getRandomValues(uint8Array);
  		return uint8Array;
	}
	// JS用hex変換
	toHex(rand:Uint8Array) {
		return Array.from(rand).map(b => b.toString(16).padStart(2, '0')).join('');
	}
	/* from Python ---------------------------
	def set_analog_random_seed(self,data):
		if isinstance(data, str) or isinstance(data, int):
			self.analog_random_seed = data.encode("utf-8")
			return self.analog_random_seed.hex()
		if isinstance(data, bytes):
			raise TypeError("Invalid type")
			sys.exit()
	*/
	set_analog_random_seed(data:unknown){
		if (typeof data === 'string' || (typeof data === 'number' && Number.isInteger(data))){
			// encodeがないのでUTF-8化はTextEncoderで
			const stringData = String(data); 
    		const encoder = new TextEncoder();
    		this.analog_random_seed = encoder.encode(stringData);
			return this.toHex(this.analog_random_seed);
		}
		if (data instanceof Uint8Array){
			throw new Error("Invalid type");
		}
	}
	/* from Python ---------------------------
	def make_hardware_random_seed(self):
		self.hardware_random_seed = os.urandom(32)
		return self.hardware_random_seed.hex()
	*/
	make_hardware_random_seed(){
		this.hardware_random_seed = this.makeRandom(32)
		return this.toHex(this.hardware_random_seed);
	}
	/* from Python ---------------------------
	def make_mixed_random_seed(self):
		timestamp              = time.time_ns()
		timestamp_bytes        = struct.pack('>Q',timestamp)
		self.mixed_random_seed = self.analog_random_seed + self.hardware_random_seed + timestamp_bytes
		return self.mixed_random_seed.hex()
	*/
	make_mixed_random_seed(){
		// timestamp = time.time_ns()
		const nowMs = Date.now();
		const highRes = performance.now();
		const fractionalMs = highRes - Math.floor(highRes);
		const timestampBigInt = BigInt(nowMs) * 1000000n + BigInt(Math.floor(fractionalMs * 1000000));
		// timestamp_bytes = struct.pack('>Q',timestamp)
		const timestampBuffer = new ArrayBuffer(8);
		const view = new DataView(timestampBuffer);
		view.setBigUint64(0, timestampBigInt, false); // false = ビッグエンディアン
		const timestamp_bytes = new Uint8Array(timestampBuffer);
		// 文字列結合
		const totalLength = this.analog_random_seed.length + this.hardware_random_seed.length + timestamp_bytes.length;
		const combined = new Uint8Array(totalLength);
		let offset = 0;
		combined.set(this.analog_random_seed, offset);
		offset += this.analog_random_seed.length;
		combined.set(this.hardware_random_seed, offset);
		offset += this.hardware_random_seed.length;
		combined.set(timestamp_bytes, offset);
		this.mixed_random_seed = combined;
		return this.toHex(this.mixed_random_seed);
	}
	/* from Python ---------------------------
	def make_btc_private_key(self):
		target_bytes = self.mixed_random_seed
		target_bytes = hashlib.sha256(target_bytes).digest()
		self.btc_private_key = target_bytes
		return self.btc_private_key.hex()
	*/
	make_btc_private_key(){
		let target_bytes = this.mixed_random_seed;
		target_bytes = sha256(target_bytes); // 自動でバイナリで返ります
		this.btc_private_key = target_bytes;
		return this.toHex(this.btc_private_key);
	}
	/* from Python ---------------------------
	def check_btc_private_key(self):
		if self.coincurve_flg:
			try:
				private_key_obj = PrivateKey(self.btc_private_key)
				return True
			except Exception as e:
				return False
		else:
			try:
				private_key_obj = ecdsa.SigningKey.from_string(self.btc_private_key, curve=ecdsa.SECP256k1)
				return True
			except Exception as e:
				return False
	*/
	check_btc_private_key(){
		try {
			if (secp256k1.utils.isValidSecretKey(this.btc_private_key)) {
				return true;
			}
			return false;
		}catch{
			return false;
		}
	}
	/* from Python ---------------------------
	def make_btc_public_key(self):
		if self.coincurve_flg:
			public_key_obj = PrivateKey(self.btc_private_key).public_key
			if self.compress_flg:
				self.btc_public_key = public_key_obj.format(compressed=True)
			else:
				self.btc_public_key = public_key_obj.format(compressed=False)
		else:
			private_key_obj = ecdsa.SigningKey.from_string(self.btc_private_key, curve=ecdsa.SECP256k1)
			public_key_obj  = private_key_obj.get_verifying_key()
			if self.compress_flg:
				self.btc_public_key = public_key_obj.to_string("compressed")
			else:
				self.btc_public_key = public_key_obj.to_string("uncompressed")
		return self.btc_public_key.hex()
	*/
	make_btc_public_key(){
		const isCompressed = this.compress_flg ? true : false;
		const pubKeyBytes = secp256k1.getPublicKey(this.btc_private_key, isCompressed);
		this.btc_public_key = pubKeyBytes;
		return this.toHex(this.btc_public_key);
	}
	/* from Python ---------------------------
	def make_btc_hash160_key(self):
		sha256_key           = hashlib.sha256(self.btc_public_key).digest()
		hash160_key          = hashlib.new('ripemd160',sha256_key).digest()
		self.btc_hash160_key = hash160_key
		return self.btc_hash160_key.hex()
	*/
	make_btc_hash160_key(){
		const sha256_key = sha256(this.btc_public_key);
		const hash160_key = ripemd160(sha256_key);
		this.btc_hash160_key = hash160_key
		return this.toHex(this.btc_hash160_key);
	}
	/* from Python ---------------------------
	def make_btc_wallet_address(self,test_flg=False):
		five_bit_words          = bech32.convertbits(self.btc_hash160_key,8,5)
		if test_flg:
			self.btc_wallet_address = bech32.bech32_encode("tb",[0]+five_bit_words)
		else:
			self.btc_wallet_address = bech32.bech32_encode("bc",[0]+five_bit_words)
		return self.btc_wallet_address
	*/
	make_btc_wallet_address(test_flg:boolean=false){
		const five_bit_words = bech32.toWords(this.btc_hash160_key);
		const wordsWithVersion = [0, ...five_bit_words];
		if (test_flg){
			this.btc_wallet_address = bech32.encode("tb", wordsWithVersion);
		} else {
			this.btc_wallet_address = bech32.encode("bc", wordsWithVersion);
		}
		return this.btc_wallet_address;
	}
	/* from Python ---------------------------
	def make_btc_wif_key(self):
		private_key_with_info = b'\x80' + self.btc_private_key
		if self.compress_flg:
			private_key_with_info = private_key_with_info + b'\x01'
		first_sha256     = hashlib.sha256(private_key_with_info).digest()
		second_sha256    = hashlib.sha256(first_sha256).digest()
		checksum         = second_sha256[:4]
		final_bytes      = private_key_with_info + checksum
		self.btc_wif_key = base58.b58encode(final_bytes).decode('UTF-8')
		return self.btc_wif_key
	*/
	make_btc_wif_key(){
		let private_key_with_info = concatBytes(new Uint8Array([0x80]), this.btc_private_key);
		if (this.compress_flg) {
			private_key_with_info = concatBytes(private_key_with_info, new Uint8Array([0x01]));
		}
		const first_sha256  = sha256(private_key_with_info);
		const second_sha256 = sha256(first_sha256);
		const checksum = second_sha256.slice(0, 4);
		const final_bytes = concatBytes(private_key_with_info, checksum);
		this.btc_wif_key = base58.encode(final_bytes);
		return this.btc_wif_key;
	}
	/* from Python ---------------------------
	def set_user_wif_key(self,target_wif_key):
		self.user_wif_key = target_wif_key
	*/
	set_user_wif_key(target_wif_key:string){
		this.user_wif_key = target_wif_key
	}
	/* from Python ---------------------------
	def salvage_private_key_from_wif_key(self):
		try:
			private_key_bytes = base58.b58decode(self.user_wif_key)
			self.salvage_private_key = private_key_bytes[1:33]
			return self.salvage_private_key.hex()
		except Exception as e:
			return False
	*/
	salvage_private_key_from_wif_key(){
		try {
			const private_key_bytes = base58.decode(this.user_wif_key);
			this.salvage_private_key = private_key_bytes.slice(1, 33);
			return this.toHex(this.salvage_private_key);
		} catch {
			return false;
		}
	}
	/* from Python ---------------------------
	def bdisp(self,target_byte):
		return "".join(f"\\x{b:02x}" for b in target_byte)
	*/
	bdisp(target_byte:Uint8Array){
		return Array.from(target_byte).map(b => `\\x${b.toString(16).padStart(2, '0')}`).join('');
	}
	/* from Python ---------------------------
	def get_all(self):
		print(self.btc_wallet_address)
		box = {}
		box['btc_wallet_address'] = self.btc_wallet_address
		box['btc_wif_key']        = self.btc_wif_key
		box['btc_private_key']    = self.btc_private_key
		box['btc_public_key']     = self.btc_public_key
		return box
	*/
	get_all(){
		const box = {
			btc_wallet_address: this.btc_wallet_address,
			btc_wif_key: this.btc_wif_key,
			btc_private_key: this.btc_private_key,
			btc_public_key: this.btc_public_key
		};
		return box;
	}
}
