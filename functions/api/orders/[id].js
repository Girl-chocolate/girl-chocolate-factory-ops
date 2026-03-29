export async function onRequest(context) {
  const { request, env, params } = context;
  const db = env.DB;
  const method = request.method;
  const id = params.id;

  try {
    if (method === 'GET') {
      const order = await db
        .prepare(
          `
          SELECT
            po.id,
            po.supplier_id,
            po.status,
            po.order_date,
            po.expected_date,
            po.notes,
            po.created_at,
            po.updated_at,
            sup.name as supplier_name
          FROM purchase_orders po
          LEFT JOIN suppliers sup ON po.supplier_id = sup.id
          WHERE po.id = ?
          `
        )
        .bind(id)
        .first();

      if (!order) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const items = await db
        .prepare(
          `
          SELECT
            oi.id,
            oi.order_id,
            oi.supplement_id,
            oi.quantity_kg,
            oi.unit_price,
            oi.received_kg,
            oi.created_at,
            s.name as supplement_name
          FROM order_items oi
          JOIN supplements s ON oi.supplement_id = s.id
          WHERE oi.order_id = ?
          `
        )
        .bind(id)
        .all();

      return new Response(JSON.stringify({ ...order, items: items.results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PUT') {
      const body = await request.json();

      if (body.status) {
        await db
          .prepare('UPDATE purchase_orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?')
          .bind(body.status, id)
          .run();
      }

      if (body.expected_date !== undefined) {
        await db
          .prepare('UPDATE purchase_orders SET expected_date = ?, updated_at = datetime(\'now\') WHERE id = ?')
          .bind(body.expected_date, id)
          .run();
      }

      if (body.notes !== undefined) {
        await db
          .prepare('UPDATE purchase_orders SET notes = ?, updated_at = datetime(\'now\') WHERE id = ?')
          .bind(body.notes, id)
          .run();
      }

      if (body.received_items && body.received_items.length > 0) {
        for (const receivedItem of body.received_items) {
          const currentItem = await db
            .prepare('SELECT received_kg FROM order_items WHERE id = ?')
            .bind(receivedItem.item_id)
            .first();

          const newReceivedKg = (currentItem?.received_kg || 0) + receivedItem.received_kg;

          await db
            .prepare('UPDATE order_items SET received_kg = ? WHERE id = ?')
            .bind(newReceivedKg, receivedItem.item_id)
            .run();

          const orderItem = await db
            .prepare('SELECT supplement_id, received_kg FROM order_items WHERE id = ?')
            .bind(receivedItem.item_id)
            .first();

          const supplement = await db
            .prepare('SELECT on_hand_kg FROM supplements WHERE id = ?')
            .bind(orderItem.supplement_id)
            .first();

          const newOnHandKg = (supplement?.on_hand_kg || 0) + receivedItem.received_kg;

          await db
            .prepare('UPDATE supplements SET on_hand_kg = ?, updated_at = datetime(\'now\') WHERE id = ?')
            .bind(newOnHandKg, orderItem.supplement_id)
            .run();
        }
      }

      const result = await db
        .prepare(
          `
          SELECT
            po.id,
            po.supplier_id,
            po.status,
            po.order_date,
            po.expected_date,
            po.notes,
            po.created_at,
            po.updated_at,
            sup.name as supplier_name
          FROM purchase_orders po
          LEFT JOIN suppliers sup ON po.supplier_id = sup.id
          WHERE po.id = ?
          `
        )
        .bind(id)
        .first();

      const items = await db
        .prepare(
          `
          SELECT
            oi.id,
            oi.order_id,
            oi.supplement_id,
            oi.quantity_kg,
            oi.unit_price,
            oi.received_kg,
            oi.created_at,
            s.name as supplement_name
          FROM order_items oi
          JOIN supplements s ON oi.supplement_id = s.id
          WHERE oi.order_id = ?
          `
        )
        .bind(id)
        .all();

      return new Response(JSON.stringify({ ...result, items: items.results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE') {
      await db.prepare('DELETE FROM purchase_orders WHERE id = ?').bind(id).run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
