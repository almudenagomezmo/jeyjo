export type AuthApiErrorBody = {
  error: string
  details?: string
  code?: string
  fieldErrors?: Record<string, string[]>
}

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  password: 'Contraseña',
  commercialName: 'Nombre o razón social',
  phone: 'Teléfono',
  taxId: 'CIF/NIF',
  billingAddressLine1: 'Dirección',
  billingCity: 'Ciudad',
  billingPostalCode: 'Código postal',
  billingCountry: 'País',
}

export function formatValidationFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): string {
  return Object.entries(fieldErrors)
    .flatMap(([field, messages]) =>
      (messages ?? []).map((msg) => {
        const label = FIELD_LABELS[field] ?? field
        return `${label}: ${msg}`
      }),
    )
    .join(' ')
}

export function mapSupabaseAuthError(message: string | undefined): AuthApiErrorBody {
  const raw = message?.trim() ?? ''
  const lower = raw.toLowerCase()

  if (lower.includes('email rate limit exceeded')) {
    return {
      error: 'Límite de emails de confirmación alcanzado',
      details:
        'Supabase ha bloqueado nuevos correos de registro porque se superó el cupo por hora (común en desarrollo tras varios intentos). Espera 30–60 minutos, prueba con otro email, o desactiva "Confirm email" en Supabase → Authentication → Providers → Email.',
      code: 'auth_email_rate_limit',
    }
  }

  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return {
      error: 'Este email ya tiene cuenta',
      details: 'Si ya te registraste, inicia sesión. Si no confirmaste el email, revisa tu bandeja o pide un nuevo enlace desde Supabase.',
      code: 'auth_user_exists',
    }
  }

  if (lower.includes('invalid email') || lower.includes('unable to validate email')) {
    return {
      error: 'Email no válido',
      details: 'Comprueba que el email esté bien escrito. Algunos dominios pueden estar bloqueados por Supabase.',
      code: 'auth_invalid_email',
    }
  }

  if (lower.includes('password') && (lower.includes('weak') || lower.includes('short'))) {
    return {
      error: 'Contraseña demasiado débil',
      details: 'Usa al menos 8 caracteres. Supabase puede exigir letras y números según la configuración del proyecto.',
      code: 'auth_weak_password',
    }
  }

  if (lower.includes('signup') && lower.includes('disabled')) {
    return {
      error: 'Registro deshabilitado',
      details: 'El alta de usuarios está desactivada en Supabase (Authentication → Providers → Email).',
      code: 'auth_signup_disabled',
    }
  }

  if (lower.includes('invalid api key')) {
    return {
      error: 'Configuración de Supabase incorrecta',
      details: 'Revisa NEXT_PUBLIC_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY en apps/storefront/.env o .env.local.',
      code: 'auth_invalid_api_key',
    }
  }

  if (lower.includes('invalid login credentials')) {
    return {
      error: 'Credenciales incorrectas',
      details: 'Email o contraseña no coinciden. Si acabas de registrarte, confirma primero el email que te envió Supabase.',
      code: 'auth_invalid_credentials',
    }
  }

  if (lower.includes('email not confirmed')) {
    return {
      error: 'Email sin confirmar',
      details: 'Abre el enlace del correo de confirmación antes de iniciar sesión. Si caducó, solicita uno nuevo.',
      code: 'auth_email_not_confirmed',
    }
  }

  if (lower.includes('error sending confirmation email') || lower.includes('error sending email')) {
    return {
      error: 'No se pudo enviar el email de confirmación',
      details:
        'Supabase no pudo enviar el correo vía SMTP. Si usas Resend, verifica el dominio del remitente (p. ej. jeyjo.com) en resend.com/domains y que el "Sender email" en Supabase → Authentication → SMTP Settings coincida con un dominio verificado. Mientras tanto, en desarrollo puedes desactivar "Confirm email" en Authentication → Providers → Email.',
      code: 'auth_email_send_failed',
    }
  }

  return {
    error: raw || 'Error de autenticación',
    details: raw ? `Supabase: ${raw}` : 'No se pudo completar la operación de autenticación.',
    code: 'auth_unknown',
  }
}

export function mapPostgresError(message: string | undefined, context: 'customer' | 'profile'): AuthApiErrorBody {
  const raw = message?.trim() ?? ''
  const lower = raw.toLowerCase()

  if (lower.includes('duplicate key') || lower.includes('unique constraint')) {
    return {
      error: context === 'customer' ? 'Datos de cliente duplicados' : 'Perfil duplicado',
      details:
        context === 'customer'
          ? 'Ya existe un cliente con ese email o identificador fiscal. Prueba a iniciar sesión.'
          : 'Ya existe un perfil web para este usuario.',
      code: 'db_unique_violation',
    }
  }

  if (lower.includes('does not exist') || lower.includes('could not find')) {
    return {
      error: 'Tabla o columna de base de datos no encontrada',
      details: `Error al guardar ${context === 'customer' ? 'el cliente' : 'el perfil'}: ${raw}. Ejecuta pnpm db:push para aplicar migraciones pendientes.`,
      code: 'db_schema_missing',
    }
  }

  return {
    error: context === 'customer' ? 'Error al crear el cliente' : 'Error al crear el perfil',
    details: raw || 'Fallo al insertar en la base de datos.',
    code: 'db_unknown',
  }
}

export function authErrorResponse(body: AuthApiErrorBody, status: number): Response {
  return Response.json(body, { status })
}
