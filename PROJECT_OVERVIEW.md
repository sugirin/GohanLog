# GohanLog プロジェクト概要

「シンプル・軽量・オフライン」をコンセプトにした、自分用の食事記録アプリ。
ユーザー（すぎりんさん）が「人と食事に行ったときの日付・店・人・写真をサッと残したい」というニーズから個人開発したアプリです。

---

## 1. プロジェクトの位置づけ（重要）

このプロジェクトは**純粋なネイティブアプリ（Swift / SwiftUI / Kotlin）ではありません**。実態は次の構成です。

1. **本体は React + TypeScript + Vite で作られた Web アプリ**
   - この Web コードがそのままネイティブアプリの中身になる。
   - **旧 Web 版（GitHub Pages / PWA）は廃止**。ネイティブ専用構成へ移行し、`vite` の `base` は `./`、`vite-plugin-pwa` も撤去済み（`npm run dev` のブラウザ表示は開発用途のみ）。
2. **ネイティブアプリ化は Capacitor で対応（iOS / Android）**
   - `capacitor.config.ts` の `appId: 'com.sugirin.gohanlog'`
   - `ios/` に Xcode プロジェクト、`android/` に Gradle プロジェクトを生成済み。
   - 同じ Web コードを WebView でラップしてネイティブアプリとしてビルドする構成。

つまり Swift / Kotlin で書き直すのではなく「Capacitor 経由で App Store / Google Play に配信できる形を整えていく」プロジェクトです。iOS は配信中、Android は開発着手済み（手順は `docs/SETUP_MOBILE.md`）。

---

## 2. アプリの機能

ボトムナビゲーションで切り替える4画面構成（`src/App.tsx`）。

### 記録 (Record) — `RecordScreen.tsx`
- 日付（デフォルトは今日、カレンダーから変更可）
- 場所（テキスト入力＋既存タグからのサジェスト・ワンタップ選択）
- 一緒に行った人（複数タグ。既存タグはタップで追加／解除）
- 写真（複数枚。Web時は `<input type="file">`、ネイティブ時は Capacitor Camera プラグインでカメラ／フォトライブラリを直接呼び出し）
- 保存時に画像を自動リサイズ（オリジナル：最大1920px、サムネイル：最大150px）
- ネイティブ環境では Blob を Base64 に変換してから保存（iOS の WKWebView で Blob が消える問題への対策）

### 履歴 (History) — `HistoryScreen.tsx`
- 日付の新しい順に最大50件表示
- 検索ボックスで店名・人名を全文絞り込み
- 場所タグ・人タグでのフィルタ
- サムネイルタップで原寸プレビュー
- 記録ごとに編集・削除可能（`LogForm.tsx` を再利用）

### タグ管理 (Tags) — `TagsScreen.tsx`
- 場所／人それぞれのタグ一覧
- タグごとの絵文字・名前を編集（リネーム時は既存ログにも反映）
- 同名タグへリネームすると自動でマージ
- 手動でタグを追加・削除

### 設定 (Settings) — `SettingsScreen.tsx`
- 日本語 / English の切り替え（`src/lib/i18n/`）
- バックアップ：写真込みでJSONエクスポート（Web Share API → ダメならダウンロード）
- 復元：JSONインポート（`bulkPut` でマージ）
- 全ログ削除（ダブル確認）
- デバッグログのエクスポート

---

## 3. データモデル — `src/lib/db.ts`

ブラウザ内 IndexedDB（Dexie.js）に保存。データベース名は `DiningLogDB`、現在 v3。

```ts
interface Log {
  id?: number;
  date: string;          // 'yyyy-MM-dd'
  place: string;
  people: string[];      // multi-entry index
  photos?: (Blob | string)[];      // 原寸 or Base64
  thumbnails?: (Blob | string)[];  // サムネ or Base64
}

interface Tag {
  id?: number;
  type: 'place' | 'person';
  name: string;
  emoji?: string;
  lastUsed: string;
  count: number;
}
```

- ログ保存・更新・削除のたびに `actions.ts` がタグの count / lastUsed を整合的に更新
- マイグレーションは `db.version(2)` で `useCount → count` リネーム、`db.version(3)` で `[type+name]` 複合インデックス追加

---

## 4. ディレクトリ構成（重要部分のみ）

