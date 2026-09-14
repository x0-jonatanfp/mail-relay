import { describe, it, expect } from 'vitest'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// LOG_FILE se lee al cargar el módulo, así que se fija antes del import dinámico.
const dir = mkdtempSync(join(tmpdir(), 'mail-relay-log-'))
const logFile = join(dir, 'mail-relay.log')
process.env.LOG_FILE = logFile

const { logger } = await import('./Logger.js')

describe('Logger', () => {
  it('escribe aplicación y error en el mismo fichero, en JSON', async () => {
    logger.info('[test] línea de info')
    logger.error('[test] línea de error')
    // end() espera a que los transports emitan 'finish' (close() no cerraba nada).
    await new Promise<void>((resolve) => logger.end(resolve))

    const lines = readFileSync(logFile, 'utf-8').trim().split('\n')
    expect(lines).toHaveLength(2)

    const [info, error] = lines.map((line) => JSON.parse(line))
    expect(info).toMatchObject({ level: 'info', message: '[test] línea de info' })
    expect(error).toMatchObject({ level: 'error', message: '[test] línea de error' })
    expect(typeof info.timestamp).toBe('string')
  })
})
