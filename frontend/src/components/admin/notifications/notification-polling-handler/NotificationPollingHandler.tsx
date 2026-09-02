import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EUserRole } from '../../../../shared/store/user/user.types';
import { getSupplierNotifications } from '../supplierNotifications.store';
import {
  SUPPLIER_NOTIFICATIONS_POLLING_MS,
} from '../supplierNotifications.utils';

const NotificationPollingHandler = () => {
  const dispatch = useAppDispatch();
  const { adminOrSupplierUser } = useAppSelector((store) => store.userStoreReducer);
  const isSupplier = adminOrSupplierUser?.role === EUserRole.SUPPLIER;

  useEffect(() => {
    if (!isSupplier) {
      return undefined;
    }

    dispatch(getSupplierNotifications());
    const intervalId = window.setInterval(() => {
      dispatch(getSupplierNotifications());
    }, SUPPLIER_NOTIFICATIONS_POLLING_MS);

    return () => window.clearInterval(intervalId);
  }, [dispatch, isSupplier]);

  return null;
};

export default NotificationPollingHandler;
