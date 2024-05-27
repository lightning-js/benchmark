import Blits from '@lightningjs/blits'

import Benchmark from './pages/Benchmark.js'
import Memory from './pages/Memory.js'

export default Blits.Application({
  template: `
    <Element>
      <RouterView />
    </Element>
    `,
  routes: [
    { path: '/', component: Benchmark },
    { path: '/memory', component: Memory },
  ],
})
