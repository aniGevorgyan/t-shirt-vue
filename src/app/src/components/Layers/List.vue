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
        @click="dialog=true"
        color="primary">
      <q-img
          :src="imagesSvgPath"
          alt="Custom Icon"
          style="width: 35px; height: 35px; margin-right: 10px;"/>
      <p class="layers-tab-text">Add <br/> Images</p>
    </q-btn>
  </div>

  <q-list separator>
    <template v-for="layer in layers" :key="layer.layerId">
      <LayerItem :layer="layer" v-if="layer.mode == mode"/>
    </template>
    <LoadingItem v-if="loadingLayer"/>
    <q-separator v-show="layers.length"/>
  </q-list>

  <q-dialog v-model="dialog" @hide="resetData">
    <q-card v-if="!imgUrl" style="width: 600px; max-width: 90vw;" class="q-pa-lg">
      <q-card-section>
        <div class="text-h6 text-bold">Choose a File to Upload</div>
      </q-card-section>

      <q-card-section class="row items-center q-gutter-sm no-wrap" style="max-width: 100%; overflow: hidden;">
        <q-file
            ref="fileInput"
            v-model="file"
            label="No file chosen"
            filled
            dense
            class="col-grow"
            @input="uploadImage"
            style="min-width: 0; max-width: 70%; overflow: hidden; text-overflow: ellipsis;"
        />
        <q-btn
            label="CHOOSE YOUR FILE"
            color="green"
            style="height: 40px; white-space: nowrap; flex-shrink: 0;"
            :disabled="loadingLayer"
            @click="triggerFileInput">
        </q-btn>
      </q-card-section>

      <q-card-section>
        <p class="text-subtitle2">Accepted File Formats:</p>
        <div class="formats text-subtitle1 text-bold">
          <span>AI</span>
          <span>EPS</span>
          <span>SVG</span>
          <span>CDR</span>
          <span>PDF</span>
          <span>PSD</span>
          <span>PNG</span>
          <span>JPG</span>
          <span>JPEG</span>
          <span>TIF</span>
          <span>BMP</span>
          <span>GIF</span>
        </div>
      </q-card-section>

      <q-separator/>

      <q-card-section class="row items-center">
        <q-icon name="phone"/>
        <div>Need help? Call us at <strong>+1 (888) 886-6860</strong> - 24 Hours Mon-Fri Sat-Sun 8am-5pm PT</div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup/>
      </q-card-actions>
    </q-card>

    <q-card v-if="imgUrl" style="width: 600px; max-width: 90vw;" class="q-pa-lg">
      <q-card-section>
        <div class="text-h6 text-bold">Remove Background (Optional)</div>
      </q-card-section>

<!--      <q-card-section class="q-pt-none">-->
<!--        <q-banner dense class="text-red q-pa-none">-->
<!--          <q-icon name="warning"/>-->
<!--          Image resolution may be too low.-->
<!--        </q-banner>-->
<!--      </q-card-section>-->

      <q-card-section class="row items-center img-container">
        <div class="col-auto">
          <q-img :src="imgUrl" style="width: 150px; height: 150px;" fit="contain"/>
        </div>
        <div class="col q-ml-md">
          <p class="text-body2 q-mb-sm">
            Remove a background from your image. To see how your upload looks with and without the background, use the
            toggle switch below.
          </p>
          <q-toggle class="q-mb-sm" v-model="switchValue">
            Remove background ({{switchValue ? 'On' : 'Off'}})
          </q-toggle>

          <q-btn color="green" label="PLACE IMAGE ON PRODUCT" class="full-width" @click="confirmAction(true)"/>
        </div>
      </q-card-section>

      <q-card-section class="text-center">
        <div>Need help? Call us at <strong>+1 (888) 886-6860</strong> - 24 Hours Mon-Fri Sat-Sun 8am-5pm PT</div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>


<script>
import {mapState} from "vuex";
import {mapMutations} from "vuex";

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
    imgUrl: null,
    switchValue: false,
    file: null,
    textSvgPath: require('@/assets/text.svg'),
    imagesSvgPath: require('@/assets/images.svg'),
  }),

  computed: {
    ...mapState("canvas", ["layers", "mode"]),
  },

  methods: {
    ...mapMutations("app", ["pushUploadedImage"]),

    triggerFileInput() {
      this.$refs.fileInput.$el.querySelector('input').click();
    },

    addTextLayer() {
      CanvasService.addTextLayer();
    },

    resetData() {
      this.imgUrl = null;
      this.switchValue = null;
      this.file = null
    },

    addImageLayer(url) {
      CanvasService.addImageLayer(url);
    },

    async confirmAction(overRide) {
      if (overRide) {
        if (!this.switchValue) {
          this.addImageLayer(this.imgUrl);
          this.dialog = false;
          return;
        }
      }

      this.loadingLayer = true;

      const url = new URL(window.location.href);
      const project_id = url.searchParams.get('project_id');
      const remove_background = this.switchValue;
      let image = overRide ? await MediaService.update(this.imgUrl, project_id, remove_background) : await MediaService.upload(this.file, project_id, remove_background);
      if (image) {
        this.imgUrl = image.url;
        if (overRide) {
          this.addImageLayer(image.url);
          this.dialog = false;
        }
        this.loadingLayer = false;
      }
    },

    uploadImage(e) {
      this.file = e.target.files[0];

      if (!this.file) {
        return;
      }

      this.confirmAction(false);
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

.formats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  width: 300px;
}

.img-container {
  @media (max-width: $breakpoint-xs) {
    flex-direction: column;
  }
}
</style>
