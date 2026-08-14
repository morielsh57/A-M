import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../../../app/store';
import {
  getProductAutocomplete,
  getProductAutocompleteCacheKey,
} from '../../../../../components/product-page/product.store';
import { EAPIStatus } from '../../../../api/models';
import {
  canRequestAutocomplete,
  normalizeSearchQuery,
  SEARCH_AUTOCOMPLETE_DEBOUNCE_MS,
  SEARCH_AUTOCOMPLETE_LIMIT,
} from '../searchInput.utils';

export const useSearchAutocomplete = (searchValue: string, isFocused: boolean) => {
  const dispatch = useAppDispatch();
  const { productAutocompleteBySearchReq } = useAppSelector((store) => store.productPageStoreReducer);
  const [debouncedSearchValue, setDebouncedSearchValue] = React.useState(searchValue);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const normalizedSearchValue = normalizeSearchQuery(searchValue);
  const normalizedDebouncedSearchValue = normalizeSearchQuery(debouncedSearchValue);

  const requestParams = React.useMemo(() => (
    canRequestAutocomplete(normalizedDebouncedSearchValue)
      ? { search: normalizedDebouncedSearchValue, limit: SEARCH_AUTOCOMPLETE_LIMIT }
      : undefined
  ), [normalizedDebouncedSearchValue]);
  const requestKey = requestParams ? getProductAutocompleteCacheKey(requestParams) : undefined;
  const autocompleteReq = requestKey ? productAutocompleteBySearchReq[requestKey] : undefined;
  const items = autocompleteReq?.data || [];
  const isLoading = autocompleteReq?.status === EAPIStatus.PENDING;
  const shouldShow = (
    isFocused
    && canRequestAutocomplete(normalizedSearchValue)
    && normalizedSearchValue === normalizedDebouncedSearchValue
    && (!!autocompleteReq || isLoading)
  );

  React.useEffect(() => {
    const debounceTimerId = window.setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, SEARCH_AUTOCOMPLETE_DEBOUNCE_MS);

    return () => window.clearTimeout(debounceTimerId);
  }, [searchValue]);

  React.useEffect(() => {
    setActiveIndex(-1);
  }, [normalizedSearchValue]);

  React.useEffect(() => {
    if (!requestParams || autocompleteReq) {
      return;
    }

    dispatch(getProductAutocomplete(requestParams));
  }, [autocompleteReq, dispatch, requestParams]);

  const activateNext = () => {
    setActiveIndex((currentIndex) => (
      currentIndex >= items.length - 1 ? 0 : currentIndex + 1
    ));
  };

  const activatePrevious = () => {
    setActiveIndex((currentIndex) => (
      currentIndex <= 0 ? items.length - 1 : currentIndex - 1
    ));
  };

  return {
    activeIndex,
    activeItem: activeIndex >= 0 ? items[activeIndex] : undefined,
    isLoading,
    items,
    normalizedSearchValue,
    shouldShow,
    activateNext,
    activatePrevious,
  };
};
