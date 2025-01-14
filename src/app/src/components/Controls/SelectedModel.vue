<template>
  <q-card class="q-mx-2" v-if="selectedModel">
    <q-card-section>
      <div class="text-h6">{{ selectedModel.title }}</div>
    </q-card-section>

    <q-card-section>
      <p class="text-subtitle1">{{ $t("label.color") }}</p>
      <q-card-actions class="colors">
        <div
          v-for="image in selectedModel.images"
          :key="image[getMode()].url"
          @click="setSelectedModelColor(image)"
          class="cursor-pointer model-colors">
          <q-icon
            v-if="selectedModelColor.id == image.id"
            class="check-icon"
            name="check"
            size="20px"/>
          <div class="color" :style="{ 'background': image.hex }" :class="{ 'active': selectedModelColor.id == image.id }">
            <q-tooltip
                class="bg-blue-8 text-body2"
                anchor="top middle"
                self="bottom middle"
                :offset="[10, 10]"
            >
              {{ image.color_name }}
            </q-tooltip>
          </div>
        </div>
      </q-card-actions>

      <div class="row justify-center q-mt-md">
        <q-btn
          v-if="!loading"
          no-caps
          color="primary"
          @click="createOrder"
          :disabled="!canOrder()">
          <q-img
              :src="svgPath"
              alt="Custom Icon"
              style="width: 20px; height: 20px; margin-right: 8px;"/>
          <span>{{ifCanvasEditMode() ? 'Update' : 'Add to Card'}}</span>
        </q-btn>
        <LoadingItem v-if="loading"/>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { mapState } from "vuex";
import { mapActions } from "vuex";
import { mapGetters } from "vuex";
import { mapMutations } from "vuex";

import OrderService from "@/services/order";
import CanvasService, {Context} from "@/services/canvas";
import LoadingItem from "@/components/Layers/Loading";
import html2canvas from "html2canvas";

export default {
  name: "SelectedModel",
  components: {LoadingItem},
  data: () => ({
    orderModal: false,
    orderCreatedModal: false,
    loading: false,
    phone: "",
    email: "",
    svgPath: require('@/assets/cart.svg'),
  }),

  watch: {
    sizes: {
      handler() {
        this.calculatePrice();
      },
      deep: true,
    },
  },

  computed: {
    ...mapState("app", ["user", "pricing"]),
    ...mapState("order", ["price", "sizes"]),
    ...mapState("product", ["selectedModel", "selectedModelColor"]),
    ...mapState("canvas", ["mode", "layers"]),
    ...mapGetters("order", ["quantity"]),
  },

  methods: {
    ...mapMutations("product", ["setSelectedModelColor"]),
    ...mapMutations("app", []),
    ...mapMutations("canvas", [
      "resetSelectedLayer",
    ]),
    ...mapActions("order", ["calculatePrice"]),

    canOrder() {
      return this.layers.length > 0;
    },

    getMode() {
      return this.mode;
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
          active.set({
            borderColor: 'transparent',
            cornerColor: 'transparent',
          });

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

          if (active) {
            active.set({
              borderColor: '#3474d4',
              cornerColor: '#3474d4',
            });

            Context.canvas.renderAll();
          }
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
.colors {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 0 0 20px 0!important;
}

.model-colors {
  position: relative;

  .check-icon {
    font-size: 14px!important;
    position: absolute;
    z-index: 2;
    right: -7px;
    top: -7px;
    color: white;
    background: $primary;
    border-radius: 50%;
    padding: 3px;
  }

  .color {
    cursor: pointer;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    border: 2px solid #FFF;
    box-shadow: 0 0 0 1px #ccc;
    position: relative;

    &.active {
      box-shadow: 0 0 0 1px $primary;
    }
  }
}
</style>
