import { AppUser } from "../types";
import {
  COLLECTIONS,
  getAllDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./dataStore";

export const userService = {
  async getAll(): Promise<AppUser[]> {
    return getAllDocuments<AppUser>(COLLECTIONS.USERS);
  },

  async getById(uid: string): Promise<AppUser | null> {
    const list = await this.getAll();
    return list.find((u) => u.uid === uid || u.id === uid) || null;
  },

  async create(user: AppUser): Promise<AppUser> {
    const withId = { ...user, id: user.uid };
    return createDocument<AppUser & { id: string }>(COLLECTIONS.USERS, withId);
  },

  async update(uid: string, partial: Partial<AppUser>): Promise<void> {
    await updateDocument<AppUser>(COLLECTIONS.USERS, uid, partial);
  },

  async delete(uid: string): Promise<void> {
    await deleteDocument(COLLECTIONS.USERS, uid);
  },
};
