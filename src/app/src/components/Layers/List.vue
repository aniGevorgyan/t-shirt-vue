<template>
  <div class="q-pb-md q-px-2">
    <q-btn
      no-caps
      @click="addTextLayer"
      color="white"
      text-color="black"
      class="q-mr-sm">
      <q-img
          :src="textSvgPath"
          alt="Custom Icon"
          style="width: 40px; height: 40px; margin-right: 3px;"/>
      <p class="layers-tab-text">Add <br/> Text</p>
    </q-btn>
    <q-btn
      no-caps
      @click="this.$refs.fileInput.click()"
      color="primary">
      <q-img
          :src="imagesSvgPath"
          alt="Custom Icon"
          style="width: 35px; height: 35px; margin-right: 10px;"/>
      <p class="layers-tab-text">Add <br/> Images</p>
    </q-btn>
    <input
      ref="fileInput"
      type="file"
      @change="uploadImage"
      class="hidden"
    />
  </div>

  <q-list separator>
    <template v-for="layer in layers" :key="layer.layerId">
      <LayerItem :layer="layer" v-if="layer.mode == mode" />
    </template>
    <LoadingItem v-if="loadingLayer" />
    <q-separator v-show="layers.length" />
  </q-list>

  <q-dialog v-model="dialog" persistent>
    <q-card>
      <q-card-section>
        <q-toggle v-model="switchValue" label="Remove background" />
      </q-card-section>

      <q-card-actions class="justify-center">
        <q-btn no-caps outline label="Cancel" text-color="primary" @click="dialog = false" />
        <q-btn no-caps label="Confirm" color="primary" @click="confirmAction" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>


<script>
import { mapState } from "vuex";
import { mapMutations } from "vuex";

import CanvasService from "@/services/canvas";
import MediaService from "@/services/media";

import LayerItem from "@/components/Layers/Item";
import LoadingItem from "@/components/Layers/Loading";

export default {
  name: "LayersList",

  components: {
    LayerItem,
    LoadingItem,
  },

  data: () => ({
    tab: "layers",
    loadingLayer: false,
    dialog: false,
    switchValue: false,
    file: '',
    textSvgPath: require('@/assets/text.svg'),
    imagesSvgPath: require('@/assets/images.svg'),
  }),

  computed: {
    ...mapState("canvas", ["layers", "mode"]),
  },

  methods: {
    ...mapMutations("app", ["pushUploadedImage"]),

    addTextLayer() {
      CanvasService.addTextLayer();
    },

    addImageLayer(url) {
      CanvasService.addImageLayer(url);
    },

    async confirmAction() {
      this.loadingLayer = true;
      this.dialog = false;

      const url = new URL(window.location.href);
      const project_id = url.searchParams.get('project_id');
      const with_background = this.switchValue;
      let image = await MediaService.upload(this.file, project_id, with_background);
      if (image) {
        this.addImageLayer(image.url);
      // this.pushUploadedImage({
      //   id: Date.now(),
      //   url: image.url,
      // });
      }
      this.loadingLayer = false;
      this.switchValue = false;

    },

    uploadImage(e) {
      this.file = e.target.files[0];

      if (!this.file) {
        return;
      }

      this.dialog = true;
    },
  },
};
</script>

<style lang="scss">
.scroll-area {
  @media (max-width: $breakpoint-xs) {
    min-height: 100px;
  }
}

.layers-tab-text {
  margin: 5px 0;
  display: flex;
  line-height: 18px;
  text-align: initial;
}
</style>
