import { describe, expect, it } from 'vitest'
import { provarPty } from './smokePty'

describe('node-pty neste PC', () => {
  it.runIf(process.platform === 'win32')('abre um PowerShell e le a saida', async () => {
    expect(await provarPty()).toBe(true)
  })
})
