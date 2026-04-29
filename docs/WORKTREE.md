# Git worktree の運用方針

普段は単一ディレクトリで作業する。worktree は **限定運用** にとどめる。

## worktree を切る場面

- 本番（App Store 配信中の `main`）に緊急修正（hotfix）が必要なとき。作業中のブランチを退避せずに済む。
- App Store 提出版（特定のリリースタグやリリース用ブランチ）の動作確認を、開発中の作業と並行してやりたいとき。

## 切らない場面

通常の機能開発では worktree を切らない。`node_modules` と `ios/` の Pods が worktree ごとに必要になり二重コストが大きい。普段は `git switch` で十分。

## 規約

- 配置場所は親ディレクトリに `../GohanLog-<用途>` の名前で作る（例：`../GohanLog-hotfix`、`../GohanLog-release`）。
- 作成例：`git worktree add ../GohanLog-hotfix -b hotfix/xxx main`
- 用が済んだら `git worktree remove <path>` で削除する。マージ済みのブランチも忘れず消す。
