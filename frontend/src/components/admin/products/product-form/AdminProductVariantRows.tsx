import React from 'react';
import AppButton from '../../../../shared/components/app-button/AppButton';
import type { AdminProductVariantFormRow, AdminProductVariantRowError } from './adminProductForm.types';
import { createEmptyVariantRow } from './adminProductForm.utils';
import AdminProductVariantRow from './AdminProductVariantRow';

interface AdminProductVariantRowsProps {
  errors: Record<string, AdminProductVariantRowError>;
  rows: AdminProductVariantFormRow[];
  onChange: (rows: AdminProductVariantFormRow[]) => void;
}

const AdminProductVariantRows: React.FC<AdminProductVariantRowsProps> = ({
  errors,
  onChange,
  rows,
}) => {
  const [expandedRowIds, setExpandedRowIds] = React.useState<Set<string>>(
    () => new Set(rows.map((row) => row.localId)),
  );
  const [newlyAddedRowId, setNewlyAddedRowId] = React.useState<string>();
  const newRowElementRef = React.useRef<HTMLElement | null>(null);
  const newRowColorInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setExpandedRowIds((currentExpandedRowIds) => {
      const rowIds = new Set(rows.map((row) => row.localId));
      const nextExpandedRowIds = new Set(
        Array.from(currentExpandedRowIds).filter((rowId) => rowIds.has(rowId)),
      );

      rows.forEach((row) => {
        if (!currentExpandedRowIds.has(row.localId) && row.variant_id === undefined) {
          nextExpandedRowIds.add(row.localId);
        }
      });

      return nextExpandedRowIds;
    });
  }, [rows]);

  React.useEffect(() => {
    if (!newlyAddedRowId) {
      return;
    }

    let firstFrameId = 0;
    let secondFrameId = 0;

    firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        const newRowElement = newRowElementRef.current;
        const scrollContainer = newRowElement?.closest('.admin-form-drawer__content');

        if (newRowElement && scrollContainer instanceof HTMLElement) {
          const rowRect = newRowElement.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();

          scrollContainer.scrollTo({
            behavior: 'smooth',
            top: scrollContainer.scrollTop + rowRect.top - containerRect.top,
          });
        } else {
          newRowElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }

        newRowColorInputRef.current?.focus({ preventScroll: true });
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
    };
  }, [newlyAddedRowId]);

  const updateRow = (index: number, row: AdminProductVariantFormRow) => {
    onChange(rows.map((item, itemIndex) => (itemIndex === index ? row : item)));
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
      onChange([createEmptyVariantRow()]);
      return;
    }

    onChange(rows.filter((_, itemIndex) => itemIndex !== index));
  };

  const toggleRow = (rowId: string) => {
    setExpandedRowIds((currentExpandedRowIds) => {
      const nextExpandedRowIds = new Set(currentExpandedRowIds);

      if (nextExpandedRowIds.has(rowId)) {
        nextExpandedRowIds.delete(rowId);
      } else {
        nextExpandedRowIds.add(rowId);
      }

      return nextExpandedRowIds;
    });
  };

  const addVariantRow = () => {
    const nextRow = createEmptyVariantRow();
    setExpandedRowIds((currentExpandedRowIds) => new Set(currentExpandedRowIds).add(nextRow.localId));
    setNewlyAddedRowId(nextRow.localId);
    onChange([...rows, nextRow]);
  };

  return (
    <section className="admin-form__section">
      <div className="admin-product-form__section-header">
        <h3 className="admin-form__section-title">Variants</h3>
      </div>

      <div className="admin-product-form__variant-list">
        {rows.map((row, index) => (
          <div
            key={row.localId}
            ref={(element) => {
              if (row.localId === newlyAddedRowId) {
                newRowElementRef.current = element;
              }
            }}
          >
            <AdminProductVariantRow
              colorInputRef={row.localId === newlyAddedRowId ? newRowColorInputRef : undefined}
              error={errors[row.localId]}
              index={index}
              isExpanded={expandedRowIds.has(row.localId)}
              isNewlyAdded={row.localId === newlyAddedRowId}
              row={row}
              onChange={(nextRow) => updateRow(index, nextRow)}
              onRemove={() => removeRow(index)}
              onToggle={() => toggleRow(row.localId)}
            />
          </div>
        ))}
      </div>

      <AppButton
        className="admin-product-form__add-variant-button"
        type="button"
        variant="secondary"
        onClick={addVariantRow}
      >
        Add variant
      </AppButton>
    </section>
  );
};

export default AdminProductVariantRows;
