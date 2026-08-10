import React from 'react';
import AppSelect, { type IAppSelectOption } from '../app-select/AppSelect';

interface AdminFormSelectProps {
  disabled?: boolean;
  id?: string;
  options: IAppSelectOption[];
  placeholder?: string;
  searchSelect?: boolean;
  value?: string | number | null;
  onBlur?: () => void;
  onChange: (value: string | number) => void;
  onSearch?: (value: string) => void;
}

const AdminFormSelect: React.FC<AdminFormSelectProps> = ({
  disabled,
  id,
  onBlur,
  onChange,
  onSearch,
  options,
  placeholder,
  searchSelect,
  value,
}) => (
  <AppSelect
    className="admin-form__select"
    disabled={disabled}
    id={id}
    options={options}
    placeholder={placeholder}
    searchSelect={searchSelect}
    value={value}
    onBlur={onBlur}
    onChange={onChange}
    onSearch={onSearch}
  />
);

export default AdminFormSelect;
