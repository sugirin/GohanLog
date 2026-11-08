import * as React from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { getPlatform } from './platformUtils'

/**
 * Android の戻るボタン（ハードウェア／ジェスチャー）の処理。
 *
 * モーダルなど「戻るで閉じたいもの」は useBackHandler で閉じる処理を登録する。
 * 戻るが押されたら、最後に登録されたもの（＝一番手前に開いているもの）から 1 つだけ閉じる。
 * 何も登録されていなければ setupAndroidBackButton に渡した onUnhandled が呼ばれる。
 */

type BackHandlerEntry = { handler: () => void }

const handlerStack: BackHandlerEntry[] = []

/**
 * 一番手前の登録済みハンドラを 1 つ実行する。
 * @returns 処理したら true、登録が無ければ false
 */
export function runBackHandler(): boolean {
    const top = handlerStack[handlerStack.length - 1]
    if (!top) return false
    top.handler()
    return true
}

/**
 * active の間だけ、戻るボタンで handler を呼ぶよう登録する。
 * handler は毎回最新のものが呼ばれるので、インライン関数を渡してよい。
 */
export function useBackHandler(active: boolean, handler: () => void): void {
    const handlerRef = React.useRef(handler)

    React.useEffect(() => {
        handlerRef.current = handler
    })

    React.useEffect(() => {
        if (!active) return
        const entry: BackHandlerEntry = { handler: () => handlerRef.current() }
        handlerStack.push(entry)
        return () => {
            const index = handlerStack.indexOf(entry)
            if (index !== -1) handlerStack.splice(index, 1)
        }
    }, [active])
}

/**
 * Android でのみ戻るボタンのリスナーを登録する（iOS / Web では何もしない）。
 * リスナーを登録すると Capacitor 既定の「WebView の履歴を戻る／アプリ終了」は無効になる。
 * @param onUnhandled 閉じるモーダルが無いときの処理。false を返すとアプリを最小化する。
 * @returns リスナーを解除する関数
 */
export function setupAndroidBackButton(onUnhandled: () => boolean): () => void {
    if (getPlatform() !== 'android') return () => {}

    const listener = CapacitorApp.addListener('backButton', () => {
        if (runBackHandler()) return
        if (onUnhandled()) return
        void CapacitorApp.minimizeApp()
    })

    return () => {
        void listener.then((l) => l.remove())
    }
}

/** テスト用：登録済みハンドラを全て消す */
export function resetBackHandlersForTest(): void {
    handlerStack.length = 0
}
