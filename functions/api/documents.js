export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const method = request.method;
  const url = new URL(request.url);
  const supplementId = url.searchParams.get('supplement_id');

  try {
    if (method === 'GET') {
      let query = 'SELECT * FROM documents ORDER BY created_at DESC';
      let params = [];

      if (supplementId) {
        query = 'SELECT * FROM documents WHERE supplement_id = ? ORDER BY created_at DESC';
        params = [supplementId];
      }

      const documents = await db.prepare(query).bind(...params).all();

      return new Response(JSON.stringify(documents.results), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      const body = await request.json();
      const id = `doc_${crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16), '')}`;

      await db
        .prepare(
          `
          INSERT INTO documents (id, supplement_id, name, file_key, link_url, doc_type)
          VALUES (?, ?, ?, ?, ?, ?)
          `
        )
        .bind(id, body.supplement_id, body.name, body.file_key || null, body.link_url || null, body.doc_type || 'file')
        .run();

      const result = await db.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first();

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
