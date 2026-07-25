import React from 'react';
import Avatar from 'antd/es/avatar';
import DropdownBase from 'antd/es/dropdown';
import Menu from 'antd/es/menu';
import Table from 'antd/es/table';

type LegacyDropdownProps = React.ComponentProps<typeof DropdownBase> & {
  overlay?: React.ReactNode | (() => React.ReactNode);
};

const renderOverlay = (overlay: LegacyDropdownProps['overlay']) =>
  typeof overlay === 'function' ? overlay() : overlay;

export const Dropdown: React.ForwardRefExoticComponent<
  LegacyDropdownProps & React.RefAttributes<HTMLElement>
> = React.forwardRef<HTMLElement, LegacyDropdownProps>(
  ({ overlay, popupRender, dropdownRender, ...props }, ref) => (
    <DropdownBase
      {...props}
      ref={ref}
      popupRender={popupRender || dropdownRender || (() => renderOverlay(overlay))}
    />
  ),
);

export { Avatar, Menu, Table };

export default {
  Avatar,
  Dropdown,
  Menu,
  Table,
};
