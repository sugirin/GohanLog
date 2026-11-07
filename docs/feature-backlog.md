# GohanLog 機能開発リスト

会話の中で出てきた機能アイデアを蓄積していく場所。
新しいアイデアが出たらこのファイルに追記する。

## 凡例

- **ステータス**: `未着手` / `検討中` / `進行中` / `完了` / `保留`

---

## 1. 履歴リストの無限スクロール

- **機能名・概要**: 履歴リストを一番下までスクロールしたとき、続きを自動で読み込む（ページネーション/無限スクロール）。
- **ステータス**: 未着手
- **やり取りした内容の概要**:
  - 2026-04-29: 機能アイデアとして登録。詳細仕様（1ページあたりの件数、ローディング表示の有無、トリガー位置など）は未定。

## 2. タグから履歴画面への遷移（タグでフィルタ）

- **機能名・概要**: タグ画面でタグをタップすると、そのタグでフィルタされた状態の履歴画面に遷移する。
- **ステータス**: 完了
- **やり取りした内容の概要**:
  - 2026-04-29: 機能アイデアとして登録。フィルタ状態の表示方法（タイトル・チップ表示・解除ボタンなど）や、複数タグ選択への対応有無は未定。
  - 2026-04-29: 実装完了。仕様は以下の通り。
    - タップ対象は **タグのバッジ部分のみ**（行全体は誤タップを避けるため対象外）。編集・削除ボタンは独立して動作。
    - **単一選択**のみ対応。複数タグ同時選択は今回スコープ外（必要になれば別チケットで切り出す）。
    - 履歴画面側のフィルタは **上書き** で適用。検索ワードと反対軸（place ↔ person）のフィルタもクリアし、「タップしたタグだけが効いた状態」になる。
    - 既存の履歴画面のフィルタチップ／解除ボタン UI をそのまま流用。
    - 実装: `App.tsx` で `pendingHistoryFilter` を持ち、`TagsScreen` の `onSelectTag` 経由で `HistoryScreen` の `pendingFilter` prop に流し込む。一度適用したら親で `null` に戻すワンショット方式。

## 3. カレンダー表示での履歴表示

- **機能名・概要**: 履歴をカレンダー（月/週ビューなど）形式で表示し、日付から該当日の食事ログを参照できるようにする。
- **ステータス**: 未着手
- **やり取りした内容の概要**:
  - 2026-04-29: 機能アイデアとして登録。表示単位（月/週/日）、日付セルでの表現方法（件数バッジ・サムネイル・ドットなど）、既存の履歴画面との切り替え方法は未定。

## 4. ミニSNS的機能（サブ機能）

- **機能名・概要**: 食事ログを共有・閲覧できるミニSNS的な機能を追加する。ただしGohanLogはあくまで「ローカル＆自分用」がメインコンセプトであり、SNS要素はサブ的な立ち位置に留める。
- **ステータス**: 未着手
- **やり取りした内容の概要**:
  - 2026-04-29: 機能アイデアとして登録。メインコンセプト（ローカル&自分用）を侵食しない範囲で、サブ機能として実装する方針。共有スコープ（個別投稿のみ／フォロー型／公開範囲設定など）、サーバー側の必要性、オプトイン方式かどうかは未定。

## 5. アップデート後のリリースノート通知ダイアログ

- **機能名・概要**: 新しいバージョンをリリースしたときに、アップデート後の初回起動時に一度だけダイアログを開いて変更点をユーザーに知らせる。
- **ステータス**: 完了
- **やり取りした内容の概要**:
  - 2026-04-30: 機能アイデアとして登録。
  - 2026-04-30: MVP として実装完了。仕様は以下の通り。
    - **バージョン取得**: `vite.config.ts` の `define` で `package.json` の `version` を `__APP_VERSION__` としてビルド時注入。`src/global.d.ts` に型宣言を置き、ランタイムから直接参照（PWA / iOS どちらも同じ仕組みで動く）。
    - **保存先**: `localStorage` の `gohanlog.lastSeenVersion` キーに最後に表示したバージョンを保存。Dexie の方には触らない（マイグレーション不要にするため）。
    - **判定ロジック** (`src/lib/releaseNotes.ts` `getPendingReleaseNote`):
      - `lastSeenVersion` が未保存（初回 or 機能導入前からの既存ユーザー）→ ダイアログは出さず、現在のバージョンを既読として記録。
      - `lastSeenVersion === currentVersion` → 何もしない。
      - 差分があるが `currentVersion` 用ノート未登録 → サイレントに `lastSeenVersion` を更新するだけ。
      - 差分があり、ノート登録あり → そのノートを返し、呼び出し側がダイアログを閉じたタイミングで `markReleaseNoteSeen` を呼ぶ。
    - **複数バージョン跨ぎ**: 最新バージョン分のノートのみ表示する単純方式。
    - **UI** (`src/components/ReleaseNotesDialog.tsx`): 既存モーダル（`fixed inset-0 z-50` パターン）に揃えた単純なダイアログ。タイトル＋バージョンラベル＋箇条書き＋閉じるボタン。「次回から表示しない」チェックは無し（毎回見せたいわけではないため）。
    - **再表示動線**: 今回スコープ外（必要になればチケットを別に切る）。
    - **リリースノート本文の管理**: `src/lib/releaseNotes.ts` の `releaseNotes` 配列に version / ja / en で追記する形。1.0.0 はリリースノート機能導入前の初期版なのでエントリ無し（既存ユーザーへの通知なし）。次バージョン以降の変更点はここに追記する。
    - **テスト**: `src/lib/releaseNotes.test.ts`（10件）と `src/components/ReleaseNotesDialog.test.tsx`（4件）を追加。判定ロジックの主要ケースとダイアログの基本表示を網羅。

