import request from './client';

export function simularPoliza(datos) {
  return request('/polizas/simular', { method: 'POST', body: datos });
}

export function contratarPoliza(datos) {
  return request('/polizas', { method: 'POST', body: datos });
}

export function listarPolizas() {
  return request('/polizas');
}

export function obtenerPoliza(id) {
  return request(`/polizas/${id}`);
}

export function cancelarPoliza(id) {
  return request(`/polizas/${id}/cancelar`, { method: 'POST', body: {} });
}

export function renovarPoliza(id, datos) {
  return request(`/polizas/${id}/renovar`, { method: 'POST', body: datos });
}
