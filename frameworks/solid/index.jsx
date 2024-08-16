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
import { lazy } from "solid-js";
import { HashRouter, Route } from "@solidjs/router";
import { createRenderer, Config, View } from "@lightningtv/solid";
import {
  SdfTrFontFace,
} from "@lightningjs/renderer";
import { setRenderer } from "./src/utils/renderer";

Config.debug = false;
Config.animationsEnabled = false;
Config.rendererOptions = {
    enableInspector: false,
};
const Benchmark = lazy(() => import("./src/benchmark"));
const Memory = lazy(() => import("./src/memory"));

const App = (props) => {
  return (
    <View {...props} />
  );
}

const { renderer, render } = createRenderer();

renderer.stage.fontManager.addFontFace(
  new SdfTrFontFace(
    'msdf',
    {
      fontFamily: 'Ubuntu',
      descriptors: {
        weight: 700,
      },
      atlasDataUrl: './fonts/Ubuntu-Bold.msdf.json',
      atlasUrl: './fonts/Ubuntu-Bold.msdf.png',
      stage: renderer.stage,
    }
  )
);

render(() => (
    <HashRouter root={(props) => <App {...props} />}>
      <Route path="" component={Benchmark} />
      <Route path="memory" component={Memory} />
    </HashRouter>
));

setRenderer(renderer);