## 6. Android 対応

- **機能名・概要**: Capacitor で Android アプリを追加し、iOS と同一コードから Android も配信できるようにする。
- **ステータス**: 進行中
- **やり取りした内容の概要**:
  - 2026-07-02: Android 開発に着手。コード／プロジェクト側のセットアップを実施。
    - `@capacitor/android@^7.6.2` を追加し、`npx cap add android` で `android/` を生成。`appId: com.sugirin.gohanlog`、`app_name: GohanLog`、`@capacitor/camera` の Gradle 配線済み。`android/app/build.gradle` は `versionName 1.1.1` / `versionCode 1`。
    - SDK は `minSdk 23` / `compileSdk・targetSdk 35`（Capacitor 7 要件）。ビルドには **JDK 21・Android Studio Ladybug (2024.2.1) 以降**が必要。
    - npm スクリプトに `cap:open:android` / `cap:run:android` を追加。
    - **残タスク**: ユーザー側で Android Studio / JDK を導入 → 実機・エミュレータで動作確認。撮影・ギャラリー選択の実機検証。ネイティブ Base64 保存（`isNativePlatform()` 経路）が Android WebView でも正しく永続化されるか確認。**Google Play 配信（署名鍵 keystore・Play Console 登録・AAB 提出）は後回し**（`docs/RELEASE.md` にプレースホルダを記載）。

  - 2026-11-07: Android 対応の続き（コード側）。
    - **カメラ権限の見直し**: インストール済み `@capacitor/camera` 7.0.5 の README とマニフェストを確認した結果、Android では権限宣言が不要（撮影は `IMAGE_CAPTURE` Intent、ギャラリーは Photo Picker）。`saveToGallery` 未使用のため権限は追加しない。`CAMERA` を宣言すると逆に実行時許可が必要になるため宣言しない方針。`docs/SETUP_MOBILE.md` の誤記（「`CAMERA` / `READ_MEDIA_IMAGES` をマージする」）を修正。
    - **Android 15 の edge-to-edge 対策**: `targetSdk 35` で Android 15 端末は edge-to-edge が強制され、画面上下がシステムバーに隠れる。`capacitor.config.ts` に `android.adjustMarginsForEdgeToEdge: 'auto'` を追加（Capacitor 7.1+ のオプション。Android 15 時のみマージン付与。iOS には影響なし）。
    - **写真まわりの hotfix**: `hotfix/photo-persistence`（編集保存で写真が消える／復元で Blob 保存）の修正は Android にも同じく必要。`main` へマージ後、このブランチに取り込む。
    - **未対応（要判断）**: Android の戻るボタン（下記 10）、カメラ起動中にアプリが OS に終了された場合の写真の取りこぼし（`appRestoredResult`）。どちらも `@capacitor/app` の追加が必要。
    - **残タスク（変わらず）**: Android Studio / JDK 21 の導入 → エミュレータ（API 35 / Android 15 推奨）と実機で、撮影・ギャラリー選択・Base64 永続化・画面上下の余白を確認。

## 7. Web 版（GitHub Pages / PWA）の廃止

