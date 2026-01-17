import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.AI_PROVIDER': JSON.stringify(env.AI_PROVIDER || 'gemini'),
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.LOCAL_API_URL': JSON.stringify(env.LOCAL_API_URL || 'http://localhost:1234/v1'),
        'process.env.LOCAL_API_KEY': JSON.stringify(env.LOCAL_API_KEY || 'not-needed'),
        'process.env.LOCAL_MODEL': JSON.stringify(env.LOCAL_MODEL || 'local-model'),
        'process.env.LOCAL_MODEL_OUTLINE': JSON.stringify(env.LOCAL_MODEL_OUTLINE),
        'process.env.LOCAL_MODEL_CHAPTER': JSON.stringify(env.LOCAL_MODEL_CHAPTER),
        'process.env.LOCAL_MODEL_SUMMARY': JSON.stringify(env.LOCAL_MODEL_SUMMARY),
        'process.env.API_SERVER_URL': JSON.stringify(env.API_SERVER_URL || 'http://localhost:3001')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
