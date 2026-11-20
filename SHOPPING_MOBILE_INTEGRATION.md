# Integración Mobile - Listas de Compras

Este documento describe el flujo actual de `shopping` para que el equipo mobile lo integre sin ambigüedades.

La decisión clave del backend es esta:

- Cada hogar puede tener como máximo una lista activa de compras.
- Los ítems activos viven en `items`.
- Cuando se finaliza una compra, no se mueve la lista a historial.
- Lo que pasa a historial es el lote de ítems comprados.
- El historial vive dentro del mismo documento Mongo de la lista, en el arreglo `history`.
- Luego de finalizar, la misma lista se reinicia vaciando `items` y conservando `history`.

## Modelo mental

Para la app, la lista funciona como un contenedor persistente:

- `items`: lo que sigue pendiente o en curso.
- `history`: lotes ya comprados, cada uno con su fecha de cierre.

En la práctica:

1. Se crea una lista con nombre.
2. Se agregan ítems a esa lista.
3. Se marcan ítems como comprados o pendientes.
4. Cuando todo está comprado, el usuario toca "Compra finalizada".
5. El backend guarda ese lote en `history` con fecha y usuario.
6. La lista queda lista para un nuevo ciclo, sin crear un documento nuevo.

## Endpoints

Todas las rutas requieren `Authorization: Bearer <accessToken>`.

### Crear lista

`POST /api/shopping`

Body:

```json
{
  "household_id": "household-123",
  "name": "Supermercado"
}
```

Comportamiento:

- Crea la primera lista activa del hogar.
- Si el hogar ya tiene una lista activa, responde `409`.

Esto reemplaza el flujo anterior donde la lista se generaba implícitamente al agregar el primer ítem. Ahora la recomendación es que mobile cree la lista explícitamente con un nombre elegido por la familia.

### Obtener lista activa y su historial

`GET /api/shopping/:householdId`

Query opcional:

- `status=active`
- `status=archived`

Respuesta esperada:

- un arreglo con cero o una lista activa para el hogar.
- la lista incluye:
  - `items`: ítems activos
  - `history`: lotes ya finalizados

Ejemplo:

```json
{
  "success": true,
  "message": "Shopping lists retrieved",
  "data": [
    {
      "id": "list-123",
      "household_id": "household-123",
      "name": "Supermercado",
      "status": "active",
      "items": [
        {
          "id": "item-1",
          "name": "Leche",
          "quantity": 2,
          "is_completed": false,
          "added_by": "user-1",
          "checked_by": null
        }
      ],
      "history": [
        {
          "id": "history-1",
          "completed_at": "2026-07-24T12:00:00.000Z",
          "completed_by": "user-1",
          "items": [
            {
              "id": "item-9",
              "name": "Pan",
              "quantity": 1,
              "is_completed": true,
              "added_by": "user-1",
              "checked_by": "user-2"
            }
          ]
        }
      ]
    }
  ]
}
```

## Operaciones sobre ítems

### Agregar ítem

`POST /api/shopping/:listId/items`

Body:

```json
{
  "name": "Arroz",
  "quantity": 1
}
```

Notas:

- `quantity` por defecto es `1`.
- El backend registra quién lo agregó en `added_by`.

### Marcar ítem como comprado o pendiente

`PATCH /api/shopping/:listId/items/:itemId`

Body:

```json
{
  "is_completed": true
}
```

Comportamiento:

- `true` marca el ítem como comprado.
- `false` lo devuelve a pendiente.
- Si la app quiere mostrar quién lo marcó, el backend también puede guardar `checked_by`.

## Finalizar compra

### Botón de cierre

`POST /api/shopping/:listId/finalize`

Este endpoint se debe llamar cuando el usuario confirme que ya terminó la compra.

Regla importante:

- El backend solo permite finalizar si todos los ítems activos están completados.
- Si queda al menos un ítem pendiente, responde `409`.

Ejemplo de respuesta:

```json
{
  "success": true,
  "message": "Purchase finalized",
  "data": {
    "history": {
      "id": "history-1",
      "completed_at": "2026-07-24T12:00:00.000Z",
      "completed_by": "user-1",
      "items": [
        {
          "id": "item-1",
          "name": "Leche",
          "quantity": 2,
          "is_completed": true,
          "added_by": "user-1",
          "checked_by": "user-2"
        }
      ]
    },
    "active_list": {
      "id": "list-123",
      "household_id": "household-123",
      "name": "Supermercado",
      "status": "active",
      "items": [],
      "history": [
        {
          "id": "history-1",
          "completed_at": "2026-07-24T12:00:00.000Z",
          "completed_by": "user-1",
          "items": [
            {
              "id": "item-1",
              "name": "Leche",
              "quantity": 2,
              "is_completed": true,
              "added_by": "user-1",
              "checked_by": "user-2"
            }
          ]
        }
      ]
    }
  }
}
```

## Reglas de UI recomendadas para mobile

1. Si el hogar no tiene lista activa, mostrar CTA para crear una lista con nombre.
2. Si existe lista activa, usar `items` como fuente de verdad para la pantalla principal.
3. Mostrar `history` como bloque de compras previas dentro de la misma lista.
4. Al pulsar "Compra finalizada", invocar `POST /api/shopping/:listId/finalize`.
5. Después del finalize, refrescar la lista con `GET /api/shopping/:householdId`.
6. No crear una nueva lista para cada compra. La misma lista se reutiliza.

## Estados y errores relevantes

- `409` en creación: ya existe una lista activa para ese hogar.
- `409` en finalize: todavía hay ítems pendientes.
- `404`: lista no encontrada o acceso inválido.
- `401`: token ausente o expirado.

## Resumen corto para el equipo mobile

Si necesitan una regla única para implementar:

- Crear una sola lista por hogar con nombre editable.
- Agregar y marcar ítems dentro de esa lista.
- Cuando el usuario termine la compra, enviar `finalize`.
- El backend guarda solo el lote de ítems en `history`.
- La lista sigue existiendo y se reinicia con `items` vacío.

