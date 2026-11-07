# 未確定の論点

進める前に一度ユーザーに確認したほうが安全な細部を集めるファイル。
方針が決まったら該当項目を消す（または `feature-backlog.md` に昇格させる）。

- `index.html` の Google Fonts（M PLUS Rounded 1c）はオフライン初回でフォントが当たらない可能性。差し替える／同梱する／そのまま、のどれにするか未定。ネイティブ配信では初回オフライン起動で顕在化しやすい。
- `RecordScreen.tsx` の永続化警告だけ翻訳キー化されていない（開発時ブラウザ経路のみ表示）。揃えるかどうか未定。
- `TagsScreen / SettingsScreen / LogForm / backup.ts` のテストは未整備。リグレッション対策で増やすかは未確定。
- **Android**: 撮影・ギャラリー選択（権限宣言不要の構成）、ネイティブ Base64 保存の Android WebView での永続化、Android 15 の edge-to-edge 余白（`adjustMarginsForEdgeToEdge: 'auto'`）の実機検証が未実施。
- **Android**: Google Play 配信の可否・時期、署名鍵（keystore）の管理方針が未確定。
- **Web 廃止**: 実際の GitHub Pages 非公開化（`gh-pages` ブランチ削除・Pages 設定 OFF）と、既存 PWA 利用者への告知／データ移行（設定画面の JSON エクスポート案内）をどうするか未定。
