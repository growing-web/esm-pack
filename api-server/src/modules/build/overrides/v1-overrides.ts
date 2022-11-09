export default {
  axios: {
    overrides: [
      {
        range: '1.x',
        package: {
          main: './dist/axios.min.js',
          module: './dist/axios.js',
          exports: {
            '.': './dist/axios.min.js',
          },
          files: ['dist/axios.min.js'],
        },
      },
      {
        range: '0.x',
        package: {
          main: './dist/axios.js',
          module: './dist/axios.js',
          exports: {
            '.': './dist/axios.js',
          },
          files: ['dist/axios.js'],
        },
      },
    ],
  },
  mqtt: {
    overrides: [
      {
        range: '4.x',
        package: {
          main: './dist/mqtt.js',
          module: './dist/mqtt.js',
          exports: {
            '.': './dist/mqtt.js',
          },
          files: ['dist/mqtt.js'],
        },
      },
    ],
  },
  'video.js': {
    overrides: [
      {
        range: '7.x',
        package: {
          main: './dist/video.js',
          module: './dist/video.js',
          exports: {
            '.': './dist/video.js',
          },
        },
      },
    ],
  },
  jszip: {
    overrides: [
      {
        range: '3.x',
        package: {
          main: './dist/jszip.js',
          module: './dist/jszip.js',
          exports: {
            '.': './dist/jszip.js',
          },
          files: ['./dist/jszip.js'],
        },
      },
    ],
  },
  qs: {
    overrides: [
      {
        range: '6.x',
        package: {
          main: './dist/qs.js',
          module: './dist/qs.js',
          exports: {
            '.': './dist/qs.js',
          },
        },
      },
    ],
  },
}
