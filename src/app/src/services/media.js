import axios from "@/services/axios";
import { Notify } from "quasar";
import { t } from "../locales";

const MediaService = {
  async upload(file, project_id, remove_background) {
    try {
      let data = new FormData();
      data.append('project_id', project_id);
      data.append('file_preview', file);
      data.append('remove_background', remove_background);
      let result = await axios.post("https://demo.yansprint.com/api/file-preview", data);
      return result.data;
    } catch (e) {
      Notify.create({ type: "error", message: t("text.error.cantUploadFile") });
      return false;
    }
  },

  async update(file, project_id, remove_background) {
    try {
      let data = new FormData();
      data.append('project_id', project_id);
      data.append('file_preview', file);
      data.append('remove_background', remove_background);
      let result = await axios.put("https://demo.yansprint.com/api/file-preview", data);
      return result.data;
    } catch (e) {
      Notify.create({ type: "error", message: t("text.error.cantUploadFile") });
      return false;
    }
  },

  async uploadBlob(blob, side, project_id) {
    try {
      let data = new FormData();
      data.append("file", blob, side + ".pdf");
      data.append("project_id", project_id);

      let result = await axios.post("https://demo.yansprint.com/api/save-pdf", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return result.data?.file_path;
    } catch (e) {
      Notify.create({ type: "error", message: t("text.error.cantUploadFile") });
      return false;
    }
  },

  async deleteFile(data) {
    try {
      let result = await axios.delete("https://demo.yansprint.com/api/file-delete", {data});
      return result.data;
    } catch (e) {
      Notify.create({ type: "error", message: t("text.error.cantDeleteFile") });
      return false;
    }
  },
};

export default MediaService;
