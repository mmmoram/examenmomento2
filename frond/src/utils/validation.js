const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,15}$/;

export function validateCliente({ nombre, documento, email, telefono }) {
  const errors = {};
  if (!nombre.trim()) errors.nombre = 'El nombre es obligatorio';
  if (!documento.trim()) errors.documento = 'El documento es obligatorio';
  if (email && !EMAIL_RE.test(email.trim())) errors.email = 'Ingresá un email válido';
  if (telefono && !PHONE_RE.test(telefono.trim())) errors.telefono = 'Ingresá un teléfono válido';
  return errors;
}

export function validateCapitalPlazo({ clienteId, capital, plazoDias }, { requireCliente = false } = {}) {
  const errors = {};
  if (requireCliente && !clienteId) errors.clienteId = 'Seleccioná un cliente';
  if (capital === '' || capital === null || capital === undefined) {
    errors.capital = 'El capital es obligatorio';
  } else if (Number.isNaN(Number(capital)) || Number(capital) < 500) {
    errors.capital = 'El capital debe ser un número mayor o igual a 500';
  }
  if (plazoDias === '' || plazoDias === null || plazoDias === undefined) {
    errors.plazoDias = 'El plazo es obligatorio';
  } else if (!Number.isInteger(Number(plazoDias)) || Number(plazoDias) < 30 || Number(plazoDias) > 720) {
    errors.plazoDias = 'El plazo debe ser un entero entre 30 y 720 días';
  }
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
