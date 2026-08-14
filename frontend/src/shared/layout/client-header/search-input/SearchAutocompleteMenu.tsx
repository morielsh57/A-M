import React from 'react';
import type { IProductAutocompleteItem } from '../../../../components/product-page/product.types';
import './SearchAutocompleteMenu.scss';

interface SearchAutocompleteMenuProps {
  activeIndex: number;
  isLoading: boolean;
  items: IProductAutocompleteItem[];
  query: string;
  onSelect: (item: IProductAutocompleteItem) => void;
}

const SearchAutocompleteMenu: React.FC<SearchAutocompleteMenuProps> = ({
  activeIndex,
  isLoading,
  items,
  onSelect,
  query,
}) => {
  if (isLoading) {
    return (
      <div className="search-autocomplete-menu">
        <p className="search-autocomplete-menu__status">Searching...</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="search-autocomplete-menu">
        <p className="search-autocomplete-menu__status">No quick matches for "{query}".</p>
      </div>
    );
  }

  return (
    <div className="search-autocomplete-menu" role="listbox">
      <ul className="search-autocomplete-menu__list">
        {items.map((item, index) => (
          <li key={String(item.product_id)}>
            <button
              aria-selected={index === activeIndex}
              className={[
                'search-autocomplete-menu__button',
                index === activeIndex ? 'search-autocomplete-menu__button--active' : '',
              ].filter(Boolean).join(' ')}
              id={`search-autocomplete-option-${item.product_id}`}
              role="option"
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(item)}
            >
              <span className="search-autocomplete-menu__name">{item.name}</span>
              <span className="search-autocomplete-menu__catalog">{item.catalog_number}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchAutocompleteMenu;
