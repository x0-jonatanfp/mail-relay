import nodemailer from 'nodemailer'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { MailSender } from '../../domain/ports/mail-sender.js'
import type { FormData, FormResult } from '../../domain/entities/form-data.js'
import type { ClientConfig } from '../../domain/entities/client-config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Adaptador: envía emails via SMTP con Nodemailer (configurado por cliente) */
export class SmtpSender implements MailSender {
  async send(data: FormData, client: ClientConfig): Promise<FormResult> {
    const transporter = nodemailer.createTransport({
      host: client.smtp.host,
      port: client.smtp.port,
      secure: client.smtp.secure,
      auth: {
        user: client.smtp.user,
        pass: client.smtp.pass,
      },
    })

    try {
      const html = this.renderTemplate(client, data)
      const text = this.renderText(client, data)

      await transporter.sendMail({
        from: `${client.from.name} <${client.from.email}>`,
        to: data.to || client.to,
        replyTo: `${data.from_name} <${data.from_email}>`,
        subject: `Nuevo mensaje de ${data.from_name} - ${client.name}`,
        text,
        html,
      })

      return {
        success: true,
        method: 'smtp',
        message: 'Mensaje enviado correctamente',
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        method: 'none',
        message: 'Error al enviar por SMTP',
        error: message,
      }
    }
  }

  private renderTemplate(client: ClientConfig, data: FormData): string {
    // Buscar template personalizado o usar default
    const templateName = client.template || 'default'
    const tplPath = resolve(__dirname, `../../../templates/${templateName}.html`)
    const defaultPath = resolve(__dirname, '../../../templates/default.html')

    const tplFile = existsSync(tplPath) ? tplPath
      : existsSync(defaultPath) ? defaultPath
      : null

    if (!tplFile) {
      // Sin template, generar HTML inline básico
      return this.buildHtmlFallback(client, data)
    }

    let html = readFileSync(tplFile, 'utf-8')

    // Reemplazar variables
    html = html
      .replace(/{{client_name}}/g, client.name)
      .replace(/{{client_email}}/g, client.from.email)
      .replace(/{{from_name}}/g, data.from_name)
      .replace(/{{from_email}}/g, data.from_email)
      .replace(/{{phone}}/g, data.phone || '—')
      .replace(/{{subject}}/g, data.subject)
      .replace(/{{message}}/g, data.message)
      .replace(/{{site_url}}/g, client.domains[0] ? `https://${client.domains[0]}` : '')

    return html
  }

  private renderText(client: ClientConfig, data: FormData): string {
    const url = client.domains[0] ? `https://${client.domains[0]}` : client.name
    return [
      `Nuevo mensaje de ${client.name}`,
      '',
      `Nombre: ${data.from_name}`,
      `Email: ${data.from_email}`,
      data.phone ? `Teléfono: ${data.phone}` : '',
      `Producto / Asunto: ${data.subject}`,
      '',
      '--- Mensaje ---',
      data.message || '—',
      '',
      `--- Enviado desde ${url} ---`,
    ].filter(Boolean).join('\n')
  }

  private buildHtmlFallback(client: ClientConfig, data: FormData): string {
    const rows = [
      { label: 'Nombre', value: data.from_name },
      { label: 'Email', value: data.from_email },
      { label: 'Teléfono', value: data.phone },
      { label: 'Producto / Asunto', value: data.subject },
    ].filter((i) => i.value)

    const htmlRows = rows.map(
      (r) => `<tr>
        <td style="padding:10px 15px;border-bottom:1px solid #eee;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:.5px;font-weight:600">${r.label}</td>
        <td style="padding:10px 15px;border-bottom:1px solid #eee;color:#333;font-size:15px">${r.value}</td>
      </tr>`,
    ).join('')

    const url = client.domains[0] ? `https://${client.domains[0]}` : ''
    const footerHtml = url
      ? `<a href="${url}" style="color:#e67e22;text-decoration:none">${client.name}</a>`
      : client.name

    return `
      <div style="font-family:Montserrat,-apple-system,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#e67e22,#d35400);padding:40px 30px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">${client.name}</h1>
        </div>
        <div style="background:#fff;padding:30px;border:1px solid #ddd">
          <h2 style="color:#2c3e50;font-size:18px;margin:0 0 20px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e67e22;padding-bottom:10px">
            Información del contacto
          </h2>
          <table style="width:100%;border-collapse:collapse">${htmlRows}</table>
          <h3 style="color:#2c3e50;font-size:16px;margin:25px 0 10px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e67e22;padding-bottom:10px">Mensaje</h3>
          <div style="background:#f8f9fa;padding:20px;border:1px solid #ddd;font-size:14px;line-height:1.6;color:#495057;white-space:pre-wrap">${data.message || '—'}</div>
        </div>
        <div style="background:#000;padding:20px;text-align:center;border-top:3px solid #e67e22">
          <p style="color:#999;font-size:12px;margin:0">${footerHtml}</p>
        </div>
      </div>`
  }
}
