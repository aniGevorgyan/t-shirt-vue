<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="main-content">
        <div class="row" ref="mainBlock">
          <div class="layers-panel sm-full-width">
            <LayersPanel/>
          </div>
          <div class="canvas-column">
            <div class="canvas-designer">
              <ModeSelector/>
              <div class="flex flex-center sm-overflow-scroll" id="canvas-custom">
                <div class="canvas-wrapper"
                     v-bind:style="{ backgroundImage: selectedModelColorUrl ? `url('${selectedModelColorUrl}')` : null }">
                  <div class="canvas-block" :class="{ lrSide: ifSideMode() }" :style="
                       {
                         height: selectedModelCoordinated?.height + 'px',
                         width: selectedModelCoordinated?.width + 'px',
                         top: (ifSideMode() ? null : selectedModelCoordinated?.top + 'px'),
                         bottom: (ifSideMode() ? 0 : null),
                         left: (ifSideMode() ? 0 : selectedModelCoordinated?.left) + 'px',
                         backgroundColor: ifSideMode() ? selectedModelColor?.hex : null,
                       }">
                    <canvas ref="canvas"></canvas>
<!--                        :style="selectedLayer.layerId && !ifSideMode() ? {border: '1px solid #e0e0e066'} : {}"-->
                  </div>
                  <div class="canvas-block-2" :style="
                       {
                         visibility: ifSideMode() ? 'visible' : 'hidden',
                         height: selectedModelCoordinated?.height + 'px',
                         width: selectedModelCoordinated?.width + 'px',
                         top: selectedModelCoordinated?.top + 'px',
                         left: selectedModelCoordinated?.left + 'px',
                       }">
                    <canvas ref="canvas2"></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="control-panel order-sm-last sm-full-width">
            <ControlsPanel/>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>

  <InitModal/>
</template>

<script>
import {mapState} from "vuex";
import {mapGetters} from "vuex";
import {mapMutations} from "vuex";
import {fabric} from "fabric";
import {syncLanguage} from "./locales";

import UserService from "@/services/user";
import CanvasService from "@/services/canvas";
import ProductService from "@/services/product";

import WebFont from "webfontloader";
import WebFontConfig from "@/WebFontConfig";

import LayersPanel from "@/components/Layers/Panel";
import ModeSelector from "@/components/Controls/ModeSelector";
import ControlsPanel from "@/components/Controls/Panel";

import InitModal from "@/components/Modals/Init";

