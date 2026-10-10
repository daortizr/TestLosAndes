# Respuestas — VTEX IO Challenge

**Nombre:David Alexander Ortiz**
**Tiempo aproximado invertido: 3 horas**

> Para cada tarea, explica brevemente qué cambiaste y por qué. Si no alcanzaste a implementar alguna, describe cómo la resolverías.

---

## Store

### 1. Error de sintaxis en `store/blocks.jsonc`
Se añade coma "," al final de la linea 7 del archivo blocks.jsonc

### 2. Interface de `shipping-estimate-badge`
store/interfaces.jsonc
Linea 9: Se añade la interface "shipping-estimate-badge" con "component": "ShippingEstimateBadge", que apunta al entry point react/ShippingEstimateBadge.tsx.
---

## Componente React

### 3. Tipado de `showCarrierName`
Linea 18. Se añade caracter "?" al final del nombre showCarrierName, queda "showCarrierName?:".
Linea 41. Se inicializa el la valiable showCarrierName con valor false.

### 4. Acceso seguro a `product.productId`
Linea 46. se deja "productContext?.product?.productId" para controlar cuando product es null o undefined.
Linea 55. Se añade "skip: !productId," para evitar realizar consulta cuando el valor de "productId" es null o undefined.

### 5. Resolución de `defaultPostalCode`
Linea 53. Se utiliza valores del orderForm.
Linea 54. Se extrae valor de postalCode del objeto "orderForm?.shippingData?.address?.postalCode", en caso de ser null o undefined se aplica el valor de "defaultPostalCode"

### 6. Manejo de `loading` y `error`
Linea 78. Se añade condicional para controlar casos solicitador de loading, error y tambien se añade control para el caso que fastest sea null o undefined. 
### 7. Optimización de renders
Linea 71. Se extra de data los estimados de entrega en la variable "estimates" con varidacion de null o undefined para "data".
Linea 72. Se cambia sort por reduce ya que sort modifica el arreglo original, reduce no genera cambios en "estimates".
return: se añade redundancia para controlar que no hayan valores nulos o indefinidos en "fastest".
---

## GraphQL y Node

### 8. Argumentos en el schema y firma del resolver
graphql/schema.graphql
Se añaden argumentos a estimateShipping para recibir los campos "productId" y "postalCode". 

node/resolvers/estimateShipping.ts
Linea 9: se crea interfaz "EstimateShippingArgs" con los campos que va a recibir del query.
Se eliminan valores predeterminados.
Linea 29: se añade tipo "any" a la funcion map del array "quotes". 

### 9. Resolver: timeout, errores, fallback y caching
node/clients/index.ts
Linea 34-35. Se añade "timeout: 2000" y "retries: 0" a la llamada getQuotes para no exceder los 30s de espera. Es un GET y el cache y el fallback cubren las fallas transitorias.

node/resolvers/estimateShipping.ts
Linea 1-28. Se crea cache en memoria "estimatesCache" (LRUCache de @vtex/api, max 500 entradas) y las interfaces "ShippingEstimate" y "CacheEntry".

Fallback. Si el servicio falla se devuelve la ultima entrada cacheada aunque este vencida y, si no existe, un arreglo vacio, que el front ya maneja sin renderizar el badge.

Manejo de cache
- Se guarda en cache la lista de estimaciones ya mapeada ("ShippingEstimate[]"), solo cuando el servicio responde con exito. No se cachean errores ni el arreglo vacio del fallback.
- Clave: "productId:postalCode". La cotizacion depende solo de esos dos valores y no de datos del usuario, por lo que se puede compartir entre compradores.
- Se maneja 10 minutos como TTL de entry reciente (evita una llamada externa por cada render de la PDP). El entry se conserva 1 hora para usarla solo como fallback si el servicio falla.
- Se almacena en memoria ya que es la opcion mas simple y rapida. Limitacion: cada replica tiene su propia cache.

### 10. Health check (`health.ts`)
Linea 14. Cambio de codigo a 200 segun requerimientos y se asigna response a variable request.
Linea 15. Cambio de del body. Se agrega data del request al response del servicio.
Linea 17. Cambio de codigo a 503 segun requerimientos. 
Linea 20. Se añade informacion del error al body del response.

---

## Notas adicionales

*Supuestos, cosas que no alcanzaste a implementar y cómo las harías, mejoras que propondrías.*
