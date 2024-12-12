import axios from "@/services/axios";
import { Notify } from "quasar";
import { t } from "../locales";

const ProductService = {
  async getModel(product_id, project_id) {
    try {
      let result = await axios.get(`https://demo.yansprint.com/api/product/${product_id}?project_id=${project_id}`);
      result.data.images.map((el) => {
        if(el[2]) {
          el.front = el[2];
          delete el[2];
        }
        if(el[3]) {
          el.back = el[3];
          delete el[3];
        }
        if(el[4]) {
          el.left_side = el[4];
          delete el[4];
        }
        if(el[5]) {
          el.right_side = el[5];
          delete el[5];
        }
      });
      return [result.data];
    } catch (e) {
      return false;
    }
  },

  async getModels(userId = null) {
    try {
      let result = await axios.post("products/models", { userId });
      return result.data.docs;
    } catch (e) {
      return false;
    }
  },

  async create(data) {
    try {
      let result = await axios.post("products", data);
      Notify.create({
        type: "success",
        message: t("text.successfullyCreated"),
      });
      return result.data.doc;
    } catch (e) {
      Notify.create({ type: "error", message: t("text.error.errorOccurred") });
      return false;
    }
  },

  async delete(id) {
    try {
      let result = await axios.delete(`products/${id}`);
      Notify.create({
        type: "success",
        message: t("text.successfullyDeleted"),
      });
      console.log("delete: ", result);
      return true;
    } catch (e) {
      console.log("error:create: ", e);
      Notify.create({ type: "error", message: t("text.error.errorOccurred") });
      return false;
    }
  },
};

export default ProductService;
