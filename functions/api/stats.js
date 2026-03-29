export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const method = request.method;

  try {
    if (method === 'GET') {
      const inventoryValue = await db
        .prepare(
          `
          SELECT COALESCE(SUM(on_hand_kg * unit_price), 0) as total_value
          FROM supplements
          `
        )
        .first();

      const ingredientCount = await db
        .prepare('SELECT COUNT(*) as count FROM supplements')
        .first();

      const lowStockAlerts = await db
        .prepare(
          `
          SELECT COUNT(*) as count
          FROM supplements
          WHERE on_hand_kg < low_stock_threshold
          `
        )
        .first();

      const lowStockItems = await db
        .prepare(
          `
          SELECT id, name, on_hand_kg, low_stock_threshold
          FROM supplements
          WHERE on_hand_kg < low_stock_threshold
          ORDER BY on_hand_kg ASC
          `
        )
        .all();

      const pendingOrders = await db
        .prepare(
          `
          SELECT COUNT(*) as count
          FROM purchase_orders
          WHERE status = 'pending'
          `
        )
        .first();

      const totalIncomingKg = await db
        .prepare(
          `
          SELECT COALESCE(SUM(incoming_kg), 0) as total
          FROM supplements
          `
        )
        .first();

      return new Response(
        JSON.stringify({
          inventory_value: parseFloat(inventoryValue.total_value.toFixed(2)),
          unique_ingredients: ingredientCount.count,
          low_stock_alerts: lowStockAlerts.count,
          low_stock_items: lowStockItems.results,
          pending_orders: pendingOrders.count,
          total_incoming_kg: parseFloat(totalIncomingKg.total.toFixed(4)),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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
