import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchIcon } from '../../../../components/util/iconsFunc';
import type { IProductAutocompleteItem } from '../../../../components/product-page/product.types';
import {
  getSearchPagePath,
  normalizeSearchQuery,
} from './searchInput.utils';
import { useSearchAutocomplete } from './hooks/useSearchAutocomplete';
import SearchAutocompleteMenu from './SearchAutocompleteMenu';
import './SearchInput.scss';

type SearchInputProps = {
  view: 'mobile' | 'desktop';
};

const SearchInput: React.FC<SearchInputProps> = ({ view }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeSearchQuery = searchParams.get('q') || '';
  const [searchValue, setSearchValue] = useState(routeSearchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const autocomplete = useSearchAutocomplete(searchValue, isFocused);

  useEffect(() => {
    setSearchValue(routeSearchQuery);
  }, [routeSearchQuery]);

  const navigateToSearch = (query: string) => {
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) return;
    setIsFocused(false);
    searchInputRef.current?.blur();
    navigate(getSearchPagePath(normalizedQuery));
  };

  const handleAutocompleteSelect = (item: IProductAutocompleteItem) => {
    setSearchValue(item.name);
    navigateToSearch(item.name);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (autocomplete.shouldShow && autocomplete.items.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        autocomplete.activateNext();
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        autocomplete.activatePrevious();
        return;
      }

      if ((event.key === 'Enter' || event.key === ' ') && autocomplete.activeItem) {
        event.preventDefault();
        handleAutocompleteSelect(autocomplete.activeItem);
        return;
      }
    }

    if (event.key === 'Enter') {
      navigateToSearch(searchValue);
    }
  };

  const baseWrapperClassName = 'client-search';

  const wrapperClassName =
    view === 'mobile'
      ? `${baseWrapperClassName} d-md-none d-block text-end my-2 me-3`
      : `${baseWrapperClassName} d-md-flex d-none my-3 my-md-0 justify-content-center`;

  return (
    <div className={wrapperClassName}>
      <input
        ref={searchInputRef}
        aria-activedescendant={
          autocomplete.activeItem
            ? `search-autocomplete-option-${autocomplete.activeItem.product_id}`
            : undefined
        }
        aria-autocomplete="list"
        aria-expanded={autocomplete.shouldShow}
        className="search-input"
        placeholder="What's your favorite?"
        role="combobox"
        type="search"
        value={searchValue}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
        onChange={(event) => setSearchValue(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleSearchKeyDown}
      />
      <button onClick={() => navigateToSearch(searchValue)} className="btn-search" type="button">
        {searchIcon()}
      </button>
      {autocomplete.shouldShow && (
        <SearchAutocompleteMenu
          activeIndex={autocomplete.activeIndex}
          isLoading={autocomplete.isLoading}
          items={autocomplete.items}
          query={autocomplete.normalizedSearchValue}
          onSelect={handleAutocompleteSelect}
        />
      )}
    </div>
  );
};

export default SearchInput;
