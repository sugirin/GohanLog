# GohanLog モバイルアプリセットアップガイド

GohanLog は React + TypeScript + Vite で作った Web アプリを **Capacitor でネイティブアプリ化**した構成。
1 つのコードベースから **iOS / Android** の両方をビルドする。

> **注意**: 旧 Web 版（GitHub Pages / PWA）は廃止した。現在は **ネイティブ専用**構成で、`vite.config.ts` の `base` は `./`、`vite-plugin-pwa` も撤去済み。`npm run dev` によるブラウザ表示は開発用途としてのみ残る。

---

## 前提条件

### 共通
- **Node.js** 20 以降
- 依存導入: `npm install`

### iOS 開発（macOS のみ）
- **Xcode** 14 以降
- **CocoaPods**: `sudo gem install cocoapods`
- **Apple Developer アカウント**（実機テスト・App Store 配信時）

### Android 開発（Capacitor 7 の要件）
- **Android Studio** Ladybug (2024.2.1) 以降
- **JDK 21**（`brew install --cask temurin@21` など。**Android Studio 2026.x 同梱の JDK は 25 で、Gradle 8.11.1 が動かない**ので使わない）
- **Android SDK**: `compileSdk` / `targetSdk = 35`、`minSdk = 23`
- 実機 または エミュレータ（AVD）
- **Google Play Console** アカウント（配信時のみ。ローカルビルドには不要）

SDK バージョンは `android/variables.gradle`、Android Gradle Plugin は `android/build.gradle` に定義されている。

---

## 初回セットアップ

```bash
npm install          # 依存をインストール
npm run build:mobile # base=./ でビルド（dist/ を生成）
npm run cap:sync     # dist をネイティブプロジェクトへ反映＋プラグイン同期
```

---

## iOS 開発

### Xcode で開く

```bash
npm run cap:open:ios   # または npx cap open ios
```

### 初回設定
1. **Signing & Capabilities** で **Team** を選択
2. **Bundle Identifier** を確認（`com.sugirin.gohanlog`）

### カメラ権限
`ios/App/App/Info.plist` に説明文言あり:
- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`

### 実行
iPhone を接続、またはシミュレータを選び **Run**（▶️）。
シミュレータではカメラ実機動作は不可なので、カメラは実機で確認する。

---

## Android 開発

### プロジェクトは追加済み
`android/`（Gradle プロジェクト）は生成済み。`appId` は `com.sugirin.gohanlog`、`@capacitor/camera` も配線済み。
再生成が必要な場合のみ:

```bash
rm -rf android && npx cap add android && npm run cap:sync
```

### Android Studio で開く

```bash
npm run cap:open:android   # または npx cap open android
```

### 初回設定
- 初回は Gradle Sync で SDK・依存をダウンロードする（時間がかかる）。
- SDK パスは `android/local.properties` に自動設定される（gitignore 済み）。
- Gradle が使う JDK は **JDK 21** を指定（Android Studio の Settings > Build Tools > Gradle）。

### カメラ／写真権限
`@capacitor/camera` 7 は Android で **権限の宣言が不要**（プラグイン README 準拠）。
- 撮影はカメラアプリを Intent（`IMAGE_CAPTURE`）で呼び出すだけ。プラグインのマニフェストは `<queries>` にこの Intent を足すのみ。
- ギャラリー選択は Android Photo Picker（Android 11+）を使う。非対応端末は `ACTION_OPEN_DOCUMENT` にフォールバック。
- 権限が要るのは `saveToGallery: true` を使う場合のみ（GohanLog は未使用）。
- **`CAMERA` 権限を自分で宣言しない**。宣言すると Intent 経由の撮影にも実行時の許可が必要になり、許可前は撮影に失敗する。

### Android 15 の edge-to-edge
`targetSdk 35` では Android 15 端末で edge-to-edge 表示が強制され、WebView がステータスバー／ナビゲーションバーの下に潜り込む。
`capacitor.config.ts` の `android.adjustMarginsForEdgeToEdge: 'auto'` で、Android 15 のときだけ Capacitor がシステムバー分の余白を付ける。設定変更後は `npm run cap:sync` で反映する。

### Android のアイコン・起動画面
元画像は `assets/android/`（`assets/splash.png` の白いロゴをオレンジの背景に載せ直したもの）。作り直すときは:

```bash
node scripts/make-android-assets.mjs                               # assets/android/ を作る
npx @capacitor/assets generate --android --assetPath assets/android
git checkout android/app/src/main/AndroidManifest.xml              # ツールが整形だけ書き換えるので戻す
```

`assets/icon.png` は白い余白付きの iOS 向けアイコンで、そのまま Android のアダプティブアイコンにすると「アイコンの中にアイコン」になるため使わない。

### エミュレータ／実機で実行
1. AVD（例: Pixel, API 35）を作成、または実機を USB デバッグ接続
2. Android Studio の **Run**（▶）
3. カメラは実機での確認を推奨

コマンドラインからエミュレータを起動する場合は `-gpu host` を付ける。付けないとソフトウェア描画（SwiftShader）になり、Photo Picker などのシステムアプリが「応答なし」になるほど遅くなる:

```bash
~/Library/Android/sdk/emulator/emulator -avd <AVD 名> -gpu host
```

コマンドラインからも実行できる:

```bash
npm run cap:run:android
```

---

## 開発ワークフロー（コード変更後）

1. コードを変更（React / TypeScript / CSS）
2. `npm run build:mobile`
3. `npm run cap:sync`
4. Xcode / Android Studio で **Run**

### ホットリロード（任意）
`npm run dev:host` を起動し、`capacitor.config.ts` に一時的に `server.url` を設定する。
**本番ビルド前は必ず `server.url` を削除する。**

---

## プラットフォーム別の動作

- **ネイティブ（iOS / Android）**: Capacitor Camera でカメラ／ギャラリーを直接呼び出す。写真は **Base64 に変換して** IndexedDB に永続化（WKWebView / WebView 対策）。
- **開発時のブラウザ（`npm run dev`）**: `<input type="file">` 経路。永続性は保証されないため開発確認用のみ。

分岐は `src/lib/platformUtils.ts` の `isNativePlatform()` に集約（iOS / Android 共通）。

---

## トラブルシューティング

### iOS
```bash
cd ios/App && pod install
```
Xcode で **Product > Clean Build Folder**。

### Android
- Gradle Sync 失敗 → **File > Invalidate Caches / Restart**、JDK 21 / SDK 35 を確認
- `Unsupported class file major version 69` → Gradle が JDK 25 で動いている。Gradle JDK を 21 にする（コマンドラインなら `JAVA_HOME=$(/usr/libexec/java_home -v 21)`）
- どうしても直らない → `rm -rf android && npx cap add android && npm run cap:sync` で再生成（再生成後は下記「Android のアイコン・起動画面」の生成と、`res/values/styles.xml` / `colors.xml` のライトテーマ設定をやり直す）
- 権限が効かない → 端末設定でアプリ権限を確認、アプリ再インストールでダイアログをリセット

### 共通
- プラグインが認識されない: `npm install && npm run cap:sync`
- ビルドがおかしい: `rm -rf dist && npm run build:mobile && npm run cap:sync`

---

## 参考リンク

- [Capacitor 公式ドキュメント](https://capacitorjs.com/docs)
- [Capacitor Android ガイド](https://capacitorjs.com/docs/android)
- [Capacitor iOS ガイド](https://capacitorjs.com/docs/ios)
- [Camera Plugin](https://capacitorjs.com/docs/apis/camera)
