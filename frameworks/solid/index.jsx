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