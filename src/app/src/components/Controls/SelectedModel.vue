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
          :key="image.front.url"
          @click="setSelectedModelColor(image)"
          class="cursor-pointer model-colors">
          <q-icon
            v-if="selectedModelColor.id == image.id"
            class="check-icon"
            name="check"
            size="20px"/>
          <div class="color" :style="{ 'background': image.hex }" :class="{ 'active': selectedModelColor.id == image.id }"></div>
        </div>
      </q-card-actions>

      <div class="row justify-center q-mt-md">
        <q-btn
          v-if="!loading"
          no-caps
          color="primary"
          icon="shopping_basket"
          :label="$t('label.order')"
          @click="createOrder"
          :disabled="!canOrder()"
        />
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
import CanvasService from "@/services/canvas";
import LoadingItem from "@/components/Layers/Loading";

export default {
  name: "SelectedModel",
  components: {LoadingItem},
  data: () => ({
    orderModal: false,
    orderCreatedModal: false,
    loading: false,
    phone: "",
    email: "",
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
    ...mapState("canvas", ["layers"]),
    ...mapGetters("order", ["quantity"]),
  },

  methods: {
    ...mapMutations("product", ["setSelectedModelColor"]),
    ...mapMutations("app", [
    ]),
    ...mapActions("order", ["calculatePrice"]),

    canOrder() {
      return this.layers.length > 0;
    },

    quantityHtml() {
      let html = "";
      for (let size in this.sizes) {
        if (this.sizes[size] == 0) continue;
        html += `<b>${size.toUpperCase()}:</b> ${this.sizes[size]}<br/>`;
      }
      return html;
    },

    async createOrder() {
      this.loading = true;
      const url = new URL(window.location.href);
      const product_id = url.searchParams.get('product_id');
      const project_id = url.searchParams.get('project_id');
      let order = await OrderService.create({
        title: "Order №" + Date.now(),
        productId: product_id,
        projectId: project_id,
        json: JSON.stringify({
          model: this.selectedModelColor,
          canvasData: CanvasService.toJSON(),
        }),
      });

      if (order) {
        this.orderModal = false;
        this.orderCreatedModal = true;
      }

      this.loading = false;
      console.log("post data", order);
    },
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
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 3px solid #FFF;
    box-shadow: 0 0 0 1px #ccc;
    position: relative;

    &.active {
      box-shadow: 0 0 0 1px $primary;
    }
  }
}
</style>
