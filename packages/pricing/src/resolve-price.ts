import { applyPercentDiscount, grossFromNet, isB2BCustomerGroup } from './money.js'
import type { PricingRepository } from './repository.js'
import type { AppliedPriceRule, PriceQuote, PricingInput } from './types.js'

export async function resolvePrice(
  input: PricingInput,
  repo: PricingRepository,
): Promise<PriceQuote> {
  const product = await repo.getProductBase(input.sku)
  if (!product) {
    throw new Error(`Product not found for SKU: ${input.sku}`)
  }

  const customer = await repo.getCustomerContext(input.customerId ?? null)
  const customerGroup = customer?.customerGroup ?? 1
  const vatRate = product.vatRate

  if (customer?.customerId) {
    const special = await repo.getSpecialPrice(customer.customerId, input.sku)
    if (special != null) {
      return buildQuote({
        sku: input.sku,
        netUnit: special,
        vatRate,
        appliedRule: 'special_price',
        listUnit: product.p2Price,
        label: 'Precio especial',
      })
    }
  }

  const offer = await repo.getGroupOffer(input.sku, customerGroup)
  if (offer != null) {
    return buildQuote({
      sku: input.sku,
      netUnit: offer,
      vatRate,
      appliedRule: 'group_offer',
      listUnit: isB2BCustomerGroup(customerGroup) ? product.p2Price : product.p1Price,
      label: 'Oferta de grupo',
    })
  }

  if (customer && isB2BCustomerGroup(customerGroup)) {
    const netUnit = applyPercentDiscount(product.p2Price, customer.generalDiscount)
    return buildQuote({
      sku: input.sku,
      netUnit,
      vatRate,
      appliedRule: 'b2b_discount',
      listUnit: product.p2Price,
      discountPercent: customer.generalDiscount,
    })
  }

  return buildQuote({
    sku: input.sku,
    netUnit: product.p1Price,
    vatRate,
    appliedRule: 'p1_retail',
    listUnit: product.p1Price,
  })
}

function buildQuote(args: {
  sku: string
  netUnit: number
  vatRate: number
  appliedRule: AppliedPriceRule
  listUnit?: number
  discountPercent?: number
  label?: string
}): PriceQuote {
  return {
    sku: args.sku,
    netUnit: args.netUnit,
    grossUnit: grossFromNet(args.netUnit, args.vatRate),
    vatRate: args.vatRate,
    appliedRule: args.appliedRule,
    listUnit: args.listUnit,
    discountPercent: args.discountPercent,
    label: args.label,
  }
}
