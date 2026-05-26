/**
 * Example CRUD route: /api/items
 *
 * Copy this file and adapt it for each resource in your app.
 * Replace 'Item' / 'items' with your resource name.
 */

import { Hono } from 'hono';
import type { Env } from '../index';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Item {
  id: number;
  name: string;
  description: string | null;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

// ── Route ─────────────────────────────────────────────────────────────────────
const items = new Hono<{ Bindings: Env }>();

/** GET /api/items — list all items (optionally filter by status) */
items.get('/', async (c) => {
  const status = c.req.query('status'); // e.g. ?status=active

  const query = status
    ? 'SELECT * FROM items WHERE status = ? ORDER BY created_at DESC'
    : 'SELECT * FROM items ORDER BY created_at DESC';

  const params = status ? [status] : [];
  const { results } = await c.env.DB.prepare(query).bind(...params).all<Item>();

  return c.json(results);
});

/** GET /api/items/:id — get a single item */
items.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const item = await c.env.DB.prepare('SELECT * FROM items WHERE id = ?')
    .bind(id)
    .first<Item>();

  if (!item) return c.json({ error: 'Item not found' }, 404);
  return c.json(item);
});

/** POST /api/items — create an item */
items.post('/', async (c) => {
  const body = await c.req.json<{ name: string; description?: string }>();

  if (!body.name?.trim()) {
    return c.json({ error: 'name is required' }, 400);
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO items (name, description) VALUES (?, ?) RETURNING *'
  )
    .bind(body.name.trim(), body.description ?? null)
    .first<Item>();

  return c.json(result, 201);
});

/** PUT /api/items/:id — update an item */
items.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{
    name?: string;
    description?: string;
    status?: 'active' | 'archived';
  }>();

  // Check it exists first
  const existing = await c.env.DB.prepare('SELECT id FROM items WHERE id = ?')
    .bind(id)
    .first<{ id: number }>();
  if (!existing) return c.json({ error: 'Item not found' }, 404);

  const result = await c.env.DB.prepare(
    `UPDATE items
     SET name        = COALESCE(?, name),
         description = COALESCE(?, description),
         status      = COALESCE(?, status),
         updated_at  = datetime('now')
     WHERE id = ?
     RETURNING *`
  )
    .bind(body.name ?? null, body.description ?? null, body.status ?? null, id)
    .first<Item>();

  return c.json(result);
});

/** DELETE /api/items/:id — delete an item */
items.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));

  const existing = await c.env.DB.prepare('SELECT id FROM items WHERE id = ?')
    .bind(id)
    .first<{ id: number }>();
  if (!existing) return c.json({ error: 'Item not found' }, 404);

  await c.env.DB.prepare('DELETE FROM items WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

export default items;
