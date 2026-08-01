# Cooperativa — Frontend de Pólizas

Frontend de una sola pantalla para simular la contratación de pólizas de inversión a
plazo fijo y que el departamento comercial haga seguimiento a sus clientes. React 18 +
Vite + TailwindCSS, sin router ni autenticación (consume la API abierta del backend).

## Estructura

```
src/
  api/          cliente HTTP (fetch) y servicios por dominio (clienteService, polizaService)
  utils/        formato de moneda, porcentaje y fecha
  App.jsx       toda la vista: clientes, simular/contratar y listado de pólizas con acciones
  main.jsx      punto de entrada
```

## Puesta en marcha

1. Instalar dependencias:
   ```
   npm install
   ```
2. Copiar `.env.example` a `.env` y ajustar `VITE_API_URL` si el backend no corre en `http://localhost:5000`.
3. Ejecutar en desarrollo (puerto 3000, con proxy a `/api` hacia el backend):
   ```
   npm run dev
   ```

Requiere que el backend (`cooperativa-polizas-backend`, ver `../back`) esté corriendo.
