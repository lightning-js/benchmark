import Blits from '@lightningjs/blits'
import App from './App.js'

Blits.Launch(App, 'app', {
  w: 1920,
  h: 1080,
  multithreaded: false,
  debugLevel: 1,
  fonts: [
    {
      family: 'Ubuntu',
      type: 'msdf',
      file: 'fonts/Ubuntu-Bold.ttf',
    },
  ],
})
