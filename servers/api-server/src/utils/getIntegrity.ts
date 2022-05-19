import SRIToolbox from 'sri-toolbox'

export function getIntegrity(data: string) {
  return SRIToolbox.generate({ algorithms: ['sha384'] }, data)
}
