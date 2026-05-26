/**
 * Items API — example resource module.
 * Copy this file and adapt it for each resource in your app.
 */

import { api } from './client';

export interface Item {
  id: number;
  name: string;
  description: string | null;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export const itemsApi = {
  list(status?: 'active' | 'archived'): Promise<Item[]> {
    const qs = status ? `?status=${status}` : '';
    return api.get<Item[]>(`/items${qs}`);
  },

  get(id: number): Promise<Item> {
    return api.get<Item>(`/items/${id}`);
  },

  create(data: { name: string; description?: string }): Promise<Item> {
    return api.post<Item>('/items', data);
  },

  update(
    id: number,
    data: Partial<{ name: string; description: string; status: 'active' | 'archived' }>
  ): Promise<Item> {
    return api.put<Item>(`/items/${id}`, data);
  },

  delete(id: number): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/items/${id}`);
  },
};
