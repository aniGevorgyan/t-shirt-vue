<template>
  <q-card class="q-mx-2" v-if="selectedModel">
    <q-card-section>
      <div class="text-h6">{{ selectedModel.title }}</div>
    </q-card-section>

    <q-card-section>
      <p class="text-subtitle1">Available in {{selectedModel.images.length}} colors</p>
      <q-card-actions class="colors">
        <div
          v-for="image in selectedModel.images"
          :key="image[getMode()]?.url"
          @click="setSelectedModelColor(image)"
          class="cursor-pointer model-colors">
          <q-icon
            v-if="selectedModelColor.id == image.id"
            class="check-icon"
            name="check"
            size="20px"/>
          <div class="color"
               v-bind:style="{ backgroundImage: image.img ? `url('${image.img}')` : null, backgroundColor: image.hex }"
               :class="{ 'active': selectedModelColor.id == image.id }">
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
    </q-card-section>
  </q-card>
</template>

<script>
import { mapState } from "vuex";
import { mapActions } from "vuex";
import { mapGetters } from "vuex";
import { mapMutations } from "vuex";

export default {
  name: "SelectedModel",
  data: () => ({
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

    getMode() {
      return this.mode;
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
    width: 35px;
    height: 35px;
    border-radius: 50%;
    border: 2px solid #FFF;
    box-shadow: 0 0 0 1px #ccc;
    background-position: center;
    position: relative;

    &.active {
      box-shadow: 0 0 0 1px $primary;
    }
  }
}
</style>
