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
      return state.selectedModelColor
        ? state.selectedModelColor[rootState.canvas.mode].url
        : null;
    },

    selectedModelCoordinated(state, getters, rootState) {
      const DPI = 96;
      return state.selectedModelColor
          ?
          {
            top: state.selectedModelColor[rootState.canvas.mode].top * DPI,
            left: state.selectedModelColor[rootState.canvas.mode].left * DPI,
            height: state.selectedModelColor[rootState.canvas.mode].height * DPI,
            width: state.selectedModelColor[rootState.canvas.mode].width * DPI,
          }
          : null;
    },
  },
};
