import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'
import type { ClientConfig } from '../domain/entities/client-config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = resolve(__dirname, '../../clients.yaml')

export interface ClientsConfig {
  clients: ClientConfig[]
}

export interface LoadedClients {
  map: Map<string, ClientConfig>
  count: number
}

export function loadClients(): LoadedClients {
  const path = existsSync(CONFIG_PATH) ? CONFIG_PATH : resolve(__dirname, '../../clients.example.yaml')

  if (!existsSync(path)) {
    console.error('[clients] No se encuentra clients.yaml en', CONFIG_PATH)
    process.exit(1)
  }

  const raw = readFileSync(path, 'utf-8')
  const parsed = yaml.load(raw) as ClientsConfig

  const map = new Map<string, ClientConfig>()
  for (const client of parsed.clients) {
    map.set(client.id, client)
    // También indexar por dominio
    for (const domain of client.domains) {
      map.set(domain, client)
    }
  }

  console.log(`[clients] ${parsed.clients.length} cliente(s) cargados:`)
  for (const c of parsed.clients) {
    console.log(`  - ${c.id} (${c.name}) → ${c.to}`)
  }

  return { map, count: parsed.clients.length }
}

export function findClient(clients: Map<string, ClientConfig>, clientIdOrDomain: string): ClientConfig | undefined {
  return clients.get(clientIdOrDomain)
}
