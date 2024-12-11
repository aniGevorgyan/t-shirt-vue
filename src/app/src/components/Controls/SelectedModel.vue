<template>
  <q-card class="q-mx-2" v-if="selectedModel">
    <q-card-section>
      <div class="text-h6">{{ selectedModel.title }}</div>
    </q-card-section>

    <q-card-section>
      <p class="text-subtitle1">{{ $t("label.color") }}</p>
      <q-card-actions>
        <div
          v-for="image in selectedModel.images"
          :key="image.front.url"
          @click="setSelectedModelColor(image)"
          class="cursor-pointer model-colors"
          :class="{ 'selected-model': selectedModelColor.id == image.id }"
        >
          <q-icon
            v-if="selectedModelColor.id == image.id"
            class="check-icon"
            name="check"
            size="34px"
          />
          <img :src="image.front.url" />
        </div>
      </q-card-actions>

<!--      <q-item tag="label">-->
<!--        <q-item-section>-->
<!--          <q-item-label>{{ $t("label.price") }}</q-item-label>-->
<!--        </q-item-section>-->
<!--        <q-item-section side>-->
<!--          <span class="text-bold"-->
<!--            >{{ price }} {{ !isNaN(Number(price)) ? "₽" : "" }}</span-->
<!--          >-->
<!--        </q-item-section>-->
<!--      </q-item>-->

<!--      <template v-if="!selectedModel.clientModel">-->
<!--        <q-list separator dense class="q-pa-md">-->
<!--          <q-item class="text-bold no-padding">-->
<!--            <q-item-section>-->
<!--              {{ $t("label.size") }}-->
<!--            </q-item-section>-->
<!--            <q-item-section class="q-mr-md text-right">-->
<!--              {{ $t("label.quantity") }}-->
<!--            </q-item-section>-->
<!--          </q-item>-->
<!--          <template v-for="size in selectedModel.sizes" :key="size">-->
<!--            <q-item class="no-padding">-->
<!--              <q-item-section v-text="size"></q-item-section>-->
<!--              <q-item-section avatar>-->
<!--                <q-input-->
<!--                  v-model="sizes[size]"-->
<!--                  type="number"-->
<!--                  input-class="text-right"-->
<!--                  min="0"-->
<!--                  borderless-->
<!--                  dense-->
<!--                />-->
<!--              </q-item-section>-->
<!--            </q-item>-->
<!--          </template>-->
<!--          <q-item class="text-bold no-padding">-->
<!--            <q-item-section>-->
<!--              {{ $t("label.total") }}-->
<!--            </q-item-section>-->
<!--            <q-item-section class="q-mr-md text-right">-->
<!--              {{ quantity }}-->
<!--            </q-item-section>-->
<!--          </q-item>-->
<!--        </q-list>-->
<!--      </template>-->

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
.model-colors {
  position: relative;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  overflow: hidden;
  margin-right: 5px;
  margin-bottom: 5px;
  border: 1px solid #ccc;

  img {
    width: 110%;
    height: 110%;
    object-fit: none;
  }

  &.selected-model {
    i {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $primary;
      background: #ffffff82;
    }
  }
}
</style>
