# CLAUDE.md

このリポジトリで作業する Claude 向けの常駐メモ。詳細は `PROJECT_OVERVIEW.md` を参照する。

## プロジェクトの正体

- **GohanLog** — 自分用のシンプルな食事記録アプリ。
- **React 19 + TypeScript + Vite で作った Web アプリ**を、**Capacitor 7 で iOS / Android ネイティブアプリにラップ**する構成。
- **旧 Web 版（GitHub Pages / PWA）は廃止**。ネイティブ専用構成に移行し、`vite` の `base` は `./`、`vite-plugin-pwa` は撤去済み（`npm run dev` のブラウザ表示は開発用途のみ）。
- iOS は **App Store 配信中**（`appId: com.sugirin.gohanlog`）。Android は **開発着手（`android/` 追加済み・Capacitor 7）**。Google Play へは未配信。

## やってはいけないこと

- ネイティブ書き換え（Swift / SwiftUI / Kotlin）を提案しない。確定済み（Capacitor で iOS / Android を賄う）。
- 「App Store に提出しましょうか？」と聞かない。iOS は**もう配信中**。
- ネイティブで Blob を IndexedDB に直接保存しない。`src/lib/actions.ts` の `saveLog/updateLog` は **ネイティブ時に Blob → Base64 変換してから保存**している（iOS / Android WebView 対策）。壊さない。
- Web/Native の分岐は `src/lib/platformUtils.ts` の `isNativePlatform()` を使う（iOS / Android 共通）。
- `vite` の `base` は `./`（ネイティブ専用）。旧 Web 版は廃止済みなので `base: '/GohanLog/'` や `gh-pages` デプロイを復活させない。

## 主要ファイル

| 場所 | 役割 |
| --- | --- |
| `src/lib/db.ts` | Dexie のスキーマ。マイグレーションはここに書く |
| `src/lib/actions.ts` | ログ／タグの CRUD。トランザクションで `count` / `lastUsed` を整合更新 |
| `src/lib/imageUtils.ts` | 画像リサイズ・Capacitor Camera 連携・Base64 変換 |
| `src/lib/platformUtils.ts` | Web/Native 分岐 |
| `src/lib/i18n/translations.ts` | ja/en 文言の集約 |
| `src/App.tsx` | 4画面（Record / History / Tags / Settings）を切り替えるルート |

## よく使うコマンド

```bash
npm run dev               # 開発サーバー（ブラウザ確認用）
npm run dev:host          # 同じ Wi-Fi の実機ブラウザから見るとき
npm run build             # ビルド（base = ./）
npm run build:mobile      # Capacitor 用ビルド（base = ./、tsc 付き）
npm run cap:sync          # dist を iOS / Android プロジェクトへ反映
npm run cap:open:ios      # Xcode を開く
npm run cap:open:android  # Android Studio を開く
npm run cap:run:android   # Android を実機/エミュレータで実行
npm run lint              # ESLint
npx vitest                # テスト（vitest + Testing Library + fake-indexeddb + jsdom）
```

ネイティブへの反映は **`build:mobile` → `cap:sync` → Xcode / Android Studio で Run** が定型。

## コードを変えるときの作法

1. **i18n を必ず通す**：UI 文言は `translations.ts` の `ja` / `en` 両方に追加してから `t('xxx')` で参照する。日本語ベタ書きを増やさない（`RecordScreen.tsx` の Web 警告だけ既存例外）。
2. **DB スキーマ変更はマイグレーションで**：`db.version(N).stores({...}).upgrade(...)` の流儀で増やし、既存データを壊さないことを確認する。
3. **タグの整合性を保つ**：`saveLog / updateLog / deleteLog / renameTag` は `count` と `lastUsed` を維持している。新コードを書くときも対応するタグ更新を忘れない。
4. **画像は必ず `processImage` 経由**：原寸（最大 1920px）と サムネイル（最大 150px）を一緒に保存する。
5. **挙動を変えたら関連テストを更新**：既存テストは `RecordScreen / HistoryScreen / actions / db`。作業は `main` 派生のフィーチャーブランチで行う。

## コミット

- コミットは **必ず `git-commit-organizer` Skill を使う**。生の `git commit` を直接組まない。承認なしでコミットしない。push は明示依頼時のみ。
- メッセージは Conventional Commits 厳格、日本語で書く。
- Cowork サンドボックスで `apply_commits.py` が exit 3 で停止したら、ホスト側ターミナルで `find .git -name '*.lock' -delete` を実行してから再試行。

## 機能アイデア・要望

会話で機能追加・改善要望が出たら、まず `docs/feature-backlog.md` を読みに行く。追加前に既存項目を必ず確認し、重複・近接アイデアがあれば既存項目に追記する。完了した機能もファイルから消さず、ステータスを `完了` に更新して履歴として残す。

## 関連ドキュメント

- `PROJECT_OVERVIEW.md` — プロジェクト全体像（機能・データモデル・技術スタック・経緯・設計上のポイント）
- `docs/feature-backlog.md` — 機能アイデア・要望の集約
- `docs/RELEASE.md` — iOS / Android のリリース手順（バージョンの上げ方・タグ・リリースノート追記）
- `docs/SETUP_MOBILE.md` — Capacitor / iOS・Android ビルド手順（Android 開発環境の要件含む）
- `docs/TROUBLESHOOTING_XCODE.md` — Xcode でハマったときの対処
- `docs/WORKTREE.md` — Git worktree の運用方針（hotfix／リリース確認用に限定）
- `docs/open-questions.md` — 進める前に確認したい未確定論点
