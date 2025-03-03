<template>
  <div class="row items-start mode-selector">
    <div v-if="selectedModelColor" class="selectors-wrapper">
      <div
        v-for="side in selectedModelColor.sides"
        :key="side.id"
        @click="setMode(side.id)"
        :class="{ active: mode == side.id }"
        class="selector-item">
        <p>{{side.name}}</p>
<!--        <img :src="side.url" alt="" />-->
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { mapMutations } from "vuex";

import CanvasService from "@/services/canvas";

export default {
  name: "ModeSelector",

  computed: {
    ...mapState("canvas", ["mode"]),
    ...mapState("product", ["selectedModelColor"]),
  },

  watch: {
    mode() {
      this.changeMode();
    },
  },

  methods: {
    ...mapMutations("canvas", ["setMode"]),

    changeMode() {
      CanvasService.changeMode();
    },
  },
};
</script>

<style lang="scss">
.mode-selector {
  z-index: 9;
  top: 0;

  @media (max-width: $breakpoint-sm) {
    position: absolute;
  }

  .selector-item {
    background: #fff;
    border: 2px solid $grey-4;
    border-radius: 5px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    width: 60px;
    height: 60px;
    @media (max-width: $breakpoint-sm) {
      float: left;
      margin-right: 10px;
    }

    &.active {
      border-color: $primary;
    }

    p {
      margin: 0;
      padding: 0;
      text-align: center;
      font-size: 16px;
      line-height: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      word-break: break-word;
      line-break: normal;
    }
  }
}
</style>
