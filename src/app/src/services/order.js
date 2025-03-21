import axios from "@/services/axios";
import { Notify } from "quasar";
import { t } from "../locales";

const OrderService = {
  async create(data) {
    try {
      let result = await axios.post("https://demo.yansprint.com/api/add-to-basket", data);
      return result.data;
    } catch (e) {
      Notify.create({ type: "error", message: t("text.error.errorOccurred") });
      return false;
    }
  },
};

export default OrderService;
