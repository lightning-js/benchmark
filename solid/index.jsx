import {
    createEffect,
    createMemo,
    on,
    createSignal,
    Show,
    createSelector,
    For,
  } from "solid-js";
import { render, Text, View, hexColor, Config } from "@lightningjs/solid";
import { colours, adjectives, nouns } from '../data/data';

Config.debug = true;
Config.animationsEnabled = true;
Config.fontSettings.fontFamily = "Ubuntu";
Config.fontSettings.color = hexColor("#f6f6f6");
Config.fontSettings.fontSize = 32;
Config.rendererOptions = {
//   coreExtensionModule: coreExtensionModuleUrl,
//   fpsUpdateInterval: logFps ? 200 : 0,
  enableInspector: true,
  // deviceLogicalPixelRatio: 1
};


const appHeight = 1080;
const appWidth = 1900;
const pick = dict => dict[Math.round(Math.random() * 1000) % dict.length];
let idCounter = 1;

function buildData(count) {
    let data = new Array(count);
    for (let i = 0; i < count; i++) {
      const [label, setLabel] = createSignal(`${adjectives[pick(adjectives.length)]} ${nouns[pick(nouns.length)]}`);
      const [color, setColor] = createSignal(pick(colours));
      const [textColor, setTextColor] = createSignal(pick(colours));
      data[i] = {
        id: idCounter++,
        label, setLabel,
        color, setColor,
        textColor, setTextColor
      }
    }
    return data;
}

let renderer = null;
let controlFunctions = {
    run: null,
    runLots: null,
    add: null,
    update: null,
    clear: null,
    swapRows: null,
    remove: null
};

let lastX = 10;
let lastY = 10;

const App = () => {
    const [data, setData] = createSignal([]),
    // [selected, setSelected] = createSignal(null),
    run = () => {
        setData(buildData(1000))
        renderer.once('idle', () => {
            console.log('idle')
        });
    }
    // runLots = () => setData(buildData(10000)),
    // add = () => setData(d => [...d, ...buildData(1000)]),
    // update = () => batch(() => {
    //   for(let i = 0, d = data(), len = d.length; i < len; i += 10)
    //     d[i].setLabel(l => l + ' !!!');
    // }),
    // swapRows = () => {
    //   const d = data().slice();
    //   if (d.length > 998) {
    //     let tmp = d[1];
    //     d[1] = d[998];
    //     d[998] = tmp;
    //     setData(d);
    //   }
    // },
    // clear = () => setData([]),
    // remove = id => setData(d => {
    //   const idx = d.findIndex(d => d.id === id);
    //   return [...d.slice(0, idx), ...d.slice(idx + 1)];
    // }),
    // isSelected = createSelector(selected);

    // set control functions
    controlFunctions.run = run;

    return <View x={10} y={10} width={200} height={40} color={pick(colours)}>
            <Text 
                x={5}
                y={2}
                width={200}
                height={40}
                alpha={0.8}
                fontFamily={'Ubuntu'}
                color={pick(colours)}
                fontSize={26}>
                Hello World
            </Text>
        </View>
   
    return <View>
        <For each={ data() }>{ (row, index) => {
            let x = lastX;
            let y = lastY;

            <View x={x} y={y} width={200} height={40} color={row.color()}>
                <Text 
                    x={5}
                    y={2}
                    width={200}
                    height={40}
                    alpha={0.8}
                    fontFamily={'Ubuntu-ssdf'}
                    color={row.textColor()}
                    fontSize= {26}>
                    {row.label()}
                </Text>
            </View>

            lastY += 40;

            if (lastY >= appHeight) {
                lastY = 10;
                lastX += 40;
            }

            if (lastX >= appWidth) {
                lastX = Math.floor(Math.random() * 10);
                lastY = Math.floor(Math.random() * 10);
            }
        }}
        </For>
    </View>
}

// clear existing canvas, sometimes they are not cleared
const app = document.getElementById('app');
app.innerHTML = '';

const solidResp = await render(() => <App />);
renderer = solidResp.renderer;

// controlFunctions.run()
