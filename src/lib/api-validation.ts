import type { ZodSchema } from 'zod'

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: Response }

/**
 * Parse a JSON request body and validate it against a Zod schema.
 * Returns the validated data on success, or a 400 Response on failure.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<ParseResult<T>> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return {
      ok: false,
      response: Response.json({ error: 'Invalid JSON' }, { status: 400 }),
    }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    return {
      ok: false,
      response: Response.json(
        { error: 'Invalid request', details: result.error.flatten().fieldErrors },
        { status: 400 },
      ),
    }
  }

  return { ok: true, data: result.data }
}
