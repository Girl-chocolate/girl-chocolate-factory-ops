export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const method = request.method;

  try {
    if (method === 'GET') {
      const orders = await db
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
            sup.name as supplier_name,
            COUNT(oi.id) as item_count
          FROM purchase_orders po
          LEFT JOIN suppliers sup ON po.supplier_id = sup.id
          LEFT JOIN order_items oi ON po.id = oi.order_id
          GROUP BY po.id
          ORDER BY po.created_at DESC
          `
        )
        .all();

      const ordersWithItems = await Promise.all(
        orders.results.map(async (order) => {
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
            .bind(order.id)
            .all();

          return {
            ...order,
            items: items.results,
          };
        })
      );

      return new Response(JSON.stringify(ordersWithItems), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      const body = await request.json();
      const id = `ord_${crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16), '')}`;

      await db
        .prepare(
          `
          INSERT INTO purchase_orders (id, supplier_id, status, order_date, expected_date, notes)
          VALUES (?, ?, ?, datetime('now'), ?, ?)
          `
        )
        .bind(id, body.supplier_id || null, 'pending', body.expected_date || null, body.notes || null)
        .run();

      if (body.items && body.items.length > 0) {
        for (const item of body.items) {
          const itemId = `oi_${crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16), '')}`;
          await db
            .prepare(
              `
              INSERT INTO order_items (id, order_id, supplement_id, quantity_kg, unit_price, received_kg)
              VALUES (?, ?, ?, ?, ?, ?)
              `
            )
            .bind(itemId, id, item.supplement_id, item.quantity_kg, item.unit_price || 0, 0)
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
        status: 201,
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
