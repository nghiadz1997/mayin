import { SystemSettings } from "../types";
import { COLLECTIONS, getAllDocuments, createDocument, updateDocument } from "./dataStore";
import { DEFAULT_SETTINGS } from "../lib/seedData";

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    const list = await getAllDocuments<SystemSettings & { id?: string }>(COLLECTIONS.SETTINGS);
    if (list.length > 0) return list[0];
    return DEFAULT_SETTINGS;
  },

  async updateSettings(newSettings: SystemSettings): Promise<void> {
    const list = await getAllDocuments<SystemSettings & { id?: string }>(COLLECTIONS.SETTINGS);
    if (list.length > 0 && list[0].id) {
      await updateDocument<SystemSettings & { id?: string }>(COLLECTIONS.SETTINGS, list[0].id, newSettings);
    } else {
      await createDocument(COLLECTIONS.SETTINGS, { id: "default-settings", ...newSettings });
    }
  },
};
