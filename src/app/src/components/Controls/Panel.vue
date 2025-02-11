<template>
  <q-tabs
      v-model="tab"
      inline-label
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="justify"
  >
    <q-tab no-caps name="product" icon="invert_colors" :label="$t('label.product')"/>
    <q-tab no-caps name="layers" icon="layers" :label="$t('label.layers')"/>
    <q-tab no-caps name="object" icon="tune" :label="$t('label.object')"/>
    <q-tab class="no-padding-tab" clickable="false">
      <q-btn
          no-caps
          color="primary"
          @click.stop.prevent="createOrder"
          :disabled="!canOrder()">
        <q-img
            :src="svgPath"
            alt="Custom Icon"
            style="width: 20px; height: 20px; margin-right: 8px;"/>
        <span>{{ ifCanvasEditMode() ? 'Update' : 'Add to Card' }}</span>
      </q-btn>
    </q-tab>
  </q-tabs>

  <q-tab-panels v-model="tab" animated>
    <q-tab-panel name="layers" class="q-px-none">
      <LayersList/>
    </q-tab-panel>
    <q-tab-panel name="product" class="q-px-none">
      <SelectedModel/>
    </q-tab-panel>
    <q-tab-panel name="object" class="q-px-none">
      <ObjectDetails/>
    </q-tab-panel>
  </q-tab-panels>
  <div v-if="loading" id="ec-overlay"><span class="loader_img"></span></div>
</template>

<script>
import {mapState} from "vuex";
import {mapMutations} from "vuex";

import SelectedModel from "@/components/Controls/SelectedModel";
import ObjectDetails from "@/components/Controls/Details";
import LayersList from "@/components/Layers/List.vue";
import CanvasService, {Context} from "@/services/canvas";
import html2canvas from "html2canvas";
import {jsPDF} from "jspdf";
import OrderService from "@/services/order";
import MediaService from "@/services/media";

export default {
  name: "ControlsPanel",
  data: () => ({
    orderModal: false,
    orderCreatedModal: false,
    loading: false,
    svgPath: require('@/assets/cart.svg'),
  }),

  components: {
    LayersList,
    SelectedModel,
    ObjectDetails,
  },

  computed: {
    ...mapState("app", ["controlTab"]),
    ...mapState("canvas", ["mode", "layers"]),
    ...mapState("product", ["selectedModelColor"]),

    tab: {
      get() {
        return this.controlTab;
      },
      set(value) {
        this.setControlTab(value);
      },
    },
  },

  methods: {
    ...mapMutations("app", ["setControlTab"]),
    ...mapMutations("canvas", [
      "resetSelectedLayer",
      "setMode",
    ]),
    canOrder() {
      return this.layers.length > 0;
    },

    ifCanvasEditMode() {
      return Context.canvasMode === 'edit';
    },

    async createOrder() {
      this.loading = true;
      const sides = Object.keys(this.selectedModelColor).filter(key =>
          ['front', 'back', 'left_side', 'right_side'].includes(key)
      );
      const canvasFiles = [];
      const url = new URL(window.location.href);
      const product_id = url.searchParams.get('product_id');
      const project_id = url.searchParams.get('project_id');

      try {
        let active = Context.canvas.getActiveObject();

        if (active) {
          Context.canvas.discardActiveObject();
          Context.canvas.renderAll();
        }

        let index = 0;
        for (const side of sides) {
          // Switch to the current side
          this.setMode(side);
          await this.$nextTick();
          await new Promise(resolve => setTimeout(resolve, 500));

          // Capture the screenshot
          const element = document.getElementById("canvas-custom");
          const canvas = await html2canvas(element, {useCORS: true});
          const screenshot = canvas.toDataURL("image/png");
          const id = this.selectedModelColor[side]?.id;

          canvasFiles.push({id, side, screenshot});
          index++;
        }

        if (index === sides.length) {
          await this.generatePDFS(project_id);
          // Wait for the order to be created
          const order = await OrderService.create({
            title: "Order №" + Date.now(),
            files: canvasFiles,
            productId: product_id,
            projectId: project_id,
            json: JSON.stringify({
              model: this.selectedModelColor,
              canvasData: CanvasService.toJSON(),
            }),
          });

          if (order) {
            window.parent.postMessage({action: 'redirect', data: order}, '*');
            this.orderModal = false;
            // this.loading = false;
            this.orderCreatedModal = true;
          }
        }
      } catch (error) {
        // this.loading = false;
        console.error("Error capturing screenshot or creating order:", error);
      }
    },

    async generatePDFS(project_id) {
      const sides = Object.keys(this.selectedModelColor).filter(key =>
          ['front', 'back', 'left_side', 'right_side'].includes(key)
      );
      const scaleFactor = 5;
      const elementCanvas = document.getElementById("canvas-block");
      for (const side of sides) {
        this.setMode(side);
        await this.$nextTick();
        await new Promise(resolve => setTimeout(resolve, 500));

        elementCanvas.style.backgroundColor = "transparent";
        elementCanvas.style.height = Context.canvas.height * scaleFactor + "px";
        elementCanvas.style.width = Context.canvas.width * scaleFactor + "px";
        Context.canvas.setHeight(Context.canvas.height * scaleFactor);
        Context.canvas.setWidth(Context.canvas.width * scaleFactor);
        Context.canvas.setZoom(scaleFactor);
        Context.canvas.renderAll();
        const canvasBlock = await html2canvas(elementCanvas, {useCORS: true});
        const dataURL = canvasBlock.toDataURL({
          format: 'png',
          multiplier: scaleFactor
        });

        const img = new Image();
        img.src = dataURL;
        img.onload = function () {
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvasBlock.width * scaleFactor, canvasBlock.height * scaleFactor]
          });

          pdf.addImage(img, 'PNG', 0, 0, canvasBlock.width * scaleFactor, canvasBlock.height * scaleFactor);
          const pdfBlob = pdf.output('blob');
          MediaService.uploadBlob(pdfBlob, side, project_id);
        }
      }
    }

  },
};
</script>

<style lang="scss">
#ec-overlay {
  display: block;
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: #fff;
  z-index: 999999999999
}

#ec-overlay .loader_img {
  display: block;
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 999999999999;
  background: #fff url('../../assets/loader.gif') no-repeat scroll 50% 50%;
  pointer-events: none;
  overflow: hidden;
  background-size: 65px
}

.no-padding-tab {
  padding: 0 !important;
}
</style>
