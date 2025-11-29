# Xcodeビルドエラー トラブルシューティングガイド

## 🔍 エラー確認手順

### 1. Xcodeでエラーを確認

1. Xcodeの左サイドバーで **Issue Navigator**（⚠️ アイコン）をクリック
2. 赤いエラーメッセージを展開
3. エラー全文をコピー

### 2. ビルドログを確認

**Report Navigator**（時計アイコン）> 最新のビルドログ

---

## 🛠️ よくあるエラーと解決策

### エラー1: CocoaPods関連

**症状**: `Unable to open base configuration reference file ... Pods-App.debug.xcconfig` などのエラー

**解決策**:
1. CocoaPodsをインストール:
   ```bash
   sudo gem install cocoapods
   ```
2. 依存関係をインストール:
   ```bash
   cd ios/App
   pod install
   cd ../..
   ```
3. Capacitorに同期:
   ```bash
   npm run cap:sync
   ```
4. Xcodeを再起動してビルド

### エラー2: 署名エラー

**症状**: `Signing for "App" requires a development team`

**解決策**:
1. Xcodeで **Signing & Capabilities** タブを開く
2. **Team** を選択（Personal Team）
3. Bundle Identifierが重複している場合は変更

### エラー3: ビルド設定エラー

**解決策**: クリーンビルド
```bash
rm -rf dist
npm run build:mobile
npm run cap:sync
```

Xcodeで: **Product > Clean Build Folder** (⇧⌘K)

### エラー4: 「信頼されていないデベロッパ」エラー

**症状**: `The request to open "..." failed.` / `Verify that the Developer App certificate... is trusted`

**解決策**: iPhone側で設定が必要です。
1. iPhoneの **設定** > **一般** > **VPNとデバイス管理** を開く
2. 「デベロッパAPP」の下にある自分のメールアドレスをタップ
3. **「(メールアドレス)を信頼」** をタップ
4. **「信頼」** をタップ
5. アプリを再度起動

### エラー5: カメラ権限エラー

`ios/App/App/Info.plist` に以下が必要:

```xml
<key>NSCameraUsageDescription</key>
<string>写真を撮影して食事の記録に追加します</string>
```

---

## 📝 サポートが必要な場合

以下の情報を共有してください:

1. **エラーメッセージ全文**（Xcodeから）
2. **実行したコマンド**
3. **macOSとXcodeのバージョン**

これにより具体的な解決策を提案できます。
