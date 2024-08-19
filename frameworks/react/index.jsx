/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Canvas,
  SdfTrFontFace,
  createRoot as createRootLng,
} from '@plex/react-lightning';
import { keyMap } from './src/keyMap';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import inspector from '@plex/react-lightning-plugin-inspector';
import { Benchmark } from './src/pages/Benchmark';
import { setRenderer } from './src/utils/renderer';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Benchmark />,
  },
  // {
  //   path: '/memory',
  //   element: <LayoutPage />,
  // },
]);

const options = {
  fonts: (stage) => [
    new SdfTrFontFace('msdf', {
      fontFamily: 'Ubuntu',
      descriptors: {
        weight: 700,
      },
      atlasUrl: '/fonts/Ubuntu-Bold.msdf.png',
      atlasDataUrl: '/fonts/Ubuntu-Bold.msdf.json',
      stage,
    })
  ],
  plugins: [inspector({ borders: false })],
};

const App = () => (
  <Canvas keyMap={keyMap} options={options}>
    <RouterProvider router={router} />
  </Canvas>
);

createRootLng(document.getElementById('app'), options)
.then((root) => {
  root.render(<App />);

  setRenderer(root.renderer);
})
.catch((error) => {
  console.error(error);
});
