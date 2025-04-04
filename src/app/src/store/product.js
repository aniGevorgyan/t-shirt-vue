export default {
  namespaced: true,

  state() {
    return {
      models: [],
      selectedModel: null,
      selectedModelColor: null,
    };
  },

  mutations: {
    setModels(state, payload) {
      state.models = payload;
      if (!state.selectedModel) {
        state.selectedModel = payload[0];
        state.selectedModelColor = state.selectedModel.images[0];
      }
    },
    pushModel(state, payload) {
      state.models.push(payload);
    },
    deleteModel(state, { id }) {
      state.models = state.models.filter((m) => m.id != id);
      if (state.selectedModel.id == id) {
        this.commit("product/setModels", state.models);
      }
    },
    setSelectedModel(state, payload) {
      state.selectedModel = payload;
      state.selectedModelColor = state.selectedModel.images[0];
      this.dispatch("order/calculatePrice");
    },
    setSelectedModelColor(state, payload) {
      state.selectedModelColor = payload;
    },
    selectFirstModel(state) {
      this.commit("product/setSelectedModel", state.models[0]);
    },
  },

  getters: {
    selectedModelColorUrl(state, getters, rootState) {
      let side = state.selectedModelColor?.sides.find(el => el.id == rootState.canvas.mode);
      return side
        ? side.url
        : null;
    },

    selectedModelCoordinated(state, getters, rootState) {
      const DPI = 96;
      let side = state.selectedModelColor?.sides.find(el => el.id == rootState.canvas.mode);
      return side
          ?
          {
            top: side.top * DPI,
            left: side.left * DPI,
            height: side.height * DPI,
            width: side.width * DPI,
          }
          : null;
    },
  },
};
