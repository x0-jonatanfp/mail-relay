// Carga el .env antes de leer LOG_FILE/LOG_LEVEL (la unidad de systemd ya los
// pasa en el entorno; esto cubre el arranque en desarrollo).
import 'dotenv/config'
import winston from 'winston'

// Un único fichero de aplicación: aplicación y errores van al mismo sitio y la
// rotación la hace logrotate. La ruta la fija la unidad con Environment=LOG_FILE.
const logFile = process.env.LOG_FILE ?? '/var/log/mail-relay.log'

const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
)

export const logger = winston.createLogger({
  level: (process.env.LOG_LEVEL ?? 'info').toLowerCase(),
  format,
  transports: [
    // La consola alimenta el journal del servicio.
    new winston.transports.Console(),
    new winston.transports.File({ filename: logFile }),
  ],
})

export default logger
