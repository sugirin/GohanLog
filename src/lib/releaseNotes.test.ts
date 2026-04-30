import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    getLastSeenVersion,
    setLastSeenVersion,
    getPendingReleaseNote,
    markReleaseNoteSeen,
    releaseNotes,
    findReleaseNote,
    type ReleaseNote,
} from './releaseNotes';

describe('releaseNotes', () => {
    beforeEach(() => {
        localStorage.clear();
        // 各テストで releaseNotes を一時的に差し替えても本体に副作用が残らないように
        // 配列内容を各テスト終わりにリセット
        releaseNotes.length = 0;
    });

    describe('getLastSeenVersion / setLastSeenVersion', () => {
        it('未保存のときは null を返す', () => {
            expect(getLastSeenVersion()).toBeNull();
        });

        it('保存した値を読み取れる', () => {
            setLastSeenVersion('1.2.3');
            expect(getLastSeenVersion()).toBe('1.2.3');
        });

        it('localStorage が使えなくても例外を投げない', () => {
            const original = Storage.prototype.getItem;
            Storage.prototype.getItem = vi.fn(() => {
                throw new Error('quota');
            });
            expect(() => getLastSeenVersion()).not.toThrow();
            expect(getLastSeenVersion()).toBeNull();
            Storage.prototype.getItem = original;
        });
    });

    describe('getPendingReleaseNote', () => {
        const sampleNote: ReleaseNote = {
            version: '1.1.0',
            ja: { title: '新機能', bullets: ['履歴のフィルタを改善しました'] },
            en: { title: 'New', bullets: ['Improved history filter'] },
        };

        it('未保存ユーザーには出さず、サイレントに現バージョンを記録する', () => {
            releaseNotes.push(sampleNote);
            const result = getPendingReleaseNote('1.1.0');
            expect(result).toBeNull();
            expect(getLastSeenVersion()).toBe('1.1.0');
        });

        it('lastSeenVersion === current のときは何もしない', () => {
            setLastSeenVersion('1.1.0');
            releaseNotes.push(sampleNote);
            const result = getPendingReleaseNote('1.1.0');
            expect(result).toBeNull();
            expect(getLastSeenVersion()).toBe('1.1.0');
        });

        it('差分があり、かつノートが登録されているとそのノートを返す', () => {
            setLastSeenVersion('1.0.0');
            releaseNotes.push(sampleNote);
            const result = getPendingReleaseNote('1.1.0');
            expect(result).toEqual(sampleNote);
            // この時点ではまだ更新しない（呼び出し側が markReleaseNoteSeen を呼ぶ）
            expect(getLastSeenVersion()).toBe('1.0.0');
        });

        it('差分はあるがノート未登録のときはサイレントに更新するだけ', () => {
            setLastSeenVersion('1.0.0');
            // releaseNotes に該当バージョンなし
            const result = getPendingReleaseNote('1.2.0');
            expect(result).toBeNull();
            expect(getLastSeenVersion()).toBe('1.2.0');
        });
    });

    describe('markReleaseNoteSeen', () => {
        it('lastSeenVersion を currentVersion に上書きする', () => {
            setLastSeenVersion('1.0.0');
            markReleaseNoteSeen('1.1.0');
            expect(getLastSeenVersion()).toBe('1.1.0');
        });
    });

    describe('findReleaseNote', () => {
        it('一致するバージョンのノートを返す', () => {
            const note: ReleaseNote = {
                version: '2.0.0',
                ja: { title: 'メジャー更新', bullets: [] },
                en: { title: 'Major update', bullets: [] },
            };
            releaseNotes.push(note);
            expect(findReleaseNote('2.0.0')).toBe(note);
        });

        it('見つからなければ undefined', () => {
            expect(findReleaseNote('99.0.0')).toBeUndefined();
        });
    });
});
