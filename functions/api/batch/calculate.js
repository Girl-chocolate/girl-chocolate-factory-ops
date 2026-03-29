export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const method = request.method;

  try {
    if (method === 'POST') {
      const body = await request.json();
      const { pouches } = body;

      if (!pouches || pouches <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid pouches count' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const recipes = await db
        .prepare(
          `
          SELECT
            br.id,
            br.supplement_id,
            br.dosage_per_square_g,
            s.name,
            s.unit_price,
            s.on_hand_kg,
            s.incoming_kg
          FROM batch_recipes br
          JOIN supplements s ON br.supplement_id = s.id
          ORDER BY s.name ASC
          `
        )
        .all();

      const breakdown = recipes.results.map((recipe) => {
        const squaresPerPouch = 8;
        const gramPerSquare = recipe.dosage_per_square_g;
        const totalGramNeeded = gramPerSquare * squaresPerPouch * pouches;
        const netNeededKg = totalGramNeeded / 1000;
        const toOrderKg = Math.max(0, netNeededKg - recipe.on_hand_kg);
        const materialCost = netNeededKg * recipe.unit_price;

        return {
          supplement_id: recipe.supplement_id,
          supplement_name: recipe.name,
          unit_price: recipe.unit_price,
          on_hand_kg: recipe.on_hand_kg,
          incoming_kg: recipe.incoming_kg,
          dosage_per_square_g: recipe.dosage_per_square_g,
          gram_per_square: gramPerSquare,
          total_gram_needed: totalGramNeeded,
          net_needed_kg: parseFloat(netNeededKg.toFixed(4)),
          to_order_kg: parseFloat(toOrderKg.toFixed(4)),
          material_cost: parseFloat(materialCost.toFixed(2)),
        };
      });

      const totalCost = breakdown.reduce((sum, item) => sum + item.material_cost, 0);
      const totalToOrder = breakdown.reduce((sum, item) => sum + item.to_order_kg, 0);

      return new Response(
        JSON.stringify({
          pouches,
          breakdown,
          totals: {
            total_material_cost: parseFloat(totalCost.toFixed(2)),
            total_to_order_kg: parseFloat(totalToOrder.toFixed(4)),
            ingredient_count: breakdown.length,
          },
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
