import SRIToolbox from 'sri-toolbox'

export function getIntegrity(data) {
  return SRIToolbox.generate({ algorithms: ['sha384'] }, data)
}