export default {
  name: "LayoutDefault",

  inject: ["ctx"],

  components: {
    LayersPanel,
    ControlsPanel,
    ModeSelector,
    InitModal,
  },

  data() {
    return {
      resizeObserver: null,
    };
  },

  mounted() {
    const url = new URL(window.location.href);
    const product_id = url.searchParams.get('product_id');
    const project_id = url.searchParams.get('project_id');
    this.loadProductModels(product_id, project_id);

    const ref = this.$refs.canvas;
    const ref2 = this.$refs.canvas2;
    this.ctx.canvas = new fabric.Canvas(ref, {
      selection: false,
      allowTouchScrolling: true,
    });

    this.ctx.canvas2 = new fabric.Canvas(ref2);

    this.ctx.canvas.on("before:selection:cleared", () => {
      this.resetSelectedLayer();
      this.setControlTab("product");
      this.syncToCanvas2();
    });

    this.ctx.canvas.on("selection:created", (event) => {
      this.handleSelection(event);
      this.syncToCanvas2();
    });

    this.ctx.canvas.on("selection:updated", (event) => {
      this.handleSelection(event);
      this.syncToCanvas2();
    });

    this.ctx.canvas.on("object:modified", (event) => {
      if (event.action === "scale" || event.action === "rotate") {
        this.selectedLayer.dirty = true;
      }
      this.syncToCanvas2();
    });

    this.ctx.canvas.on({
      "object:added": () => {
        this.syncLayers(this.ctx.canvas.getObjects());
        this.syncToCanvas2();
      },
      "object:removed": () => {
        this.syncLayers(this.ctx.canvas.getObjects());
        this.syncToCanvas2();
      },
    });

    this.ctx.canvas.on("mouse:dblclick", ({target}) => {
      if (target && target.type === 'image') {
        CanvasService.prepareCrop(target)
      }
    })

    document.addEventListener("keydown", (e) => {
      if (
          ["Delete", "Backspace"].includes(e.key) &&
          this.selectedLayer.layerId
      ) {
        if (document.querySelector(".layer-text-field")?.matches(":focus"))
          return;
        CanvasService.removeLayer(this.selectedLayer);
      }
    });

    const observedElement = this.$refs.mainBlock;

    if (observedElement) {
      // Initialize ResizeObserver
      this.resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const height = entry.contentRect.height;
          this.handleHeight(height);
        }
      });

      // Start observing
      this.resizeObserver.observe(observedElement);
    }

    WebFont.load(WebFontConfig);
  },

  beforeUnmount() {
    // Clean up the observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  },

  computed: {
    ...mapState("app", ["user"]),
    ...mapState("canvas", ["mode", "selectedLayer"]),
    ...mapState("product", ["selectedModelColor"]),
    ...mapGetters("product", ["selectedModelColorUrl"]),
    ...mapGetters("product", ["selectedModelCoordinated"]),
  },

  watch: {
    sideMode() {
      this.ifSideMode();
    },
    selectedModelColorUrl(url) {
      this.ctx.canvas.setHeight(this.selectedModelCoordinated.height);
      this.ctx.canvas.setWidth(this.selectedModelCoordinated.width);
      this.ctx.canvas.renderAll();

      this.ctx.canvas2.setHeight(this.selectedModelCoordinated.height);
      this.ctx.canvas2.setWidth(this.selectedModelCoordinated.width);
      this.ctx.canvas2.renderAll();
    },
  },

  methods: {
    ...mapMutations("app", [
      "setUser",
      "setControlTab",
    ]),
    ...mapMutations("order", ["setPricing"]),
    ...mapMutations("canvas", [
      "setMode",
      "syncLayers",
      "setSelectedLayer",
      "resetSelectedLayer",
    ]),
    ...mapMutations("product", ["setModels"]),

    handleSelection(event) {
      let layer = event.selected[0];
      if (this.selectedLayer.layerId != layer.layerId) {
        this.setSelectedLayer(layer);
        this.setControlTab("object");
      }
    },

    handleHeight(height) {
      console.log("iframe height ---------------- ", height);
      window.parent.postMessage({ action: 'resize', iframeHeight: height }, '*')
    },

    ifSideMode() {
      return this.mode === 'left_side' || this.mode === 'right_side';
    },

    syncToCanvas2() {
      const json = this.ctx.canvas.toJSON();
      this.ctx.canvas2.loadFromJSON(json, this.ctx.canvas2.renderAll.bind(this.ctx.canvas2), function (o, object) {
        object.set('selectable', false);
      });
    },

    async loadProductModels(product_id, project_id) {
      let models = await ProductService.getModel(product_id, project_id);
      this.setModels(models);

      if (models[0]?.canvas) {
        let data = JSON.parse(models[0]?.canvas.json);
        this.ctx.canvasMode = 'edit';
        CanvasService.loadFromJSON(data.canvasData, () => {
          CanvasService.changeMode();
        });
      }

      if (models[0].images[0].front) {
        return this.setMode('front')
      }

      if (models[0].images[0].back) {
        return this.setMode('back')
      }

      if (models[0].images[0].left_side) {
        return this.setMode('left_side')
      }

      if (models[0].images[0].right_side) {
        return this.setMode('right_side')
      }
    },
  },
};
</script>

<style lang="scss">
.canvas-designer {
  //box-shadow: 0 0 5px #d9d9d9;
  position: sticky;
  display: flex;
  gap: 10px;

  .sm-overflow-scroll {
    @media (max-width: $breakpoint-sm) {
      overflow-y: scroll;
      justify-content: initial;
      margin-top: 20px;
    }
  }

  .canvas-wrapper {
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center center;
    width: 600px;
    min-width: 600px;
    height: 500px;
    position: relative;

    .canvas-block, .canvas-block-2 {
      position: absolute;

      &.lrSide {
        transform-origin: 0 100%;
        transform: scale(4, 4);
      }
    }
  }

  @media (min-width: $breakpoint-sm) {
    margin: 50px 10px 0 10px;
  }
  @media (max-width: $breakpoint-sm) {
    padding-top: 50px;
  }
}

.layers-panel, .control-panel  {
  width: 325px;

  @media (max-width: $breakpoint-sm) {
    width: 100%;
  }
}

.canvas-column {
  width: 700px;
  @media (max-width: $breakpoint-sm) {
    width: 100%;
    order: -1;
    margin-bottom: 30px;
  }
}

@media (max-width: $breakpoint-xs) {
  .canvas-wrapper {
    width: calc(100vw - 20px);
    overflow: hidden;
  }
}
</style>
