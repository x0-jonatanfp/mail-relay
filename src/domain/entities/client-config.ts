export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
}

export interface FromConfig {
  name: string
  email: string
}

export interface ClientConfig {
  id: string
  name: string
  domains: string[]
  smtp: SmtpConfig
  from: FromConfig
  to: string
  template?: string
}
