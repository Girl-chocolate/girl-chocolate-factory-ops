export async function onRequest(context) {
  const { request, env, params } = context;
  const db = env.DB;
  const method = request.method;
  const id = params.id;

  try {
    if (method === 'DELETE') {
      const doc = await db.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first();

      if (!doc) {
        return new Response(JSON.stringify({ error: 'Document not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (doc.file_key) {
        try {
          await env.DOCS_BUCKET.delete(doc.file_key);
        } catch (err) {
          console.error('Failed to delete file from R2:', err);
        }
      }

      await db.prepare('DELETE FROM documents WHERE id = ?').bind(id).run();

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
