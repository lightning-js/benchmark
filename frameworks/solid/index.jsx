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

// import { render, Text, Config } from "@lightningjs/solid";
import coreExtensionModuleUrl from "./AppCoreExtensions.js?importChunkUrl";

import {
  lazy
} from "solid-js";
import { HashRouter, Route } from "@solidjs/router";
import { render, hexColor, Config, View, Text } from "@lightningjs/solid";

import { setRenderer } from "./src/utils/renderer";

Config.debug = false;
Config.animationsEnabled = true;
Config.fontSettings.fontFamily = "Ubuntu";
Config.fontSettings.color = hexColor("#f6f6f6");
Config.fontSettings.fontSize = 64;
Config.rendererOptions = {
    coreExtensionModule: coreExtensionModuleUrl,
    enableInspector: false,
};
const Benchmark = lazy(() => import("./src/benchmark"));
const Memory = lazy(() => import("./src/memory"));

const App = (props) => {
  return (
    <View {...props} />
  );
}

const s = await render(() => (
    <HashRouter root={(props) => <App {...props} />}>
      <Route path="" component={Benchmark} />
      <Route path="memory" component={Memory} />
    </HashRouter>
));

setRenderer(s.renderer);