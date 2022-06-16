import dotenv from 'dotenv'

export function loadEnv(options: { env?: string; addon?: string[] } = {}) {
  const { env = process.env.NODE_ENV, addon = [] } = options
  const envList = [
    '.env',
    '.env.local',
    `.env.${env}.local`,
    `.env.${env}`,
    ...addon,
  ]

  envList.forEach((e) => {
    dotenv.config({
      path: e,
      override: true,
    })
  })

  for (const envName of Object.keys(process.env)) {
    const value = process?.env?.[envName]?.replace(/\\n/g, '\n') ?? ''
    process.env[envName] = value
  }
}
