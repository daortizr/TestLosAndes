import React, { useMemo } from 'react'
import { useQuery } from 'react-apollo'
import { useProduct } from 'vtex.product-context'
import { useCssHandles } from 'vtex.css-handles'
import { useOrderForm } from 'vtex.order-manager/OrderForm'

import ESTIMATE_SHIPPING from '../../graphql/estimateShipping.graphql'

const CSS_HANDLES = [
  'container',
  'title',
  'estimate',
  'carrier',
  'price',
  'error',
] as const

interface Props {
  showCarrierName?: boolean
  blockClass?: string
}

interface ShippingEstimate {
  carrierName: string
  estimatedDays: number
  price: number
}

interface QueryData {
  estimateShipping: ShippingEstimate[]
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

const ShippingEstimateBadge: StorefrontFunctionComponent<Props> = ({
  showCarrierName = false,
}) => {
  const { handles } = useCssHandles(CSS_HANDLES)
  const productContext = useProduct()

  const productId = productContext?.product?.productId

  // TODO #5: el código postal está hardcodeado. Debe resolverse
  // desde el contexto de la tienda (por ejemplo, la dirección del orderForm
  // del comprador) y solo usar un valor por defecto como último recurso.
  const defaultPostalCode = '110111'
  const { orderForm } = useOrderForm()
  const postalCode =
    orderForm?.shippingData?.address?.postalCode || defaultPostalCode

  const { data, loading, error } = useQuery<QueryData>(ESTIMATE_SHIPPING, {
    variables: { productId, postalCode: postalCode },
    skip: !productId,
  })

  // TODO #6: no hay manejo de `loading` ni de `error`. Se lee
  // `data.estimateShipping` directamente, lo que falla mientras la query
  // está en curso o si el resolver devuelve un error.

  // TODO #7: optimización de renders. Este cálculo se rehace en cada
  // render y el componente se vuelve a renderizar con cualquier cambio del
  // product-context (p. ej. al seleccionar otro SKU), aunque el resultado no
  // cambie. Revisa también si esta línea tiene efectos colaterales.
  const estimates = data?.estimateShipping
  const fastest = useMemo(
    () =>
      estimates?.reduce<ShippingEstimate | undefined>(
        (best, current) =>
          !best || current.estimatedDays < best.estimatedDays ? current : best,
        undefined
      ),
    [estimates]
  )

  if (loading || error || !fastest) {
    return null
  }

  return (
    <div className={handles.container}>
      <span className={handles.title}>Recíbelo en</span>{' '}
      <strong className={handles.estimate}>
        {fastest?.estimatedDays} días hábiles
      </strong>
      {showCarrierName && (
        <span className={handles.carrier}> con {fastest?.carrierName}</span>
      )}{' '}
      <span className={handles.price}>({formatPrice(fastest? fastest.price : 0)})</span>
    </div>
  )
}

ShippingEstimateBadge.schema = {
  title: 'Shipping Estimate Badge',
}

export default ShippingEstimateBadge
