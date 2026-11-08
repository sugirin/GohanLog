import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

const { addListener, minimizeApp, remove, getPlatform } = vi.hoisted(() => ({
    addListener: vi.fn(),
    minimizeApp: vi.fn(),
    remove: vi.fn(),
    getPlatform: vi.fn(),
}))

vi.mock('@capacitor/app', () => ({
    App: { addListener, minimizeApp },
}))

vi.mock('./platformUtils', () => ({
    getPlatform,
}))

import {
    resetBackHandlersForTest,
    runBackHandler,
    setupAndroidBackButton,
    useBackHandler,
} from './backButton'

beforeEach(() => {
    resetBackHandlersForTest()
    addListener.mockReset().mockResolvedValue({ remove })
    minimizeApp.mockReset().mockResolvedValue(undefined)
    remove.mockReset()
    getPlatform.mockReset().mockReturnValue('android')
})

afterEach(() => {
    resetBackHandlersForTest()
})

describe('useBackHandler / runBackHandler', () => {
    it('登録が無ければ false を返す', () => {
        expect(runBackHandler()).toBe(false)
    })

    it('active の間だけ登録され、最後に登録したものから 1 つだけ呼ばれる', () => {
        const first = vi.fn()
        const second = vi.fn()
        renderHook(() => useBackHandler(true, first))
        renderHook(() => useBackHandler(true, second))

        expect(runBackHandler()).toBe(true)
        expect(second).toHaveBeenCalledTimes(1)
        expect(first).not.toHaveBeenCalled()
    })

    it('active が false のときは登録されない', () => {
        const handler = vi.fn()
        renderHook(() => useBackHandler(false, handler))
        expect(runBackHandler()).toBe(false)
        expect(handler).not.toHaveBeenCalled()
    })

    it('active が false に変わる／アンマウントすると登録が外れる', () => {
        const handler = vi.fn()
        const { rerender, unmount } = renderHook(
            ({ active }) => useBackHandler(active, handler),
            { initialProps: { active: true } },
        )
        rerender({ active: false })
        expect(runBackHandler()).toBe(false)

        rerender({ active: true })
        unmount()
        expect(runBackHandler()).toBe(false)
    })

    it('handler が変わっても最新のものが呼ばれる', () => {
        const oldHandler = vi.fn()
        const newHandler = vi.fn()
        const { rerender } = renderHook(
            ({ handler }) => useBackHandler(true, handler),
            { initialProps: { handler: oldHandler } },
        )
        rerender({ handler: newHandler })

        runBackHandler()
        expect(newHandler).toHaveBeenCalledTimes(1)
        expect(oldHandler).not.toHaveBeenCalled()
    })
})

describe('setupAndroidBackButton', () => {
    const pressBack = () => {
        const callback = addListener.mock.calls[0][1] as () => void
        callback()
    }

    it('Android 以外ではリスナーを登録しない', () => {
        getPlatform.mockReturnValue('ios')
        setupAndroidBackButton(() => false)
        expect(addListener).not.toHaveBeenCalled()
    })

    it('モーダルが開いていればそれを閉じ、onUnhandled は呼ばない', () => {
        const onUnhandled = vi.fn(() => true)
        const close = vi.fn()
        renderHook(() => useBackHandler(true, close))
        setupAndroidBackButton(onUnhandled)

        pressBack()
        expect(close).toHaveBeenCalledTimes(1)
        expect(onUnhandled).not.toHaveBeenCalled()
        expect(minimizeApp).not.toHaveBeenCalled()
    })

    it('モーダルが無ければ onUnhandled を呼び、true ならアプリは最小化しない', () => {
        const onUnhandled = vi.fn(() => true)
        setupAndroidBackButton(onUnhandled)

        pressBack()
        expect(onUnhandled).toHaveBeenCalledTimes(1)
        expect(minimizeApp).not.toHaveBeenCalled()
    })

    it('onUnhandled が false ならアプリを最小化する', () => {
        setupAndroidBackButton(() => false)

        pressBack()
        expect(minimizeApp).toHaveBeenCalledTimes(1)
    })

    it('解除関数でリスナーを外す', async () => {
        const cleanup = setupAndroidBackButton(() => false)
        cleanup()
        await vi.waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
    })
})
