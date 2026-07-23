# BitcoinWalletMaker
Pythonで作成したビットコインアドレス発行ロジックをWEBに移植してみました。個人的な技術キャッチアップのためNext.jsで作成しています。<br />

## デモページ
URL(未定)<br />

## 技術スタック
| カテゴリ            | 技術               | バージョン          |
| ----               | ----               | ----               |
| Frontend           | **Next.js**        | 16.2               |
| Library            | **React**          | 19.2               |
| Language           | **TypeScript**     | 5.x                |
| CI/CD              | **GitHubActions**  |                    |
| LiveServer         | **GitHubPages**    |                    |

## アプリの概要
乱数として適当な文字列を入力することでビットコインアドレスを導出することができます。<br />

## 開発の背景
Python×ラズパイで制作したハードウォレット(隔離デバイス)から移植したもので、
本来の機能としては描画から座標を作成し、OS乱数とミックスして乱数を発行する形になっています。<br />
しかし、デバイスの側にハッシュ改ざんなどが仕込まれていれば、乗っ取りを防ぐことができません。<br />
そこでWEB版ではあえて乱数を手入力化し、隔離デバイスとSHA256の結果を比較できるツールにしました。<br />

## スクリプト
#### 主要動作部品類(/frontend/)
 - lib/BitcoinWalletMaker.ts >自作class
 - lib/BWMtest.mjs           >classのテスト
 - app/page.tsx              >主要スクリプト
#### サーバー設定類(ルート)
 - .github/workflows/deploy-test.yml  >デプロイ
#### 代替モジュール
| モジュール          | バージョン          | 目的               |
| ----               | ----               | ----               |
| **noble/hashes**   | 2.2                | 乱数生成            |
| **noble/curves**   | 2.2                | 鍵                 |
| **scure/base**     | 2.2                | WIF                |

Created by Paul Miller 氏 (MIT License)

## ライセンス
個人的なものなので配布等は行っておりません。