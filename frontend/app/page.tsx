/**
 * ===========================================================
 * @file page.tsx
 * @description BWMのメイン処理
 * @author tono(gs-mister)
 * ===========================================================
*/
"use client";

import { useState } from 'react';
import BitcoinWalletMaker from '@/lib/BitcoinWalletMaker'; // export default なので{}なし

// sleep関数：ミリ秒(ms)だけ停止させる
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Step {
  id: number;
  label: string;
  status: 'idle' | 'running' | 'success';
  detail?: string;
}

export default function ModernWalletPage() {

  /*
  inputText:    ユーザー入力
  isProcessing: 計算中フラグ
  wallet:       最終値
  */
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [wallet, setWallet] = useState<{ address: string; secretKey: string } | null>(null);

  const [steps, setSteps] = useState<Step[]>([
    { id: 1, label: '秘密鍵の生成(SHA-256)',       status: 'idle' },
    { id: 2, label: '公開鍵の導出 (Secp256k1)',    status: 'idle' },
    { id: 3, label: '公開鍵のハッシュ化(hash160)',  status: 'idle' },
    { id: 4, label: 'ビットコインアドレス(Bech32)', status: 'idle' },
    { id: 5, label: 'WIF鍵(圧縮形式)',             status: 'idle' },
  ]);

  // onClickで起動する処理
  const handleGenerate = async () => {
    if (!inputText) return;

    setIsProcessing(false);
    setWallet(null);
    
    // 上書きした新配列をmapで渡す
    setSteps(prev => prev.map(s => ({ ...s, status: 'idle', detail: undefined })));
    setIsProcessing(true);

    // 自作クラス
    const BWM = new BitcoinWalletMaker();
    
    // 今回は直接入力なのでmixed_random_seedにバイナリで割り込ませます。
    const encoder = new TextEncoder();
    const stringData = String(inputText);
    const inputTextBytes = encoder.encode(stringData);
    BWM.mixed_random_seed = inputTextBytes;

    try {
      // --- make_btc_private_key ---
      setSteps(prev => prev.map(s => s.id === 1 ? { ...s, status: 'running' } : s));
      const private_key = BWM.make_btc_private_key();
      const private_key_byte = BWM.bdisp(encoder.encode(private_key));
      await sleep(1200);
      setSteps(prev => prev.map(s => s.id === 1 ? { ...s, status: 'success', detail:
        `Hex: ${private_key.substring(0, 36)}...
        Byte: ${private_key_byte.substring(0, 24)}...`
      } : s));

      // --- make_btc_public_key ---
      setSteps(prev => prev.map(s => s.id === 2 ? { ...s, status: 'running' } : s));
      await sleep(1500); 
      const public_key = BWM.make_btc_public_key(); 
      const public_key_byte = BWM.bdisp(encoder.encode(public_key));
      setSteps(prev => prev.map(s => s.id === 2 ? { ...s, status: 'success', detail: 
        `Hex: ${public_key.substring(0, 36)}...
        Byte: ${public_key_byte.substring(0, 24)}...`
      } : s));

      // --- make_btc_hash160_key ---
      setSteps(prev => prev.map(s => s.id === 3 ? { ...s, status: 'running' } : s));
      await sleep(1000);
      const hash160_key = BWM.make_btc_hash160_key();
      const hash160_key_byte = BWM.bdisp(encoder.encode(hash160_key));
      setSteps(prev => prev.map(s => s.id === 3 ? { ...s, status: 'success', detail:
        `Hex: ${hash160_key.substring(0, 36)}...
        Byte: ${hash160_key_byte.substring(0, 24)}...`
      } : s));

      // --- make_btc_wallet_address ---
      setSteps(prev => prev.map(s => s.id === 4 ? { ...s, status: 'running' } : s));
      await sleep(1000);
      const wallet_address = BWM.make_btc_wallet_address();
      setSteps(prev => prev.map(s => s.id === 4 ? { ...s, status: 'success', detail:
        `${wallet_address}`
      } : s));

      // --- make_btc_wif_key ---
      setSteps(prev => prev.map(s => s.id === 5 ? { ...s, status: 'running' } : s));
      await sleep(1000);
      const wif_key = BWM.make_btc_wif_key();
      setSteps(prev => prev.map(s => s.id === 5 ? { ...s, status: 'success', detail:
        `${wif_key}`
      } : s));

      // 最後にウォレットデータを表示
      setWallet({ address: wallet_address, secretKey: wif_key });

    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0d14', color: '#f3f4f6', 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>

      <div style={{ width: '100%', maxWidth: '550px', background: '#111622', border: '1px solid #1e293b', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          個人検証用 Bitcoin Wallet Maker
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px' }}>
          入力した文字を乱数としてビットコインウォレットを発行します。<br />
          ※ このアプリで作成したウォレットには送金しないでください。
        </p>

        {/* 入力エリア */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
            placeholder="乱数に設定するテキストを入力..."
            style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', background: '#1e2538', border: '1px solid #334155', color: '#fff', fontSize: '14px', outline: 'none' }}
          />
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !inputText}
            style={{
              padding: '12px 24px', borderRadius: '8px', background: '#2563eb', color: '#fff', fontSize: '14px', fontWeight: '600', border: 'none', cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing || !inputText ? 0.6 : 1, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
            }}
          >
            {isProcessing ? '計算中...' : '生成'}
          </button>
        </div>

        {/* 進行エリア */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: wallet ? '32px' : '0' }}>
          {steps.map((step) => (
            <div key={step.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', borderRadius: '12px',
              background: step.status === 'running' ? '#1e293b' : 'transparent',
              border: step.status === 'running' ? '1px solid #3b82f6' : '1px solid transparent',
              transition: 'all 0.3s ease'
            }}>
              {/* マーク */}
              <div style={{ marginTop: '3px' }}>
                {step.status === 'idle' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4b5563' }} />}
                {step.status === 'running' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6', animation: 'pulse 1.5s infinite' }} />}
                {step.status === 'success' && <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>✓</div>}
              </div>

              {/* 内容 */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: step.status === 'idle' ? '#6b7280' : '#f3f4f6' }}>
                  {step.label}
                </div>
                {step.detail && (
                  <div style={{ fontSize: '14px', color: '#9ca3af', fontFamily: 'monospace', marginTop: '4px', background: '#0a0d14', padding: '6px 10px', borderRadius: '4px', whiteSpace: 'pre-line', wordBreak: 'break-all' }}>
                    {step.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 結果エリア */}
        {wallet && (
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b, #111827)', border: '1px solid #4338ca', borderRadius: '12px', padding: '20px',
            animation: 'fadeIn 0.5s ease', fontFamily: 'monospace'
          }}>
            <div style={{ color: '#818cf8', fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>WALLET KEYPAIR</div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>ADDRESS (Public)</div>
              <div style={{ fontSize: '14px', color: '#34d399', wordBreak: 'break-all' }}>{wallet.address}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>WIF KEY (Secret)</div>
              <div style={{ fontSize: '14px', color: '#f87171', wordBreak: 'break-all' }}>{wallet.secretKey}</div>
            </div>
          </div>
        )}

      </div>

      {/* アニメーション用スタイルタグ */}
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

