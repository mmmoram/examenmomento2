import request from './client';

export function listarClientes() {
  return request('/clientes');
}

export function obtenerCliente(id) {
  return request(`/clientes/${id}`);
}

export function crearCliente(datos) {
  return request('/clientes', { method: 'POST', body: datos });
}
