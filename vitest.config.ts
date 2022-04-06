/// <reference types="vitest" />
import type { AliasOptions } from 'vite'

import { defineConfig } from 'vite'
import { resolve } from 'path'

const _resolve = (p: string) => resolve(__dirname, p)

const alias: AliasOptions = {
  '@': _resolve('./src/'),
}

export default defineConfig({
  resolve: {
    alias,
  },
})
