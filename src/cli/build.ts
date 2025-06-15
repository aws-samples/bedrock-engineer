/**
 * CLI用ビルドスクリプト
 */
import { build } from 'vite'
import { resolve } from 'path'
import { externalizeDepsPlugin } from 'electron-vite'

async function buildCli() {
  try {
    await build({
      configFile: false,
      build: {
        lib: {
          entry: resolve(__dirname, 'index.ts'),
          formats: ['cjs'],
          fileName: () => 'index.js'
        },
        outDir: resolve(__dirname, '../../out/cli'),
        emptyOutDir: true,
        rollupOptions: {
          external: [
            'electron',
            'fs', 
            'path', 
            'os', 
            'child_process', 
            'http', 
            'https', 
            'url',
            'net',
            'tls',
            'crypto',
            'util',
            'events',
            'stream',
            'zlib',
            'readline',
            'inquirer',
            'chalk',
            'commander',
            'ora',
            /node:.*/
          ]
        }
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, '../')
        }
      },
      plugins: [externalizeDepsPlugin()]
    })
    console.log('CLI build completed successfully!')
  } catch (error) {
    console.error('CLI build failed:', error)
    process.exit(1)
  }
}

buildCli()