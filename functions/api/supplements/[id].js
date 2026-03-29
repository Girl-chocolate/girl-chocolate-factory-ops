export async function onRequest(context) {
  const { request, env, params } = context;
  const db = env.DB;
  const method = request.method;
  const id = params.id;

  try {
    if (method === 'GET') {
      const result = await db
        .prepare(
          `
          SELECT
            s.id,
            s.name,
            s.supplier_id,
            s.unit_price,
            s.on_hand_kg,
            s.incoming_kg,
            s.low_stock_threshold,
            s.created_at,
            s.updated_at,
            sup.name as supplier_name
          FROM supplements s
          LEFT JOIN suppliers sup ON s.supplier_id = sup.id
          WHERE s.id = ?
          `
        )
        .bind(id)
        .first();

      if (!result) {
        return new Response(JSON.stringify({ error: 'Supplement not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PUT') {
      const body = await request.json();

      await db
        .prepare(
          `
          UPDATE supplements
          SET name = ?, supplier_id = ?, unit_price = ?, on_hand_kg = ?, incoming_kg = ?, low_stock_threshold = ?, updated_at = datetime('now')
          WHERE id = ?
          `
        )
        .bind(body.name, body.supplier_id || null, body.unit_price || 0, body.on_hand_kg || 0, body.incoming_kg || 0, body.low_stock_threshold || 0.5, id)
        .run();

      const result = await db
        .prepare(
          `
          SELECT
            s.id,
            s.name,
            s.supplier_id,
            s.unit_price,
            s.on_hand_kg,
            s.incoming_kg,
            s.low_stock_threshold,
            s.created_at,
            s.updated_at,
            sup.name as supplier_name
          FROM supplements s
          LEFT JOIN suppliers sup ON s.supplier_id = sup.id
          WHERE s.id = ?
          `
        )
        .bind(id)
        .first();

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE') {
      await db.prepare('DELETE FROM supplements WHERE id = ?').bind(id).run();

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
