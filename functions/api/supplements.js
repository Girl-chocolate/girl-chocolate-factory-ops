export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const method = request.method;
  const url = new URL(request.url);

  try {
    if (method === 'GET') {
      const supplements = await db
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
          ORDER BY s.name ASC
          `
        )
        .all();

      return new Response(JSON.stringify(supplements.results), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      const body = await request.json();
      const id = `sup_${crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16), '')}`;

      await db
        .prepare(
          `
          INSERT INTO supplements (id, name, supplier_id, unit_price, on_hand_kg, incoming_kg, low_stock_threshold)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `
        )
        .bind(id, body.name, body.supplier_id || null, body.unit_price || 0, body.on_hand_kg || 0, body.incoming_kg || 0, body.low_stock_threshold || 0.5)
        .run();

      const result = await db
        .prepare('SELECT * FROM supplements WHERE id = ?')
        .bind(id)
        .first();

      return new Response(JSON.stringify(result), {
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
