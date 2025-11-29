# GohanLog モバイルアプリセットアップガイド

このガイドでは、GohanLogのCapacitorネイティブアプリ（iOS/Android）を開発、ビルド、実行する方法を説明します。

## 前提条件

### iOS開発の場合
- **macOS** が必要
- **Xcode** 14以降をインストール
- **CocoaPods** をインストール: `sudo gem install cocoapods`
- **Apple Developer アカウント**（実機テスト・App Store配布の場合）

### Android開発の場合（将来対応予定）
- **Android Studio** をインストール
- **Java JDK** 17以降をインストール

## 初回セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. モバイル用にビルド

```bash
npm run build:mobile
```

このコマンドは、`base` パスを `./` に設定してビルドします（GitHub Pages用の `/GohanLog/` ではなく）。

### 3. Capacitorプロジェクトに同期

```bash
npm run cap:sync
```

これにより以下が実行されます：
- `dist/` フォルダのWeb資産をネイティブプロジェクトにコピー
- ネイティブプラグイン（カメラなど）の設定を同期

## iOS開発

### Xcodeでプロジェクトを開く

```bash
npm run cap:open:ios
```

または

```bash
npx cap open ios
```

### 初回起動時の設定

Xcodeが開いたら、以下を設定します：

1. **Signing & Capabilities** タブを開く
2. **Team** を選択（Apple Developer アカウントが必要）
3. **Bundle Identifier** を確認（デフォルト: `com.gohanlog.app`）

### カメラ権限の設定

iOSではカメラを使用する際に権限の説明が必要です。既に設定済みですが、カスタマイズする場合：

1. Xcodeで `ios/App/App/Info.plist` を開く
2. 以下のキーを確認:
   - `NSCameraUsageDescription`: "写真を撮影して食事の記録に追加します"
   - `NSPhotoLibraryUsageDescription`: "写真を選択して食事の記録に追加します"

### 実機テストの実行

1. iPhoneをMacに接続
2. Xcodeの上部でデバイスを選択
3. **Run** ボタン（▶️）をクリック

### シミュレータでの実行

1. Xcodeの上部で任意のシミュレータ（例: iPhone 15 Pro）を選択
2. **Run** ボタン（▶️）をクリック

> **注意**: シミュレータではカメラ機能は動作しません。実機でテストしてください。

## 開発ワークフロー

### コード変更後の更新手順

1. コードを変更（React/TypeScript/CSS）
2. モバイル用にビルド:
   ```bash
   npm run build:mobile
   ```
3. Capacitorに同期:
   ```bash
   npm run cap:sync
   ```
4. Xcodeで **Run** を実行（自動的にリビルドされます）

### ホットリロードを使用した開発（オプション）

開発サーバーを使用して、iOSアプリからローカルサーバーに接続することもできます：

1. 開発サーバーを起動:
   ```bash
   npm run dev:host
   ```
2. `capacitor.config.ts`を一時的に編集:
   ```typescript
   server: {
     url: 'http://YOUR_LOCAL_IP:5173',
     cleartext: true
   }
   ```
3. 同期して実行:
   ```bash
   npm run cap:sync
   npm run cap:open:ios
   ```

> **警告**: 本番ビルド前は必ず `server.url` を削除してください。

## プラットフォーム別の動作

### ネイティブアプリ（iOS/Android）
- ネイティブカメラとギャラリーを使用
- 写真は永続的に保存される
- オフライン完全対応

### Web版（PWA）
- ブラウザのファイル入力を使用
- 写真は IndexedDB に保存（ブラウザのストレージ制限あり）
- 警告メッセージが表示される

コードは自動的にプラットフォームを検出して適切な機能を使用します（`isNativePlatform()`）。

## ビルドとデプロイ

### iOS App Storeへの提出（将来）

1. Xcodeで **Product > Archive** を選択
2. 署名と配布オプションを設定
3. App Store Connect にアップロード

詳細は Apple の公式ドキュメントを参照してください。

## トラブルシューティング

### CocoaPodsのエラー

```bash
cd ios/App
pod install
```

### ビルドエラー

1. クリーンビルド:
   ```bash
   rm -rf dist
   npm run build:mobile
   npm run cap:sync
   ```
2. Xcodeで **Product > Clean Build Folder** を実行

### 権限が機能しない

- `Info.plist` に必要な権限の説明が含まれているか確認
- アプリを削除して再インストール（権限ダイアログをリセット）

### プラグインが認識されない

```bash
npm install @capacitor/camera
npm run cap:sync
```

## 参考リンク

- [Capacitor公式ドキュメント](https://capacitorjs.com/docs)
- [Capacitor iOS ガイド](https://capacitorjs.com/docs/ios)
- [Camera Plugin](https://capacitorjs.com/docs/apis/camera)

## 今後の拡張

### Android版の追加

iOS版が完成したら、以下のコマンドでAndroidを追加できます：

```bash
npx cap add android
npm run cap:sync
npx cap open android
```

Android Studioが開き、同様の手順でビルドできます。
