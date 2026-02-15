import { describe, it, expect } from 'vitest'
import { readJsonFile } from './fileParser'

function createJsonFile(content: string, name = 'test.json'): File {
  return new File([content], name, { type: 'application/json' })
}

describe('readJsonFile', () => {
  it('parses valid JSON from a file', async () => {
    const data = { hello: 'world', count: 42 }
    const file = createJsonFile(JSON.stringify(data))
    const result = await readJsonFile<typeof data>(file)
    expect(result).toEqual(data)
  })

  it('parses a JSON array', async () => {
    const data = [1, 2, 3]
    const file = createJsonFile(JSON.stringify(data))
    const result = await readJsonFile<number[]>(file)
    expect(result).toEqual(data)
  })

  it('rejects with error message including filename on invalid JSON', async () => {
    const file = createJsonFile('not valid json', 'bad-data.json')
    await expect(readJsonFile(file)).rejects.toThrow('Invalid JSON in "bad-data.json"')
  })

  it('rejects with error message including filename on empty content', async () => {
    const file = createJsonFile('', 'empty.json')
    await expect(readJsonFile(file)).rejects.toThrow('Invalid JSON in "empty.json"')
  })
})
