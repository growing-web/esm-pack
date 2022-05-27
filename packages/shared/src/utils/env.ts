import dotenv from 'dotenv'

export function loadEnv(env = process.env.NODE_ENV) {
  const envList = [`.env.${env}.local`, `.env.${env}`, '.env.local', '.env']
  envList.forEach((e) => {
    dotenv.config({
      path: e,
    })
  })

  for (const envName of Object.keys(process.env)) {
    const value = process?.env?.[envName]?.replace(/\\n/g, '\n') ?? ''
    process.env[envName] = value
  }
}
