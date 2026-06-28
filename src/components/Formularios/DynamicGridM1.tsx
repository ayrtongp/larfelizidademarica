import React from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

export interface DGColumn {
  key: string;
  label: string;
  placeholder?: string;
  fullWidth?: boolean; // ocupa a largura total da linha
}

interface Props {
  columns: DGColumn[];
  rows: Record<string, string>[];
  onChange: (rows: Record<string, string>[]) => void;
  disabled?: boolean;
  addLabel?: string;
  emptyMessage?: string;
  rowLabel?: string;
  createRow?: () => Record<string, string>;
  renderRowMeta?: (row: Record<string, string>) => React.ReactNode;
}

const emptyRow = (columns: DGColumn[]): Record<string, string> =>
  columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {});

const DynamicGridM1: React.FC<Props> = ({
  columns,
  rows,
  onChange,
  disabled = false,
  addLabel = 'Adicionar linha',
  emptyMessage = 'Nenhum registro adicionado.',
  rowLabel = 'Item',
  createRow,
  renderRowMeta,
}) => {
  const addRow = () => onChange([...rows, createRow ? createRow() : emptyRow(columns)]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const handleChange = (i: number, key: string, value: string) =>
    onChange(rows.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-sm text-gray-400 italic text-center py-3 border border-dashed border-gray-200 rounded-md">
          {emptyMessage}
        </p>
      )}

      {rows.map((row, index) => (
        <div key={index} className="border border-gray-200 rounded-md p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-500">
                {rowLabel} #{index + 1}
              </span>
              {renderRowMeta && (
                <span className="text-[11px] text-gray-400 mt-0.5">
                  {renderRowMeta(row)}
                </span>
              )}
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="text-red-400 hover:text-red-600 transition"
                title="Remover"
              >
                <FaTrash size={12} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {columns.map(col => (
              <div key={col.key} className={col.fullWidth ? 'sm:col-span-2' : ''}>
                <label className="block text-xs text-gray-500 mb-0.5">{col.label}</label>
                <input
                  type="text"
                  value={row[col.key] || ''}
                  placeholder={col.placeholder}
                  disabled={disabled}
                  onChange={e => handleChange(index, col.key, e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-purple-400 bg-white"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {!disabled && (
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium mt-1"
        >
          <FaPlus size={11} /> {addLabel}
        </button>
      )}
    </div>
  );
};

export default DynamicGridM1;
