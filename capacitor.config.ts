import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.sugirin.gohanlog',
    appName: 'GohanLog',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    android: {
        // targetSdk 35 では Android 15 端末で edge-to-edge が強制され、WebView が
        // ステータスバー／ナビゲーションバーの下に潜り込む。'auto' にすると Android 15
        // のときだけ Capacitor がシステムバー分のマージンを付ける（Capacitor 8 で既定値になる）。
        adjustMarginsForEdgeToEdge: 'auto'
    }
};

export default config;
