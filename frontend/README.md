# traP Rooms Calendar frontend

旧 Blazor クライアントの 3 画面を、Next.js App Router の静的 export に移植しています。
画面データはブラウザーから proto 生成クライアントを通して取得します。ビルド時には API に接続しません。

## 開発・ビルド

リポジトリルートで実行します。pnpm workspace を使用します。

```sh
pnpm install
pnpm dev:frontend
pnpm build:frontend
```

dev / build / typecheck / test の前に proto から TypeScript を生成します。
生成だけ実行する場合は `pnpm generate:api` を使用してください。

出力先は `frontend/out/` です。Next.js の実行サーバーは不要です。
静的配信側で各ディレクトリの `index.html` を配信してください。

- `/` — 今後の進捗部屋・開催中イベント
- `/vacancies/` — 大学の空き教室
- `/settings/ical/` — カレンダー配信 URL・コピー・トークン再生成

ローカルで静的出力を確認する例:

```sh
python3 -m http.server 4173 --directory frontend/out
```

## 接続設定

`frontend` で `pnpm run dev` を実行すると、RPC・`/api/*`・`/_oauth/*` を開発用 proxy 経由で `http://localhost:5211` に転送します。ブラウザーは Next.js と同じ origin に接続します。
本番ビルドでは proxy を含めず、従来どおり静的 export します。

必要に応じて `frontend/.env.local` に設定します。

```dotenv
DEV_API_BASE_URL=https://localhost:7262
NEXT_PUBLIC_TRAQ_API_BASE_URL=https://q.trap.jp/api/v3
```

- `DEV_API_BASE_URL` は開発用 proxy の転送先を変更します。HTTPS を使う場合は Next.js を動かす Node.js が開発証明書を信頼できるようにしてください。
- `NEXT_PUBLIC_API_BASE_URL` を明示すると proxy を介さず指定 URL に直接接続します。通常の開発では設定不要です。別 origin に直接接続する場合はサーバー側の CORS 設定が必要です。
- traQ API URL は旧ヘッダーと同じユーザーアイコンの表示に使用します。省略時はユーザー名を表示します。
- `NEXT_PUBLIC_*` はビルド時に取り込まれるため、配信後に変更する場合は再ビルドしてください。
- フォントは旧画面と同じ Google Fonts の Noto Sans JP / Material Symbols Rounded をブラウザーで読み込みます。

## 構成

- `features/schedule`: 進捗部屋一覧と取得
- `features/vacancies`: 空き教室一覧と取得
- `features/rooms`: 両一覧で共通のカード、JST 日付・期間・イベントの表示処理
- `features/calendar-feed`: 配信 URL と更新操作
- `features/auth`: ログインユーザー取得と認証状態
- `app/_components`: 認証状態やナビゲーションを扱う共通ヘッダー
- `shared/ui`: 特定の機能に依存しない共通 UI
- `shared/config`: 使用するアイコンの定義とフォント読み込み設定
- `shared/api/rpc`: gRPC-Web transport、生成定義からのクライアント構築、取得状態とエラー
- `../proto/gen`: Buf / Protobuf-ES の生成物。手編集・コミットせず各コマンドで再生成

API 型とサービス定義は `proto` workspace パッケージから参照します。
元の `.proto` 契約やバックエンド実装は、このフロント移植では変更しません。

## 移植範囲

旧 Tailwind の色・文字組み・レイアウト・カード・アイコン・ボタンを引き継いでいます。
現在の proto にない knoQ 未登録警告、最終更新日時、未収集と取得済み空一覧の区別は省略しています。
部屋情報源の選択、大学予約と knoQ の集約、予約可能教室への絞り込みはサーバーの責務です。

RPC 未実装・接続失敗時はエラーと再試行を表示します。
`GetMe` が成功するまでは各機能の取得処理を開始しません。
ブラウザー側の表示制御はサーバー側の認可を代替しません。
iCal の購読 URL 自体の発行・失効と配信も既存サーバーの責務です。

## 検証

```sh
pnpm --filter ./frontend lint
pnpm --filter ./frontend typecheck
pnpm --filter ./frontend test
```

自動テストは、次の回帰を防ぐケースに絞っています。

- 日時・部屋の純粋ロジック: JST の日付境界、期間の集約・表示、イベントの突合、利用状態、建物順が変わること。
- 認証: 未認証で非公開画面が表示されること、API エラーを未認証と混同して再試行できなくなること。
- iCal 操作: 再生成の取消時にも更新してしまうこと、更新失敗で旧 URL を失うこと、再試行成功後も古い URL を表示・コピーすること。

E2E は設けません。3 画面の表示・遷移・配信 URL の操作・コピー失敗時の案内は、通常のブラウザー操作で確認します。
実サーバーとの接続・認可・DB 更新も手動確認の対象です。
