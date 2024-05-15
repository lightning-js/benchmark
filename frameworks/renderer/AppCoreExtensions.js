import { CoreExtension, SdfTrFontFace } from "@lightningjs/renderer/core";

export default class AppCoreExtension extends CoreExtension {
  async run(stage) {
    stage.fontManager.addFontFace(
      new SdfTrFontFace(
        "Ubuntu",
        {},
        "msdf",
        stage,
        "./fonts/Ubuntu-Bold.msdf.png",
        "./fonts/Ubuntu-Bold.msdf.json"
      )
    );
  }
}
