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
          no-caps
          color="primary"
          icon="shopping_basket"
          :label="$t('label.order')"
          @click="orderModal = true"
          :disabled="!canOrder()"
        />
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

export default {
  name: "SelectedModel",

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
      return (
        (!this.selectedModel.clientModel && this.quantity > 0) ||
        (this.selectedModel.clientModel && this.layers.length > 0)
      );
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
      if (!this.isValidPhone(this.phone)) {
        this.$refs.phoneInput.validate();
        return;
      }

      if (!this.validateEmail(this.email)) {
        this.$refs.emailInput.validate();
        return;
      }

      this.loading = true;

      let captures = await CanvasService.capture();

      let order = await OrderService.create({
        title: "Order №" + Date.now(),
        clientModel: this.selectedModel.clientModel,
        phone: this.phone,
        email: this.email,
        price: this.price,
        quantity: this.quantityHtml(),
        front: captures.front.id,
        back: captures.back ? captures.back.id : null,
        json: JSON.stringify({
          sizes: this.sizes,
          model: this.selectedModelColor,
          canvasData: CanvasService.toJSON(),
        }),
      });

      if (order) {
        this.orderModal = false;
        this.orderCreatedModal = true;
        this.phone = "";
        this.email = "";
      }
      this.loading = false;
    },
  },
};
</script>

<style lang="scss">
.text-subtitle1 {
  margin: 0 0 5px;
}

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
