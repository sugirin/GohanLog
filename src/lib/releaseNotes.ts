// アップデート後の初回起動時に一度だけ表示するリリースノートのデータと判定ロジック。
// 新しいバージョンを出すときは releaseNotes 配列の先頭に追記する。

export interface ReleaseNoteContent {
    title: string;
    bullets: string[];
}

export interface ReleaseNote {
    /** package.json の version と一致させる（semver 文字列） */
    version: string;
    ja: ReleaseNoteContent;
    en: ReleaseNoteContent;
}

/**
 * バージョンごとのリリースノート。
 * 1.0.0 はリリースノート機能導入前の初期リリースなのでエントリ無し（既存ユーザーへの通知は行わない）。
 * 新しいバージョンを出すときは配列の先頭にエントリを追加する。
 */
export const releaseNotes: ReleaseNote[] = [
    {
        version: '1.1.1',
        ja: {
            title: 'GohanLog 1.1.1',
            bullets: [
                'タグ画面でタグのバッジをタップすると、そのタグで絞り込まれた履歴画面に移動できるようになりました。',
                'アップデート後に変更点をお知らせするダイアログを追加しました（このダイアログがその第一弾です）。',
            ],
        },
        en: {
            title: 'GohanLog 1.1.1',
            bullets: [
                'Tap a tag badge in the Tags screen to jump to History filtered by that tag.',
                "Added an update dialog that shows what's new on first launch after an update (this is the first one!).",
            ],
        },
    },
    {
        version: '1.1.0',
        ja: {
            title: 'GohanLog 1.1.0',
            bullets: [
                'タグ画面でタグのバッジをタップすると、そのタグで絞り込まれた履歴画面に移動できるようになりました。',
                'アップデート後に変更点をお知らせするダイアログを追加しました（このダイアログがその第一弾です）。',
            ],
        },
        en: {
            title: 'GohanLog 1.1.0',
            bullets: [
                'Tap a tag badge in the Tags screen to jump to History filtered by that tag.',
                "Added an update dialog that shows what's new on first launch after an update (this is the first one!).",
            ],
        },
    },
];

export function findReleaseNote(version: string): ReleaseNote | undefined {
    return releaseNotes.find((note) => note.version === version);
}

const STORAGE_KEY = 'gohanlog.lastSeenVersion';

export function getLastSeenVersion(): string | null {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

export function setLastSeenVersion(version: string): void {
    try {
        localStorage.setItem(STORAGE_KEY, version);
    } catch {
        // localStorage が使えない環境（プライベートブラウズ等）では諦める。
        // 次回起動時にもう一度判定が走るだけなので致命的ではない。
    }
}

/**
 * 起動時に呼び出して、表示すべきリリースノートがあれば返す。
 *
 * 仕様:
 * - lastSeenVersion が未保存の場合（初回インストール、または機能導入前から使っているユーザー）は
 *   ダイアログを出さず、現在のバージョンを「既読」として記録する。
 * - lastSeenVersion === currentVersion なら何もしない。
 * - lastSeenVersion !== currentVersion でも、currentVersion 用のリリースノートが
 *   登録されていない場合は、サイレントに lastSeenVersion を更新するだけ。
 * - 上記以外（差分があり、かつノートが登録されている）の場合のみ ReleaseNote を返す。
 *   呼び出し側はダイアログを閉じたタイミングで markReleaseNoteSeen を呼ぶ責任を持つ。
 */
export function getPendingReleaseNote(currentVersion: string): ReleaseNote | null {
    const last = getLastSeenVersion();

    if (last === null) {
        // 初回 or 機能導入前からの既存ユーザー → サイレントに記録だけする
        setLastSeenVersion(currentVersion);
        return null;
    }

    if (last === currentVersion) {
        return null;
    }

    const note = findReleaseNote(currentVersion);
    if (!note) {
        // ノートが用意されていないバージョンは黙ってバージョンだけ進める
        setLastSeenVersion(currentVersion);
        return null;
    }

    return note;
}

/** ダイアログを閉じたタイミングで呼ぶ。lastSeenVersion を currentVersion に更新する。 */
export function markReleaseNoteSeen(currentVersion: string): void {
    setLastSeenVersion(currentVersion);
}
