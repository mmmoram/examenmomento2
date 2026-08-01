import { useEffect, useState } from 'react';
import { listarClientes, crearCliente } from './api/clienteService';
import { listarPolizas, simularPoliza, contratarPoliza, cancelarPoliza, renovarPoliza } from './api/polizaService';
import { formatMoney, formatPercent, formatDate } from './utils/format';
import { validateCliente, validateCapitalPlazo, hasErrors } from './utils/validation';
import FormField, { inputClass } from './components/FormField';
import EstadoBadge from './components/EstadoBadge';
import RenovarModal from './components/RenovarModal';

const CLIENTE_INICIAL = { nombre: '', documento: '', email: '', telefono: '', tieneObligacionesPendientes: false };

export default function App() {
  const [clientes, setClientes] = useState([]);
  const [polizas, setPolizas] = useState([]);

  const [clienteForm, setClienteForm] = useState(CLIENTE_INICIAL);
  const [clienteErrors, setClienteErrors] = useState({});
  const [creandoCliente, setCreandoCliente] = useState(false);

  const [clienteId, setClienteId] = useState('');
  const [capital, setCapital] = useState('');
  const [plazoDias, setPlazoDias] = useState('');
  const [polizaErrors, setPolizaErrors] = useState({});
  const [simulando, setSimulando] = useState(false);
  const [contratando, setContratando] = useState(false);
  const [simulacion, setSimulacion] = useState(null);

  const [renovarId, setRenovarId] = useState(null);
  const [error, setError] = useState('');

  function cargarClientes() {
    listarClientes().then((d) => setClientes(d.clientes)).catch((e) => setError(e.message));
  }

  function cargarPolizas() {
    listarPolizas().then((d) => setPolizas(d.polizas)).catch((e) => setError(e.message));
  }

  useEffect(() => {
    cargarClientes();
    cargarPolizas();
  }, []);

  function updateClienteForm(campo, valor) {
    setClienteForm((f) => ({ ...f, [campo]: valor }));
    setClienteErrors((errs) => ({ ...errs, [campo]: undefined }));
  }

  async function handleCrearCliente(e) {
    e.preventDefault();
    setError('');
    const validation = validateCliente(clienteForm);
    setClienteErrors(validation);
    if (hasErrors(validation)) return;

    setCreandoCliente(true);
    try {
      await crearCliente(clienteForm);
      setClienteForm(CLIENTE_INICIAL);
      cargarClientes();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreandoCliente(false);
    }
  }

  async function handleSimular(e) {
    e.preventDefault();
    setError('');
    setSimulacion(null);
    const validation = validateCapitalPlazo({ clienteId, capital, plazoDias }, { requireCliente: true });
    setPolizaErrors(validation);
    if (hasErrors(validation)) return;

    setSimulando(true);
    try {
      const data = await simularPoliza({ capital: Number(capital), plazoDias: Number(plazoDias) });
      setSimulacion(data.simulacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setSimulando(false);
    }
  }

  async function handleContratar() {
    setError('');
    setContratando(true);
    try {
      await contratarPoliza({ clienteId, capital: Number(capital), plazoDias: Number(plazoDias) });
      setSimulacion(null);
      setCapital('');
      setPlazoDias('');
      cargarPolizas();
    } catch (err) {
      setError(err.message);
    } finally {
      setContratando(false);
    }
  }

  async function handleCancelar(id) {
    setError('');
    try {
      await cancelarPoliza(id);
      cargarPolizas();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConfirmarRenovacion({ capital: nuevoCapital, plazoDias: nuevoPlazo }) {
    setError('');
    try {
      await renovarPoliza(renovarId, { capital: nuevoCapital, plazoDias: nuevoPlazo });
      setRenovarId(null);
      cargarPolizas();
    } catch (err) {
      setError(err.message);
    }
  }

  function nombreCliente(id) {
    return clientes.find((c) => c.id === id)?.nombre || '—';
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-800">Pólizas de inversión</h1>
          <p className="text-sm text-slate-500">Cooperativa de ahorro y crédito · plazo fijo</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {error && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-medium text-red-500 hover:text-red-700">
              ✕
            </button>
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Clientes</h2>

          <form onSubmit={handleCrearCliente} className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FormField label="Nombre" error={clienteErrors.nombre}>
              <input
                className={inputClass(clienteErrors.nombre)}
                placeholder="Nombre completo"
                value={clienteForm.nombre}
                onChange={(e) => updateClienteForm('nombre', e.target.value)}
              />
            </FormField>
            <FormField label="Documento" error={clienteErrors.documento}>
              <input
                className={inputClass(clienteErrors.documento)}
                placeholder="Cédula / RUC"
                value={clienteForm.documento}
                onChange={(e) => updateClienteForm('documento', e.target.value)}
              />
            </FormField>
            <FormField label="Email" error={clienteErrors.email}>
              <input
                className={inputClass(clienteErrors.email)}
                placeholder="correo@ejemplo.com"
                value={clienteForm.email}
                onChange={(e) => updateClienteForm('email', e.target.value)}
              />
            </FormField>
            <FormField label="Teléfono" error={clienteErrors.telefono}>
              <input
                className={inputClass(clienteErrors.telefono)}
                placeholder="0999999999"
                value={clienteForm.telefono}
                onChange={(e) => updateClienteForm('telefono', e.target.value)}
              />
            </FormField>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-200"
                  checked={clienteForm.tieneObligacionesPendientes}
                  onChange={(e) => updateClienteForm('tieneObligacionesPendientes', e.target.checked)}
                />
                Obligaciones pendientes
              </label>
              <button
                type="submit"
                disabled={creandoCliente}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {creandoCliente ? 'Registrando…' : 'Registrar'}
              </button>
            </div>
          </form>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Documento</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Obligaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">
                      Sin clientes registrados
                    </td>
                  </tr>
                )}
                {clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-700">{c.nombre}</td>
                    <td className="p-3 text-slate-500">{c.documento}</td>
                    <td className="p-3 text-slate-500">{c.email || '—'}</td>
                    <td className="p-3">
                      {c.tieneObligacionesPendientes ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Sí
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Simular / contratar póliza</h2>

          <form onSubmit={handleSimular} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Cliente" error={polizaErrors.clienteId}>
              <select
                className={inputClass(polizaErrors.clienteId)}
                value={clienteId}
                onChange={(e) => {
                  setClienteId(e.target.value);
                  setPolizaErrors((errs) => ({ ...errs, clienteId: undefined }));
                }}
              >
                <option value="">Seleccioná un cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Capital (USD)" error={polizaErrors.capital}>
              <input
                className={inputClass(polizaErrors.capital)}
                type="number"
                step="0.01"
                placeholder="Mín. 500"
                value={capital}
                onChange={(e) => {
                  setCapital(e.target.value);
                  setPolizaErrors((errs) => ({ ...errs, capital: undefined }));
                }}
              />
            </FormField>
            <FormField label="Plazo (días)" error={polizaErrors.plazoDias}>
              <input
                className={inputClass(polizaErrors.plazoDias)}
                type="number"
                placeholder="30 a 720"
                value={plazoDias}
                onChange={(e) => {
                  setPlazoDias(e.target.value);
                  setPolizaErrors((errs) => ({ ...errs, plazoDias: undefined }));
                }}
              />
            </FormField>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={simulando}
                className="w-full rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {simulando ? 'Simulando…' : 'Simular'}
              </button>
            </div>
          </form>

          {simulacion && (
            <div className="mt-5 rounded-lg border border-primary-100 bg-primary-50 p-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-700 sm:grid-cols-3">
                <p><span className="text-slate-500">Tasa aplicada:</span> {formatPercent(simulacion.tasaAplicada)}</p>
                <p><span className="text-slate-500">Interés bruto:</span> {formatMoney(simulacion.interesBruto)}</p>
                <p><span className="text-slate-500">Retención:</span> {formatMoney(simulacion.valorRetencion)}</p>
                <p><span className="text-slate-500">Interés neto:</span> {formatMoney(simulacion.interesNeto)}</p>
                <p><span className="text-slate-500">Monto vencimiento:</span> {formatMoney(simulacion.montoVencimiento)}</p>
                <p><span className="text-slate-500">Rentabilidad:</span> {simulacion.rentabilidadPeriodo.toFixed(2)}%</p>
                {simulacion.interesMensualEstimado != null && (
                  <p><span className="text-slate-500">Interés mensual:</span> {formatMoney(simulacion.interesMensualEstimado)}</p>
                )}
                <p className="col-span-2 sm:col-span-3">
                  <span className="text-slate-500">Vencimiento:</span> {formatDate(simulacion.fechaVencimiento)}
                  {simulacion.advertenciaDiaNoLaborable && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Cae en fin de semana
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={handleContratar}
                disabled={contratando}
                className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {contratando ? 'Contratando…' : 'Contratar'}
              </button>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Pólizas</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Capital</th>
                  <th className="p-3">Plazo</th>
                  <th className="p-3">Tasa</th>
                  <th className="p-3">Vencimiento</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {polizas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">
                      Sin pólizas registradas
                    </td>
                  </tr>
                )}
                {polizas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-700">{nombreCliente(p.clienteId)}</td>
                    <td className="p-3 text-slate-600">{formatMoney(p.capital)}</td>
                    <td className="p-3 text-slate-600">{p.plazoDias} días</td>
                    <td className="p-3 text-slate-600">{formatPercent(p.tasaAplicada)}</td>
                    <td className="p-3 text-slate-600">{formatDate(p.fechaVencimiento)}</td>
                    <td className="p-3">
                      <EstadoBadge estado={p.estado} />
                    </td>
                    <td className="p-3 text-right">
                      {p.estado === 'ACTIVA' && (
                        <button
                          onClick={() => handleCancelar(p.id)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Cancelar
                        </button>
                      )}
                      {p.estado === 'VENCIDA' && (
                        <button
                          onClick={() => setRenovarId(p.id)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                        >
                          Renovar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {renovarId && (
        <RenovarModal onClose={() => setRenovarId(null)} onConfirm={handleConfirmarRenovacion} />
      )}
    </div>
  );
}
