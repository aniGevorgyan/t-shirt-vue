<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page>
        <div class="row main-content" ref="mainBlock">
          <div class="canvas-column">
            <div class="canvas-designer">
              <ModeSelector/>
              <div class="flex flex-center sm-overflow-scroll" id="canvas-custom">
                <div class="canvas-wrapper"
                     v-bind:style="{ backgroundImage: selectedModelColorUrl ? `url('${selectedModelColorUrl}')` : null }">
                  <div id="canvas-block" class="canvas-block" :style="
                       {
                         height: selectedModelCoordinated?.height * ratio + 'px',
                         width: selectedModelCoordinated?.width * ratio + 'px',
                         top: (ifSideMode() ? null : selectedModelCoordinated?.top + 'px'),
                         bottom: (ifSideMode() ? 0 : null),
                         left: (ifSideMode() ? 0 : selectedModelCoordinated?.left) + 'px',
                         backgroundColor: ifSideMode() ? selectedModelColor?.hex : null,
                       }">
                    <canvas ref="canvas"></canvas>
<!--                        :style="selectedLayer.layerId && !ifSideMode() ? {border: '1px solid #e0e0e066'} : {}"-->
                  </div>
                  <div class="canvas-block-2" :class="{ lrSide: ifSideMode() }" :style="
                       {
                         visibility: ifSideMode() ? 'visible' : 'hidden',
                         height: selectedModelCoordinated?.height*ratio + 'px',
                         width: selectedModelCoordinated?.width*ratio + 'px',
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

import CanvasService from "@/services/canvas";
import ProductService from "@/services/product";

import WebFont from "webfontloader";
import WebFontConfig from "@/WebFontConfig";

import ModeSelector from "@/components/Controls/ModeSelector";
import ControlsPanel from "@/components/Controls/Panel";

import InitModal from "@/components/Modals/Init";

export default {
  name: "LayoutDefault",

  inject: ["ctx"],

  components: {
    ControlsPanel,
    ModeSelector,
    InitModal,
  },

  data() {
    return {
      resizeObserver: null,
      ratio: 1,
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
      contextOptions: {willReadFrequently: true}
    });

    this.ctx.canvas2 = new fabric.Canvas(ref2, {
      contextOptions: {willReadFrequently: true}
    });

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

    this.ctx.canvas.on("object:moving", (event) => {
      let obj = event.target;
      // if object is too big ignore
      if (obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width) {
        return;
      }
      obj.setCoords();
      // top-left  corner
      if (obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0) {
        obj.top = Math.max(obj.top, obj.top - obj.getBoundingRect().top);
        obj.left = Math.max(obj.left, obj.left - obj.getBoundingRect().left);
      }
      // bot-right corner
      if (obj.getBoundingRect().top + obj.getBoundingRect().height > obj.canvas.height || obj.getBoundingRect().left + obj.getBoundingRect().width > obj.canvas.width) {
        obj.top = Math.min(obj.top, obj.canvas.height - obj.getBoundingRect().height + obj.top - obj.getBoundingRect().top);
        obj.left = Math.min(obj.left, obj.canvas.width - obj.getBoundingRect().width + obj.left - obj.getBoundingRect().left);
      }
    });

    this.ctx.canvas.on("object:scaling", (event) => {
      let obj = event.target;

      obj.setCoords();
      let brNew = obj.getBoundingRect();

      if (((brNew.width + brNew.left) >= obj.canvas.width) || ((brNew.height + brNew.top) >= obj.canvas.height) || ((brNew.left < 0) || (brNew.top < 0))) {
        obj.left = this.left1;
        obj.top = this.top1;
        obj.scaleX = this.scale1x;
        obj.scaleY = this.scale1y;
        obj.width = this.width1;
        obj.height = this.height1;
      } else {
        this.left1 = obj.left;
        this.top1 = obj.top;
        this.scale1x = obj.scaleX;
        this.scale1y = obj.scaleY;
        this.width1 = obj.width;
        this.height1 = obj.height;
      }
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

    // this.ctx.canvas.on("mouse:dblclick", ({target}) => {
    //   if (target && target.type === 'image') {
    //     CanvasService.prepareCrop(target)
    //   }
    // })

    // document.addEventListener("keydown", (e) => {
    //   if (
    //       ["Delete", "Backspace"].includes(e.key) &&
    //       this.selectedLayer.layerId
    //   ) {
    //     if (document.querySelector(".layer-text-field")?.matches(":focus"))
    //       return;
    //     CanvasService.removeLayer(this.selectedLayer);
    //   }
    // });

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
      this.ratio = this.ifSideMode() ? 4 : 1;
      this.ctx.canvas.setHeight(this.selectedModelCoordinated.height * this.ratio);
      this.ctx.canvas.setWidth(this.selectedModelCoordinated.width * this.ratio);
      this.ctx.canvas.renderAll();

      this.ctx.canvas2.setHeight(this.selectedModelCoordinated.height * this.ratio);
      this.ctx.canvas2.setWidth(this.selectedModelCoordinated.width * this.ratio);
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
      window.parent.postMessage({action: 'resize', iframeHeight: height}, '*')
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

.main-content {
  overflow: hidden;
  justify-content: center;
}

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
        transform-origin: top left;
        transform: scale(0.25, 0.25);
      }
    }
  }

  @media (min-width: $breakpoint-sm) {
    margin: 50px 10px 0 10px;
  }
  @media (max-width: $breakpoint-sm) {
    padding-top: 50px;
    justify-content: center;
  }
}

.control-panel {
  width: calc(100% - 700px);
  max-width: 500px;
  min-height: 725px;

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
