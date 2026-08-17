import React, { useEffect, useRef, useState } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { useToasts } from 'react-toast-notifications';
import './ProductCartQuantityDropdown.scss';

interface ProductCartQuantityDropdownProps {
  availableQuantity: number;
  productName: string;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

const VISIBLE_OPTIONS_COUNT = 5;
const OPTION_HEIGHT = 36;
const OPTIONS_VERTICAL_PADDING = 14;
const INPUT_HEIGHT = 40;

const getVerticalScrollParent = (element?: HTMLElement | null): HTMLElement | undefined => {
  let parentElement = element?.parentElement;

  while (parentElement) {
    const overflowY = window.getComputedStyle(parentElement).overflowY;

    if (['auto', 'scroll'].includes(overflowY) && parentElement.scrollHeight > parentElement.clientHeight) {
      return parentElement;
    }

    parentElement = parentElement.parentElement;
  }

  return undefined;
};

const ProductCartQuantityDropdown: React.FC<ProductCartQuantityDropdownProps> = ({
  availableQuantity,
  productName,
  quantity,
  onQuantityChange,
}) => {
  const { addToast } = useToasts();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasShownMaxQuantityToastRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [shouldOpenAbove, setShouldOpenAbove] = useState(false);
  const [customQuantity, setCustomQuantity] = useState('');
  const shouldShowCustomQuantityInput = availableQuantity > 5;
  const quantityOptions = Array.from(
    { length: availableQuantity },
    (_, index) => index + 1,
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDownOutside = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside, true);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside, true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !optionsRef.current) return;

    const selectedOptionIndex = quantityOptions.findIndex((quantityOption) => quantityOption === quantity);
    if (selectedOptionIndex < 0) return;

    optionsRef.current.scrollTop = Math.max(selectedOptionIndex - 1, 0) * OPTION_HEIGHT;
  }, [isOpen, quantity, quantityOptions]);

  const showMaxQuantityToast = () => {
    if (hasShownMaxQuantityToastRef.current) return;

    addToast(`Only ${availableQuantity} available in stock.`, {
      appearance: 'error',
      autoDismiss: true,
    });
    hasShownMaxQuantityToastRef.current = true;
  };

  const selectQuantity = (nextQuantity: number) => {
    setIsOpen(false);
    setCustomQuantity('');
    hasShownMaxQuantityToastRef.current = false;

    if (nextQuantity > availableQuantity) {
      showMaxQuantityToast();
      if (availableQuantity !== quantity) {
        onQuantityChange(availableQuantity);
      }
      return;
    }

    if (nextQuantity === quantity) return;
    onQuantityChange(nextQuantity);
  };

  const submitCustomQuantity = () => {
    const requestedQuantity = Number(customQuantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) return;
    selectQuantity(requestedQuantity);
  };

  const handleCustomQuantityChange = (value: string) => {
    if (value === '') {
      setCustomQuantity('');
      hasShownMaxQuantityToastRef.current = false;
      return;
    }

    const requestedQuantity = Number(value);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) return;

    if (requestedQuantity > availableQuantity) {
      setCustomQuantity(String(availableQuantity));
      showMaxQuantityToast();
      window.requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }

    hasShownMaxQuantityToastRef.current = false;
    setCustomQuantity(value);
  };

  const openDropdown = () => {
    const triggerRect = dropdownRef.current?.getBoundingClientRect();
    const menuGap = 10;
    const visibleOptionsCount = Math.min(quantityOptions.length, VISIBLE_OPTIONS_COUNT);
    const inputHeight = shouldShowCustomQuantityInput ? INPUT_HEIGHT : 0;
    const menuHeight = (visibleOptionsCount * OPTION_HEIGHT) + OPTIONS_VERTICAL_PADDING + inputHeight;
    const scrollParentRect = getVerticalScrollParent(dropdownRef.current)?.getBoundingClientRect();
    const visibleAreaBottom = scrollParentRect?.bottom ?? window.innerHeight;
    const availableSpaceBelow = triggerRect
      ? visibleAreaBottom - triggerRect.bottom - menuGap
      : Number.POSITIVE_INFINITY;

    setShouldOpenAbove(availableSpaceBelow < menuHeight);
    setIsOpen(true);
  };

  const toggleDropdown = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    openDropdown();
  };

  return (
    <div className="product-cart-quantity-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="product-cart-quantity-dropdown__trigger"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Select quantity for ${productName}`}
      >
        <DownOutlined />
        <span>{quantity}</span>
      </button>

      {isOpen && (
        <div
          className={[
            'product-cart-quantity-dropdown__menu',
            shouldOpenAbove ? 'product-cart-quantity-dropdown__menu--above' : '',
          ].filter(Boolean).join(' ')}
          role="listbox"
        >
          <div className="product-cart-quantity-dropdown__options" ref={optionsRef}>
            {quantityOptions.map((quantityOption) => (
              <button
                key={quantityOption}
                type="button"
                className={[
                  'product-cart-quantity-dropdown__option',
                  quantityOption === quantity ? 'product-cart-quantity-dropdown__option--selected' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => selectQuantity(quantityOption)}
                role="option"
                aria-selected={quantityOption === quantity}
              >
                <span>{quantityOption}</span>
                {quantityOption === availableQuantity && (
                  <span className="product-cart-quantity-dropdown__max-label">max</span>
                )}
              </button>
            ))}
          </div>

          {shouldShowCustomQuantityInput && (
            <input
              ref={inputRef}
              className="product-cart-quantity-dropdown__input"
              type="number"
              min={1}
              value={customQuantity}
              placeholder="Enter Qty"
              onChange={(event) => handleCustomQuantityChange(event.target.value)}
              onBlur={submitCustomQuantity}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  submitCustomQuantity();
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ProductCartQuantityDropdown;
