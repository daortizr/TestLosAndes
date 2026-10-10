import { LRUCache } from '@vtex/api'
import type { ServiceContext } from '@vtex/api'

import type { Clients } from '../clients'

type Context = ServiceContext<Clients>

interface ShippingEstimate {
  carrierName: string
  estimatedDays: number
  price: number
}

interface CacheEntry {
  estimates: ShippingEstimate[]
  fetchedAt: number
}

// Una entrada se considera fresca durante 10 min. Pasado ese tiempo se vuelve
// a consultar el servicio, pero la entrada se conserva hasta 1 h para poder
// usarla como fallback si el servicio falla.
const FRESH_TTL_MS = 10 * 60 * 1000
const STALE_TTL_MS = 60 * 60 * 1000

const estimatesCache = new LRUCache<string, CacheEntry>({
  max: 500,
  maxAge: STALE_TTL_MS,
})

// TODO #8: actualizar la firma para recibir { productId, postalCode }
// como argumentos tipados, una vez agregados al schema GraphQL.
interface EstimateShippingArgs {
  productId: string
  postalCode: string
}

export const estimateShipping = async (
  _root: unknown,
  { productId, postalCode }: EstimateShippingArgs,
  ctx: Context
) => {
  // TODO #9: implementación incompleta.
  //  - No hay timeout: si el servicio externo tarda, la PDP queda esperando.
  //  - No hay manejo de errores: cualquier falla del servicio se propaga tal cual.
  //  - No hay fallback: el front no recibe nada útil si el servicio cae.
  //  - No hay caching: cada render de la PDP genera una llamada externa.
  //  Implementa estos cuatro puntos y justifica tu estrategia de caching
  //  en RESPUESTAS.md.

  const cacheKey = `${productId}:${postalCode}`
  const cached = estimatesCache.get(cacheKey)

  if (cached && Date.now() - cached.fetchedAt < FRESH_TTL_MS) {
    return cached.estimates
  }

  try {
    const quotes = await ctx.clients.shippingMock.getQuotes(
      productId,
      postalCode
    )

    const estimates = quotes.map((quote : any) => ({
      carrierName: quote.carrier,
      estimatedDays: quote.days,
      price: quote.cost,
    }))

    estimatesCache.set(cacheKey, { estimates, fetchedAt: Date.now() })

    return estimates
  } catch (error) {
    console.error('estimateShipping: shipping service failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      productId,
      postalCode,
      servedFromStaleCache: Boolean(cached),
    })

    return cached ? cached.estimates : []
  }
}
