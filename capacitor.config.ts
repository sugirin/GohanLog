import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.sugirin.gohanlog',
    appName: 'GohanLog',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
