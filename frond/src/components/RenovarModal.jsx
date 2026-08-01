import { useState } from 'react';
import Modal from './Modal';
import FormField, { inputClass } from './FormField';
import { validateCapitalPlazo, hasErrors } from '../utils/validation';

export default function RenovarModal({ onClose, onConfirm }) {
  const [capital, setCapital] = useState('');
  const [plazoDias, setPlazoDias] = useState('');
  const [errors, setErrors] = useState({});
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validateCapitalPlazo({ capital, plazoDias });
    setErrors(validation);
    if (hasErrors(validation)) return;

    setEnviando(true);
    try {
      await onConfirm({ capital: Number(capital), plazoDias: Number(plazoDias) });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal title="Renovar póliza" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormField label="Nuevo capital (USD)" error={errors.capital}>
          <input
            className={inputClass(errors.capital)}
            type="number"
            step="0.01"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            autoFocus
          />
        </FormField>
        <FormField label="Nuevo plazo (días)" error={errors.plazoDias}>
          <input
            className={inputClass(errors.plazoDias)}
            type="number"
            value={plazoDias}
            onChange={(e) => setPlazoDias(e.target.value)}
          />
        </FormField>
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {enviando ? 'Renovando…' : 'Confirmar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
