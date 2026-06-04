import { z } from 'zod'

export const registerSchema = z
  .object({
    email: z.string().email('Email no válido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    commercialName: z.string().min(1, 'Nombre o razón social obligatorio'),
    phone: z.string().min(1, 'Teléfono obligatorio'),
    isCompany: z.boolean(),
    taxId: z.string().optional(),
    billingAddressLine1: z.string().min(1, 'Dirección obligatoria'),
    billingCity: z.string().min(1, 'Ciudad obligatoria'),
    billingPostalCode: z.string().min(1, 'Código postal obligatorio'),
    billingCountry: z.string().length(2).default('ES'),
  })
  .superRefine((data, ctx) => {
    if (data.isCompany && !data.taxId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CIF/NIF obligatorio para empresas',
        path: ['taxId'],
      })
    }
  })

export type RegisterInput = z.infer<typeof registerSchema>
