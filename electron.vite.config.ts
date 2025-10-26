import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import tailwindcss from 'tailwindcss'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src'),
        '@common': resolve('src/common')
      }
    },
    optimizeDeps: {
      include: [
        'react-syntax-highlighter',
        'react-syntax-highlighter/dist/esm/styles/prism',
        'refractor'
      ]
    },
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          exportType: 'default',
          ref: true,
          svgo: false,
          titleProp: true
        },
        include: '**/*.svg'
      })
    ],
    css: {
      postcss: {
        plugins: [tailwindcss() as any]
      }
    },
    build: {
      commonjsOptions: {
        include: [/react-syntax-highlighter/, /refractor/, /node_modules/]
      }
    }
  }
})