- **機能名・概要**: 旧 Web 版の公開を廃止し、ネイティブ（iOS / Android）専用構成へ寄せる。
- **ステータス**: 進行中（コード上の撤去は完了。実際の Pages 非公開化は運用作業として別途）
- **やり取りした内容の概要**:
  - 2026-07-02: 「Android を優先し、Web 版は廃止してよい」という方針を確認。コード側の撤去を実施。
    - `vite-plugin-pwa` と `gh-pages` を依存から削除。`vite` の `base` を `/GohanLog/` → `./` に変更。`deploy` / `predeploy` スクリプトを削除。
    - Capacitor は同じ Web ビルドを土台にするため、React/Vite のコード自体は残す（「廃止」の対象はブラウザ向けの公開＝GitHub Pages / PWA のみ）。
    - **留意点**: 既存の PWA 利用者は公開停止すると端末内 IndexedDB のデータにアクセスできなくなる。個人アプリのため許容だが、必要ならバックアップ（設定画面の JSON エクスポート）案内や事前アナウンスを検討。
    - **残タスク**: 実際の GitHub Pages 非公開化（`gh-pages` ブランチ削除／リポジトリ Pages 設定 OFF）は手動。`public/pwa-192x192.png` / `pwa-512x512.png` など PWA 専用アセットは不要になったため整理可能（今回は未削除）。

## 8. 写真の Base64 変換の共通化と保存形式の統一（リファクタ）

- **機能名・概要**: 「Blob | string → Base64」の変換を `imageUtils.ts` の共通関数に集約し、写真の保存形式のルールを 1 つに揃える。あわせて画像プレビューの object URL リークを解消する。
- **ステータス**: 未着手
- **やり取りした内容の概要**:
  - 2026-11-07: hotfix（`hotfix/photo-persistence`）のコードレビュー指摘から登録。hotfix とは切り離して後で対応する方針。
    - **変換処理の重複**: `actions.ts` の `saveLog / updateLog` に `p instanceof Blob ? await blobToBase64(p) : p` が 4 箇所、`backup.ts` に `toBase64` がある。次に変換ロジックを直すとき（読めない Blob の扱い等）に修正漏れで写真消失バグが再発しうる。`toBase64(image)` / `normalizeImages(arr)` を `imageUtils.ts` に置いて全経路から使う。
    - **保存形式の不統一**: 復元（`importData`）は常に Base64 文字列で保存する一方、`saveLog / updateLog` はネイティブ時のみ Base64 化する。ネイティブの実経路はどちらも文字列なので実害はないが、「常に Base64」か「ネイティブのみ」のどちらかに統一する。
    - **object URL リーク**: `LogForm.tsx` のプレビューと `HistoryScreen.tsx` の `getImageSrc` が描画のたびに `URL.createObjectURL` を呼び、`revokeObjectURL` していない。memo 化してエフェクトのクリーンアップで解放する。軽微。

## 9. バックアップ／復元の堅牢化

- **機能名・概要**: エクスポートが一部の写真の読み込み失敗で全体失敗しないようにし、復元時の上書き・タグ不整合を解消する。
- **ステータス**: 未着手
- **やり取りした内容の概要**:
  - 2026-11-07: hotfix（`hotfix/photo-persistence`）のコードレビュー指摘から登録。
    - **エクスポートの全体失敗**: `exportData` は写真 1 枚でも読めない Blob があると `Promise.all` ごと失敗し、バックアップ全体が取れない。写真消失バグの被害ユーザーほどテキスト記録すら退避できなくなる。画像単位で catch してスキップ（または欠損として記録）する。
    - **復元時の上書き**: `importData` は `bulkPut` でログを元 id のまま書き込むため、復元先に同じ id のログがあると黙って上書きされる。
    - **タグの不整合**: タグも `bulkPut` で id 基準のまま入れるため、同じ `[type+name]` で別 id のタグが重複しうる。`count` / `lastUsed` も再計算されず、CLAUDE.md の整合性ルールから外れる。復元後にログからタグを再集計する、または `[type+name]` でマージする方式を検討。
    - **関連（今回は対応しない）**: 過去の復元で Blob のまま保存された写真を Base64 に直す修復処理は、2026-11-07 に「省略」と判断済み。

## 10. Android の戻るボタン（ハードウェア／ジェスチャー）対応

- **機能名・概要**: Android の「戻る」操作で、開いているモーダル（写真プレビュー・編集フォーム等）を閉じる／記録画面以外なら記録画面へ戻る。現状は画面遷移を `useState` で管理しており WebView の履歴が無いため、どの画面でも「戻る」でアプリが終了する。
- **ステータス**: 未着手
- **やり取りした内容の概要**:
  - 2026-11-07: Android 対応の続きで登録。`@capacitor/app` を追加して `App.addListener('backButton', ...)` で処理する案。同じプラグインで `appRestoredResult`（カメラ起動中に OS がアプリを終了した場合の写真の受け取り）にも対応できる。依存追加は iOS 側（`cap sync` / Pods）にも影響するため、着手時に要確認。

