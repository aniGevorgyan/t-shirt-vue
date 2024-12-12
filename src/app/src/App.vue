<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page padding>
        <div class="row">
          <div class="col-md-3 col-sm-12 sm-full-width">
            <LayersPanel />
          </div>
          <div class="col-md-6 col-sm-12 canvas-column">
            <div class="canvas-designer">
              <ModeSelector />
              <div class="flex flex-center">
                <div class="canvas-wrapper" v-bind:style="{ backgroundImage: selectedModelColorUrl ? `url('${selectedModelColorUrl}')` : null }">
                  <div class="canvas-block" :style="
                       {
                         height: selectedModelCoordinated?.height + 'px',
                         width: selectedModelCoordinated?.width + 'px',
                         top: selectedModelCoordinated?.top + 'px',
                         left: selectedModelCoordinated?.left + 'px',
                       }">
                    <canvas :style="{border: '1px solid #e0e0e066', borderRadius: '5px'}" ref="canvas"></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-12 order-sm-last sm-full-width">
            <ControlsPanel />
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>

  <InitModal />
</template>

<script>
import { mapState } from "vuex";
import { mapGetters } from "vuex";
import { mapMutations } from "vuex";
import { fabric } from "fabric";
import { syncLanguage } from "./locales";

import UserService from "@/services/user";
import OrderService from "@/services/order";
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

  mounted() {
    const url = new URL(window.location.href);
    const product_id = url.searchParams.get('product_id');
    const project_id = url.searchParams.get('project_id');
    this.loadProductModels(product_id, project_id);

    const ref = this.$refs.canvas;
    this.ctx.canvas = new fabric.Canvas(ref, {
      selection: false,
      allowTouchScrolling: true,
    });

    this.ctx.canvas.on("before:selection:cleared", () => {
      this.resetSelectedLayer();
      this.setControlTab("product");
    });

    this.ctx.canvas.on("selection:created", (event) => {
      this.handleSelection(event);
    });

    this.ctx.canvas.on("selection:updated", (event) => {
      this.handleSelection(event);
    });

    this.ctx.canvas.on("object:modified", (event) => {
      if (event.action === "scale" || event.action === "rotate") {
        this.selectedLayer.dirty = true;
      }
    });

    this.ctx.canvas.on({
      "object:added": () => this.syncLayers(this.ctx.canvas.getObjects()),
      "object:removed": () => this.syncLayers(this.ctx.canvas.getObjects()),
    });

    this.ctx.canvas.on("mouse:dblclick", ({ target}) => {
      if(target && target.type === 'image'){
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

    WebFont.load(WebFontConfig);
  },

  computed: {
    ...mapState("app", ["user"]),
    ...mapState("canvas", ["selectedLayer"]),
    ...mapState("product", ["selectedModelColor"]),
    ...mapGetters("product", ["selectedModelColorUrl"]),
    ...mapGetters("product", ["selectedModelCoordinated"]),
  },

  watch: {
    user(newUser) {
      this.loadProductModels(newUser?.id);
    },
    selectedModelColorUrl(url) {
      this.ctx.canvas.setHeight(this.selectedModelCoordinated.height);
      this.ctx.canvas.setWidth(this.selectedModelCoordinated.width);
      this.ctx.canvas.renderAll();
      // if (url) CanvasService.drawSelectedModel();
    },
  },

  methods: {
    ...mapMutations("app", [
      "setUser",
      "setControlTab",
    ]),
    ...mapMutations("order", ["setPricing"]),
    ...mapMutations("canvas", [
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

    async loadPricing() {
      let prices = await OrderService.getPrices();
      if (prices) {
        this.setPricing(prices);
      }
    },

    async loadProductModels(product_id, project_id) {
      let models = await ProductService.getModel(product_id, project_id);
      this.setModels(models);
    },

    async logout() {
      await UserService.logout();
      window.location.reload();
    },

    setLanguage(lang) {
      this.$i18n.locale = lang;
      syncLanguage(lang);
    },
  },
};
</script>

<style lang="scss">
.canvas-designer {
  box-shadow: 0 0 5px #d9d9d9;
  position: sticky;
  top: 55px;

  .canvas-wrapper {
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center center;
    width: 600px;
    height: 500px;
    margin: 20px 0;

    .canvas-block {
      position: relative;
    }
  }

  @media (min-width: $breakpoint-sm) {
    margin: 0 10px;
  }
  @media (max-width: $breakpoint-sm) {
    padding-top: 50px;
  }
}

.canvas-column {
  width: 100%;
  @media (max-width: $breakpoint-sm) {
    order: -1;
    margin-bottom: 30px;
  }
}

@media (max-width: $breakpoint-xs) {
  .canvas-wrapper {
    width: calc(100vw - 20px);
    overflow: hidden;
  }
  .canvas-container {
    position: relative;
    left: 50%;
    margin-left: -100%;
    margin-top: calc(25% * -0.7);
    margin-bottom: calc(30% * -0.7);
    transform: scale(0.7);
  }
}
</style>