```
GohanLog/
├── README.md                        ユーザー向け説明
├── HOW_TO_ACCESS.md                 開発時にiPhoneから接続する手順
├── blog_post_draft.md               Antigravityで2日で作った話のブログ下書き
├── プロンプト下書き                 すぎりんさんが実際にAIに渡したプロンプトの履歴
├── package.json                     Vite + React 19 + TS + Capacitor + Dexie
├── capacitor.config.ts              appId: com.sugirin.gohanlog
├── vite.config.ts                   base: './'（ネイティブ専用。旧 PWA 構成は撤去済み）
├── index.html                       M PLUS Rounded 1c フォントを Google Fonts から読み込み
├── tailwind.config.js / postcss.config.js
├── eslint.config.js / tsconfig*.json / vitest.config.ts
├── components.json                  shadcn/ui の設定
├── src/
│   ├── App.tsx                      4画面のルーティング兼レイアウト
│   ├── main.tsx                     エントリーポイント
│   ├── index.css / App.css
│   ├── components/
│   │   ├── RecordScreen.tsx         記録画面（メイン）
│   │   ├── HistoryScreen.tsx        履歴画面
│   │   ├── TagsScreen.tsx           タグ管理画面
│   │   ├── SettingsScreen.tsx      設定画面
│   │   ├── LogForm.tsx              履歴の編集に再利用するフォーム
│   │   ├── TagInput.tsx             タグ入力UI（サジェスト＋追加）
│   │   ├── *.test.tsx               vitest + Testing Library のユニットテスト
│   │   └── ui/                      shadcn/ui ベースのプリミティブ
│   └── lib/
│       ├── db.ts                    Dexie スキーマ
│       ├── actions.ts               saveLog / updateLog / deleteLog / タグ操作
│       ├── backup.ts                JSON エクスポート・インポート
│       ├── imageUtils.ts            画像リサイズ／Capacitorカメラ／Base64変換
│       ├── platformUtils.ts        isNativePlatform() などのプラットフォーム判定
│       ├── debug.ts                 デバッグログ収集
│       ├── utils.ts                 cn() ヘルパー
│       └── i18n/
│           ├── LanguageContext.tsx  言語切り替えの React Context
│           └── translations.ts      ja / en の文言
├── public/
│   ├── favicon.png / apple-touch-icon.png / pwa-192x192.png / pwa-512x512.png
│   ├── privacy-policy.html          プライバシーポリシー（GitHub Pagesで配信）
│   └── support.html                 サポートページ
├── assets/
│   ├── icon.png / splash.png        @capacitor/assets で生成元になる画像
├── ios/                             Capacitor が生成した Xcode プロジェクト
│   └── App/                         Info.plist にカメラ／写真権限の説明あり
├── docs/
│   ├── SETUP_MOBILE.md              iOSビルド手順（Capacitor）
│   └── TROUBLESHOOTING_XCODE.md     Xcodeエラー対処
├── dist/                            ビルド成果物（cap sync で iOS/Android へ同期）
├── android/                         Capacitor が生成した Gradle プロジェクト
├── dev-dist/                        PWA dev用
└── node_modules/                    依存（Sharp 等が大量にあるが無視可）
```

---

## 5. 技術スタックまとめ

| カテゴリ | 採用技術 | メモ |
| --- | --- | --- |
| UIフレームワーク | React 19 | `useLiveQuery`（Dexie React Hooks）でDBの変更を即時反映 |
| 言語 | TypeScript ~5.9 | `tsc -b && vite build` で型チェック |
| ビルド | Vite 7 | `base: './'`（ネイティブ専用。旧 GitHub Pages 用の `/GohanLog/` は廃止） |
| スタイル | Tailwind CSS v4 + tailwindcss-animate | `@/components/ui` は shadcn/ui ベース |
| アイコン | lucide-react | |
| ルーティング | なし（`useState` で view を切り替え） | SPA 4画面 |
| 永続化 | Dexie.js（IndexedDB） | `dexie-react-hooks` |
| PWA | （廃止） | 旧 Web 版で使用。`vite-plugin-pwa` は撤去済み |
| ネイティブ化 | Capacitor 7（@capacitor/core, ios, android, camera） | iOS / Android 追加済み |
| 国際化 | 自前 Context（ja / en） | localStorage で永続化 |
| テスト | Vitest + Testing Library + fake-indexeddb + jsdom | RecordScreen / HistoryScreen / actions / db のテストあり |
| Lint | ESLint 9 + typescript-eslint + react-hooks | |
| 配信 | App Store（iOS・配信中） / Google Play（Android・準備中） | 旧 gh-pages デプロイは廃止 |

---

## 6. 主なnpmスクリプト（`package.json`）

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | 開発サーバー（PC ローカル） |
| `npm run dev:host` | 同じ Wi-Fi の iPhone から接続するためにホスト公開 |
| `npm run build` | ビルド（base = `./`） |
| `npm run build:mobile` | Capacitor 用ビルド（base = `./`、tsc 付き） |
| `npm run preview` / `preview:host` | dist のローカル確認 |
| `npm run cap:sync` | dist → iOS / Android プロジェクトへ反映 |
| `npm run cap:open:ios` | Xcode を開く |
| `npm run cap:open:android` | Android Studio を開く |
| `npm run cap:run:android` | Android を実機/エミュレータで実行 |
| `npm run lint` | ESLint |

