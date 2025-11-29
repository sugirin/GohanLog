import { Capacitor } from '@capacitor/core';

/**
 * ネイティブプラットフォーム（iOS/Android）で実行されているかを判定
 */
export const isNativePlatform = (): boolean => {
    return Capacitor.isNativePlatform();
};

/**
 * 現在のプラットフォームを取得
 * @returns 'ios' | 'android' | 'web'
 */
export const getPlatform = (): string => {
    return Capacitor.getPlatform();
};

/**
 * Webプラットフォームで実行されているかを判定
 */
export const isWeb = (): boolean => {
    return Capacitor.getPlatform() === 'web';
};

/**
 * iOSプラットフォームで実行されているかを判定
 */
export const isIOS = (): boolean => {
    return Capacitor.getPlatform() === 'ios';
};

/**
 * Androidプラットフォームで実行されているかを判定
 */
export const isAndroid = (): boolean => {
    return Capacitor.getPlatform() === 'android';
};
