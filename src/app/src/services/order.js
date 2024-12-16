import axios from "@/services/axios";
import { Notify } from "quasar";
import { t } from "../locales";

const OrderService = {
  async create(data) {
    try {
      let result = await axios.post("https://demo.yansprint.com/api/order", data);
      return result.data.doc;
    } catch (e) {
      Notify.create({ type: "error", message: t("text.error.errorOccurred") });
      return false;
    }
  },
};

export default OrderService;
