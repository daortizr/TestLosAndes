import { ExternalClient, IOClients } from '@vtex/api'
import type { InstanceOptions, IOContext } from '@vtex/api'

/**
 * Respuesta del servicio externo de cotización de envíos (simulado).
 * Ejemplo:
 *   GET /api/quotes?productId=123&postalCode=110111
 *   [{ "carrier": "Servientrega", "days": 3, "cost": 12000 }, ...]
 */
export interface ShippingQuote {
  carrier: string
  days: number
  cost: number
}

export class ShippingMockClient extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('http://shipping-mock.example.com', context, {
      ...options,
      headers: {
        ...options?.headers,
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  public getQuotes(productId: string, postalCode: string) {
    return this.http.get<ShippingQuote[]>('/api/quotes', {
      params: { productId, postalCode },
      metric: 'shipping-mock-get-quotes',
      // Cambio #9: timeout corto y sin reintentos para que la PDP no quede
      // esperando (el default global es 10 s con 2 reintentos). La caché y el
      // fallback del resolver cubren las fallas transitorias.
      timeout: 2000,
      retries: 0,
    })
  }

  public ping() {
    return this.http.get<{ ok: boolean }>('/health', {
      metric: 'shipping-mock-ping',
    })
  }
}

export class Clients extends IOClients {
  public get shippingMock() {
    return this.getOrSet('shippingMock', ShippingMockClient)
  }
}
