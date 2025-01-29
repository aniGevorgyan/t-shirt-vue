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
    <q-tab no-caps name="product" icon="invert_colors" :label="$t('label.product')" />
    <q-tab no-caps name="layers" icon="layers" :label="$t('label.layers')" />
    <q-tab no-caps name="object" icon="tune" :label="$t('label.object')" />
    <q-tab class="no-padding-tab" clickable="false">
      <q-btn
          no-caps
          color="primary"
          @click.stop.prevent="createOrder"
          :disabled="!canOrder() || loading">
        <q-img
            :src="svgPath"
            alt="Custom Icon"
            style="width: 20px; height: 20px; margin-right: 8px;"/>
        <span>{{ifCanvasEditMode() ? 'Update' : 'Add to Card'}}</span>
      </q-btn>
    </q-tab>
  </q-tabs>

  <q-tab-panels v-model="tab" animated>
    <q-tab-panel name="layers" class="q-px-none">
      <LayersList />
    </q-tab-panel>
    <q-tab-panel name="product" class="q-px-none">
      <SelectedModel />
    </q-tab-panel>
    <q-tab-panel name="object" class="q-px-none">
      <ObjectDetails />
    </q-tab-panel>
  </q-tab-panels>
</template>

<script>
import { mapState } from "vuex";
import { mapMutations } from "vuex";

import SelectedModel from "@/components/Controls/SelectedModel";
import ObjectDetails from "@/components/Controls/Details";
import LayersList from "@/components/Layers/List.vue";
import CanvasService, {Context} from "@/services/canvas";
import html2canvas from "html2canvas";
import OrderService from "@/services/order";

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
    ]),
    canOrder() {
      return this.layers.length > 0;
    },

    ifCanvasEditMode() {
      return Context.canvasMode === 'edit';
    },

    async createOrder() {
      this.loading = true;
      const url = new URL(window.location.href);
      const product_id = url.searchParams.get('product_id');
      const project_id = url.searchParams.get('project_id');
      this.resetSelectedLayer();

      try {
        let active = Context.canvas.getActiveObject();

        if (active) {
          Context.canvas.discardActiveObject();
          Context.canvas.renderAll();
        }

        const element = document.getElementById("canvas-custom");
        const canvas = await html2canvas(element, {useCORS: true});
        const screenShot = canvas.toDataURL("image/png");

        // const downloadLink = document.createElement('a');
        // downloadLink.href = screenShot;  // Set the href to the screenshot data URL
        // downloadLink.download = `order_screenshot_${Date.now()}.png`;  // Set the filename
        // downloadLink.click();

        // Wait for the order to be created
        const order = await OrderService.create({
          title: "Order №" + Date.now(),
          screenShot: screenShot,
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
          this.loading = false;
          this.orderCreatedModal = true;
        }
      } catch (error) {
        this.loading = false;
        console.error("Error capturing screenshot or creating order:", error);
      }
    }

  },
};
</script>

<style lang="scss">
.no-padding-tab {
  padding: 0!important;
}
</style>
