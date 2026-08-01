# Backend — Simulador de Pólizas de Inversión (Cooperativa)

Backend para que una cooperativa de ahorro y crédito simule la contratación de pólizas
de inversión a plazo fijo y el departamento comercial haga seguimiento a sus clientes.
Node.js + Express, Sequelize (PostgreSQL). Sin autenticación: API abierta de uso interno.

## Estructura

```
src/
  modules/
    polizas/
      calculo.js               Reglas de negocio y fórmulas de cálculo de pólizas
      models.js                 Modelos Sequelize (Cliente, Poliza)
      routes.js                 Rutas, controladores y validaciones Express
  shared/
    config/                    env, conexión Sequelize
    middlewares/                errorHandler
    utils/                      AppError, dateUtils
  app.js                       configuración de Express
  server.js                    punto de entrada
scripts/
  seed.js                      carga clientes y pólizas de prueba
```

## Reglas de negocio implementadas

- **Tasa por plazo**: 30-59 días 5,00% · 60-89 días 5,50% · 90-179 días 6,00% ·
  180-359 días 6,50% · 360-539 días 7,00% · 540-720 días 7,50%.
- **Bonificación por monto**: 0,00% / 0,15% / 0,30% / 0,45% / 0,60% según el capital invertido.
- **Bonificación por renovación** (+0,20 pp): solo si la póliza anterior está vencida,
  el capital se mantiene o aumenta, la renovación ocurre dentro de los 5 días posteriores
  al vencimiento y el cliente no tiene obligaciones pendientes.
- **Tasa aplicada**: `min(tasaBase + bonificaciones, 8,00%)`.
- Interés bruto, retención (2%), interés neto, monto al vencimiento, rentabilidad del
  período e interés mensual estimado (solo si el plazo es múltiplo de 30 y ≥ 180 días).
- **Cancelación anticipada**: interés al 1% anualizado sobre días transcurridos, cargo
  administrativo del 0,5% y retención sobre ese interés; el valor entregado nunca es negativo.
- **Fecha de vencimiento** = fecha de inicio + plazo en días; se marca con una advertencia
  informativa si cae en fin de semana (no se recalcula automáticamente).

Toda la lógica de cálculo vive en [`src/modules/polizas/calculo.js`](src/modules/polizas/calculo.js).

## Puesta en marcha

1. Instalar dependencias:
   ```
   npm install
   ```
2. Copiar `.env.example` a `.env` y ajustar credenciales de PostgreSQL. También podés
   usar `setup-db-local.ps1` (como Administrador) para instalar PostgreSQL localmente.
3. Ejecutar en desarrollo (Sequelize crea las tablas automáticamente):
   ```
   npm run dev
   ```
4. Opcional: cargar datos de prueba (3 clientes y 3 pólizas, una ya vencida):
   ```
   npm run seed
   ```

## Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Verifica que el servicio está activo |
| POST | `/api/clientes` | Registra un cliente |
| GET | `/api/clientes` | Lista los clientes |
| GET | `/api/clientes/:id` | Detalle de un cliente con sus pólizas (seguimiento comercial) |
| POST | `/api/polizas/simular` | Simula una póliza sin contratarla (`capital`, `plazoDias`) |
| POST | `/api/polizas` | Contrata una póliza (`clienteId`, `capital`, `plazoDias`) |
| GET | `/api/polizas` | Lista todas las pólizas |
| GET | `/api/polizas/:id` | Detalle de una póliza |
| POST | `/api/polizas/:id/cancelar` | Cancelación anticipada (`fecha` opcional) |
| POST | `/api/polizas/:id/renovar` | Renueva una póliza vencida (`capital`, `plazoDias`) |

### Ejemplo: simular una póliza

```json
POST /api/polizas/simular
{
  "capital": 12000,
  "plazoDias": 180
}
```

### Ejemplo: contratar una póliza

```json
POST /api/polizas
{
  "clienteId": "0f2a...",
  "capital": 12000,
  "plazoDias": 180
}
```
