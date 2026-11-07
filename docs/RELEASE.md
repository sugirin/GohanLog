# GohanLog リリース手順

**iOS（App Store）** と **Android（Google Play）** の 2 系統に向けてリリースするときの手順をまとめる。
旧 Web 版（GitHub Pages / PWA）は廃止したため、PWA デプロイ手順は無くなった。

> **Android について**: `android/` プロジェクトは追加済みでローカルビルドは可能。Google Play への配信（署名鍵・Play Console 登録・AAB 提出）はまだ整備しておらず、本ドキュメントでは概要のみ記載する（詳細は Play 配信に着手する際に追記）。

## バージョニング方針

- セマンティックバージョニング（`MAJOR.MINOR.PATCH`）。
  - 新機能: MINOR、バグ修正: PATCH、破壊的変更: MAJOR。
- **同一リリースでは以下を同じバージョンに揃える**:
  - `package.json` の `version`
  - iOS `MARKETING_VERSION`
  - Android `versionName`（`android/app/build.gradle`）
  - リリースノートのバージョン判定（`__APP_VERSION__`）は `package.json` の値を埋め込むため、ここがズレるとアプリ内通知とストア表示が食い違う。
- **提出ごとに必ずインクリメントするビルド番号**:
  - iOS `CURRENT_PROJECT_VERSION`
  - Android `versionCode`（`android/app/build.gradle`）

## 事前チェック

リリース対象のコミットを `main` に揃えてから着手する。

```bash
git checkout main
git pull
npm install
npm run lint
npx vitest run
npm run build:mobile       # base = ./ でネイティブ向けビルドが通るか
```

`npm run lint` の既存エラー（`react-hooks/set-state-in-effect` 等）は元からあるもの。新しいエラーが**増えていない**ことだけ確認する。

## 1. バージョンを上げる

### 1-1. `package.json`

```bash
# 例: 1.1.1 → 1.2.0
npm version 1.2.0 --no-git-tag-version
```

### 1-2. iOS

`ios/App/App.xcodeproj/project.pbxproj`（または Xcode の General > Identity）:
- `MARKETING_VERSION` を `package.json` と同じ値に。
- `CURRENT_PROJECT_VERSION` を必ずインクリメント。
- Debug / Release 両方に同じ値を入れる。

### 1-3. Android

`android/app/build.gradle` の `defaultConfig`:
- `versionName` を `package.json` と同じ値に。
- `versionCode` を必ずインクリメント（前回 `1` なら `2`）。

### 1-4. リリースノートを追記

`src/lib/releaseNotes.ts` の `releaseNotes` 配列の **先頭** に新エントリを追加。ja / en 両方を必ず埋める。
空のリリース（ノート不要なバグ修正のみ）は追加しなくてよい（ダイアログは出ず `lastSeenVersion` だけサイレントに進む）。

## 2. コミット

`git-commit-organizer` Skill でコミットを組む。例: `chore(release): 1.2.0`

## 3. iOS リリース（App Store）

```bash
npm run build:mobile       # base = ./ でビルド
npm run cap:sync           # dist を ios/ に反映
npm run cap:open:ios       # Xcode を開く
```

Xcode で:
1. **Product > Archive**
2. Organizer から **Distribute App > App Store Connect > Upload**
3. App Store Connect で TestFlight 配布、または審査提出

`CURRENT_PROJECT_VERSION` を上げ忘れると App Store Connect 側でエラーになる。

## 4. Android リリース（Google Play・準備中）

ローカルビルド／実機確認まではこの手順:

```bash
npm run build:mobile       # base = ./ でビルド
npm run cap:sync           # dist を android/ に反映
npm run cap:open:android   # Android Studio を開く
```

Google Play 配信に着手する際に整備が必要な事項（未対応）:
- **署名鍵（keystore）** の作成と安全な保管、`android/app/build.gradle` の signingConfig 設定
- **リリース AAB** の生成（Android Studio: Build > Generate Signed Bundle / APK）
- **Google Play Console** でのアプリ登録・ストア掲載情報・プライバシー等の入力
- `versionCode` の運用ルール確定

これらに着手したら本セクションを手順として具体化する。

## 5. タグを切る

実際にリリースした内容のコミットにタグを付ける。

```bash
git tag -a v1.2.0 -m "v1.2.0

主な変更点:
- ◯◯を追加
"
git push origin v1.2.0
```

`v` プレフィックス付きアノテートタグ。

## 6. リリース後の動作確認

- iOS: TestFlight で実機インストールし、初回起動時にリリースノートダイアログが出ること。
- Android（配信時）: 内部テストトラック等で同様に確認。

`localStorage` の `gohanlog.lastSeenVersion` が新バージョンに更新されることも確認。再現には端末側のアプリ再インストールが必要。

## チェックリスト

- [ ] `npm run lint` で新しいエラーが増えていない
- [ ] `npx vitest run` 全件通過
- [ ] `npm run build:mobile` 通過
- [ ] `package.json` の version を更新
- [ ] iOS `MARKETING_VERSION` を揃える／`CURRENT_PROJECT_VERSION` をインクリメント
- [ ] Android `versionName` を揃える／`versionCode` をインクリメント（Play 配信時）
- [ ] `src/lib/releaseNotes.ts` にエントリ追加（必要な場合）
- [ ] `chore(release): X.Y.Z` でコミット（git-commit-organizer 経由）
- [ ] iOS: `build:mobile` → `cap:sync` → Xcode で Archive → Upload
- [ ] Android（配信時）: `build:mobile` → `cap:sync` → Android Studio で Signed Bundle
- [ ] `git tag -a vX.Y.Z` でタグを切って push
- [ ] リリースノートダイアログが出ることを確認

## 関連ファイル

- `src/lib/releaseNotes.ts` — リリースノート本文と判定ロジック
- `vite.config.ts` — `__APP_VERSION__` の埋め込み
- `package.json` — `version` フィールド
- `ios/App/App.xcodeproj/project.pbxproj` — iOS バージョン
- `android/app/build.gradle` — Android `versionName` / `versionCode`