---

## 7. 開発の経緯

`blog_post_draft.md` および `プロンプト下書き` から読み取れる流れ：

- すぎりんさんは普段から iPhone のメモアプリで「いつ・誰と・どこで」食事したかを記録していた。
- それを軽量PWAに置き換えるべく、Google の **Antigravity** を使ってAIエージェント主導で2日で開発。
- 最初のプロンプトで技術スタックを提案させ、ホスティングだけ「GitHub Pages」に変更。
- その後は「画面のバランス」「タグのソート」「サムネイル機能」「アルバム選択ボタン」など、何度かの MUST/WANT 形式のフィードバックで磨き込み。
- 現状コードは 1 行も自分で書いておらず、コードリーディングを今後の課題と認識している。
- ブログ下書きでは「iPhoneのホーム画面に追加して使うことを想定したWebアプリ」と説明。

git log を見ると、最近は次のような順で機能追加：
i18n 基盤 → Settings に言語選択 → 画面のローカライズ → Tag に絵文字対応 → デバッグログのエクスポート → プライバシーポリシー → サポートページ追加。

---

## 8. 設計上のポイント・読みどころ

- `actions.ts` の `saveLog / updateLog / deleteLog`：ログの増減に合わせてタグの count / lastUsed をトランザクション内で同期更新。タグのリネーム時は既存ログの中身まで書き換える点が要注意（`renameTag`）。
- `imageUtils.ts`：Web では `URL.createObjectURL` ベース、ネイティブでは Capacitor Camera 由来のURLから fetch → Blob → File。Web/Native の差を `isNativePlatform()` で1ヶ所に閉じている。
- ネイティブで Blob を Base64 に変換してから保存しているのは、iOS WKWebView の IndexedDB に Blob を保存すると永続性が不安定という既知挙動への対策。
- `App.tsx` のレイアウトは「上1：Where 3：Who 3：Photo 2：保存ボタン」の比率で flex を組み、`safe-area-pt/pb` で iPhone のセーフエリアに対応。
- フォントは Google Fonts の M PLUS Rounded 1c を `index.html` で読み込み（オフライン時の挙動はキャッシュ次第）。

---

## 9. プロジェクトの方針（確認済み）

すぎりんさんに確認した結果、以下の方針が確定しています。

- **構成**：**Capacitor によるネイティブ（iOS / Android）専用**構成へ移行。旧 Web 版（GitHub Pages / PWA）は廃止。Swift / Kotlin によるネイティブ書き換えはしない。
- **iOS**：すでに **App Store で配信中**。運用とアップデートのフェーズ。
- **Android**：**開発着手済み**（2026-07-02〜）。`android/` 追加・Camera 配線済み。実機/エミュレータでの動作確認と Google Play 配信準備が今後の仕事（`docs/feature-backlog.md` の項目 6・7 参照）。

---

## 10. 残っている確認事項（細かいもの）

方針が固まった上で、コードを読むだけでは判断できなかった細部です。手を入れるかどうかはタイミングを見て確認させてください。

1. **オフラインフォントの扱い**
   `index.html` で M PLUS Rounded 1c を Google Fonts から読み込んでいるため、初回オフラインだとフォントが当たらない可能性があります。このままで OK ですか？
2. **Web 版での写真の永続性に関する警告**
   `RecordScreen.tsx` の Web 警告だけ翻訳キー化されておらず日本語ベタ書きです。i18n に揃えますか？
3. **`feature/*` ブランチの整理**
   `feature/history-editing` / `feature/increase-button-height` / `feature/save-clear-buttons` / `feature/update-save-clear-buttons` がローカルに残っています。削除して良いか確認したいです。
4. **テストカバレッジ**
   `TagsScreen` / `SettingsScreen` / `LogForm` / `backup.ts` などはテスト未整備。広げますか？
5. **デプロイの自動化**
   現状は手動 `npm run deploy`。GitHub Actions による自動デプロイの希望はありますか？

---

## 11. ひとまずの着手候補

すでに App Store 配信中ということを踏まえると、次のような切り口が現実的です。

- **Android 対応**：`android/` 追加済み。次は実機/エミュレータでの動作確認、Camera 権限の実機検証、Google Play 配信準備（`docs/feature-backlog.md` 項目 6）
- **アップデート時のリグレッション対策**：`TagsScreen` / `SettingsScreen` / `backup.ts` のテスト追加
- **ネイティブ共通の改善**：オフラインフォント、開発時ブラウザ警告の i18n
- **運用効率化**：`feature/*` ブランチの掃除
- **次の機能追加**：ユーザーから出ている要望があればここに積む
