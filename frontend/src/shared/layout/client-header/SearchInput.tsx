import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { searchIcon } from '../../../components/util/iconsFunc';

type SearchInputProps = {
  view: 'mobile' | 'desktop';
};

const SearchInput: React.FC<SearchInputProps> = ({ view }) => {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement | null>(null);

  const goToSearch = () => {
    const query = searchRef.current?.value?.trim();
    if (!query) return;
    // TODO: create search page to load and display the search results based on the query parameter
    // navigate(`${APP_ROUTING_PATHS.APP_SEARCH_PAGE}?q=${query}`);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      goToSearch();
    }
  };

  const wrapperClassName =
    view === 'mobile'
      ? 'd-md-none d-block text-end my-2 me-3'
      : 'd-md-flex d-none my-3 my-md-0 justify-content-center';

  return (
    <div className={wrapperClassName}>
      <input
        ref={searchRef}
        onKeyDown={handleSearchKeyDown}
        type="search"
        className="search-input"
        placeholder="What's your favorite?"
      />
      <button onClick={goToSearch} className="btn-search" type="button">
        {searchIcon()}
      </button>
    </div>
  );
};

export default SearchInput;
