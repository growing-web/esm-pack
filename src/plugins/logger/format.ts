import colors from 'picocolors'
import dayjs from 'dayjs'
import { format } from 'winston'

const { printf } = format

export const devConsoleFormat: any = printf(
  ({ timestamp, level, message, ms }) => {
    const formattedDate = dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
    const log = `[${level}] ${formattedDate} - ${message} ${colors.yellow(ms)}`
    return log
  },
)
