import React from 'react';
import Pagination from '@mui/material/Pagination';
import './AppPagination.scss';

interface AppPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const AppPagination: React.FC<AppPaginationProps> = ({
  page,
  pageSize,
  totalItems,
  onPageChange,
}) => {
  const pages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="app-pagination">
      <Pagination
        count={pages}
        page={page}
        onChange={(_, nextPage) => onPageChange(nextPage)}
        color="primary"
        shape="rounded"
      />
    </div>
  );
};

export default AppPagination;
