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
      const sides = this.selectedModelColor.sides.map(el => el.id);
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

        // Capture screenshots first
        for (const side of sides) {
          await this.captureScreenshot(side, canvasFiles);
        }

        // Generate PDFs after screenshots are done
        for (const side of sides) {
          await this.generatePDF(side, project_id, canvasFiles);
        }

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
          window.parent.postMessage({ action: 'redirect', data: order }, '*');
        }
      } catch (error) {
        console.error("Error capturing screenshot or creating order:", error);
      }
    },

    async captureScreenshot(side, canvasFiles) {
      this.setMode(side);
      await this.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = document.getElementById("canvas-custom");
      const canvas = await html2canvas(element, { useCORS: true });
      const screenshot = canvas.toDataURL("image/png");

      canvasFiles.push({ id: this.selectedModelColor[side]?.id, side, screenshot });
    },

    async generatePDF(side, project_id, canvasFiles) {
      const scaleFactor = 5;
      this.setMode(side);
      await this.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 500));

      const elementCanvas = document.getElementById("canvas-block");
      elementCanvas.style.backgroundColor = "transparent"; // Ensure transparent background
      elementCanvas.style.height = Context.canvas.height * scaleFactor + "px";
      elementCanvas.style.width = Context.canvas.width * scaleFactor + "px";

      // Set Fabric.js canvas to be transparent
      Context.canvas.setBackgroundColor(null, Context.canvas.renderAll.bind(Context.canvas));
      Context.canvas.setHeight(Context.canvas.height * scaleFactor);
      Context.canvas.setWidth(Context.canvas.width * scaleFactor);
      Context.canvas.setZoom(scaleFactor);
      Context.canvas.renderAll();

      // Capture with transparent background
      const canvasBlock = await html2canvas(elementCanvas, {
        useCORS: true,
        backgroundColor: null,  // 🚀 Key setting for transparency
      });

      const dataURL = canvasBlock.toDataURL("image/png", 1.0); // Ensure max quality and transparency

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = dataURL;
        img.onload = async function () {
          try {
            const pdf = new jsPDF({
              orientation: "landscape",
              unit: "px",
              format: [canvasBlock.width * scaleFactor, canvasBlock.height * scaleFactor],
            });

            pdf.addImage(img, "PNG", 0, 0, canvasBlock.width * scaleFactor, canvasBlock.height * scaleFactor);

            const pdfBlob = pdf.output("blob");

            const pdfFileUrl = await MediaService.uploadBlob(pdfBlob, side, project_id);

            // Update the correct entry in canvasFiles
            const fileEntry = canvasFiles.find(file => file.side === side);
            fileEntry.file = pdfFileUrl;

            resolve();
          } catch (error) {
            reject(error);
          }
        };
      });
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
