# GohanLog リリース手順

PWA（GitHub Pages）と iOS（App Store）の二系統に向けてリリースするときの手順をまとめる。
両方を同時に出すのが基本。片方だけのリリースなら該当ステップだけ実施する。

## バージョニング方針

- セマンティックバージョニングに従う（`MAJOR.MINOR.PATCH`）。
  - 新機能の追加: MINOR を上げる（例: `1.0.0` → `1.1.0`）
  - バグ修正・小さな調整: PATCH を上げる（例: `1.1.0` → `1.1.1`）
  - 互換性を壊す変更: MAJOR を上げる
- **同一リリースでは `package.json` と iOS（`MARKETING_VERSION`）を同じ値に揃える**。リリースノート機能のバージョン判定（`__APP_VERSION__`）は `package.json` の値を埋め込むため、ここがズレるとアプリ内通知のバージョン表示と App Store 上の表示が一致しなくなる。
- iOS の `CURRENT_PROJECT_VERSION`（ビルド番号）は **App Store に出すたびに必ずインクリメント**する。同じ MARKETING_VERSION のままでも、提出ごとに別のビルド番号が必要。

## 事前チェック

リリース対象のコミットを `main` に揃えてから着手する。

```bash
git checkout main
git pull
npm install
npm run lint
npx vitest run
npm run build              # base = /GohanLog/ で本番ビルドが通るか
npm run build:mobile       # base = ./ でモバイル向けビルドが通るか
```

`npm run lint` の既存エラーは事前から残っているもの（`react-hooks/set-state-in-effect` 等）。新しいエラーが**増えていない**ことだけ確認する。

## 1. バージョンを上げる

### 1-1. `package.json` を更新

```bash
# 例: 1.0.0 → 1.1.0
npm version 1.1.0 --no-git-tag-version
```

`--no-git-tag-version` を付けると、コミットとタグは作らずに `package.json` だけを書き換える（タグはこの手順の最後に手動で切る）。

### 1-2. iOS のバージョンを更新

`ios/App/App.xcodeproj/project.pbxproj` を編集する（または Xcode の General > Identity から GUI で更新）。

- `MARKETING_VERSION` を `package.json` と同じ値に。
- `CURRENT_PROJECT_VERSION` を必ずインクリメント（前回 `1` なら `2`）。

両方とも Debug / Release 両ビルド設定に出てくるので、**どちらも同じ値に揃える**。

### 1-3. リリースノートを追記

`src/lib/releaseNotes.ts` の `releaseNotes` 配列の **先頭** に新しいエントリを追加する。

```ts
export const releaseNotes: ReleaseNote[] = [
  {
    version: '1.1.0',
    ja: {
      title: '新機能を追加しました',
      bullets: [
        '◯◯機能を追加',
        '△△の表示を改善',
      ],
    },
    en: {
      title: 'New features',
      bullets: [
        'Added ◯◯',
        'Improved △△ display',
      ],
    },
  },
  // 旧バージョンのノートは下に残す（過去履歴として）
];
```

i18n は ja / en どちらも必ず埋める。空のリリース（リリースノート不要なバグ修正のみなど）は配列に追加しなくてよい。その場合、アップデートしても通知ダイアログは出ず、`lastSeenVersion` だけサイレントに進む。

## 2. コミット

`git-commit-organizer` Skill を使ってコミットを組む。例：

```
chore(release): 1.1.0
```

メッセージ本文に変更点の概要を書いておくと後で見返しやすい。

## 3. PWA リリース（GitHub Pages）

```bash
npm run deploy
```

これは内部で `npm run build`（base=/GohanLog/）を走らせてから `gh-pages -d dist` で `gh-pages` ブランチに push する。
完了後、`https://sugirin.github.io/GohanLog/` で動作確認。アップデート後初回起動時にリリースノートダイアログが出れば成功。

## 4. iOS リリース（App Store）

```bash
npm run build:mobile       # base = ./ でビルド
npm run cap:sync           # dist を ios/ に反映
npm run cap:open:ios       # Xcode を開く
```

Xcode で：

1. **Product > Archive** でアーカイブを作成。
2. Organizer から **Distribute App > App Store Connect > Upload**。
3. App Store Connect で TestFlight 配布、または直接審査提出。

ビルド番号 (`CURRENT_PROJECT_VERSION`) を上げ忘れていると App Store Connect 側でエラーになる。

## 5. タグを切る

PWA／iOS どちらか（あるいは両方）のリリースが完了したら、**実際にリリースした内容のコミット**にタグを付ける。

```bash
git tag -a v1.1.0 -m "v1.1.0

主な変更点:
- ◯◯機能を追加
- △△の表示を改善
"
git push origin v1.1.0
```

タグは `v` プレフィックス付きで `vMAJOR.MINOR.PATCH`。アノテートタグ（`-a`）にしてリリースノート要点を本文に残す。

## 6. リリース後の動作確認

- PWA: ブラウザで開いて、起動時にリリースノートダイアログが出ること、`localStorage` の `gohanlog.lastSeenVersion` が新バージョンに更新されること。
- iOS: TestFlight で実機にインストールし、同様にリリースノートダイアログが出ること。

`localStorage` を消して再現確認する場合は、Safari の開発者ツールやアプリの再インストールが必要。

## チェックリスト

- [ ] `npm run lint` で新しいエラーが増えていない
- [ ] `npx vitest run` 全件通過
- [ ] `npm run build` 通過
- [ ] `npm run build:mobile` 通過
- [ ] `package.json` の version を更新
- [ ] iOS `MARKETING_VERSION` を `package.json` と同じ値に
- [ ] iOS `CURRENT_PROJECT_VERSION` をインクリメント
- [ ] `src/lib/releaseNotes.ts` にエントリ追加（必要な場合）
- [ ] `chore(release): X.Y.Z` でコミット（git-commit-organizer 経由）
- [ ] PWA: `npm run deploy`
- [ ] iOS: `build:mobile` → `cap:sync` → Xcode で Archive → Upload
- [ ] `git tag -a vX.Y.Z` でタグを切って push
- [ ] PWA / iOS どちらでもリリースノートダイアログが出ることを確認

## 関連ファイル

- `src/lib/releaseNotes.ts` — リリースノート本文と判定ロジック
- `vite.config.ts` — `__APP_VERSION__` の埋め込み
- `package.json` — `version` フィールド
- `ios/App/App.xcodeproj/project.pbxproj` — iOS バージョン
