import { describe, test, expect } from 'vitest'
import { resolveImports } from '../src/resolvePackage'
import path from 'path'
import fs from 'fs-extra'

describe('resolve imports test. ', () => {
  test('axios 0.2.x', async () => {
    const root = path.join(__dirname, './fixtures/packages/axios/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const importer = await resolveImports(pkg)

    expect(importer).toEqual({
      imports: {
        '#lib/adapters/http.js': {
          browser: './lib/adapters/xhr.js',
          default: './lib/adapters/http.js',
        },
      },
    })
  })
})
