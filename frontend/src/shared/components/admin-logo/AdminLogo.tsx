import { APP_ROUTING_PATHS } from '../../../app/routing'
import { Link } from 'react-router-dom'
import adminLogo from '../../../assets/images/admin-logo.png';
import { useAppSelector } from '../../../app/store';
import { EUserRole } from '../../store/user.types';
import './AdminLogo.scss';

const AdminLogo = ({
  logoClassName = ''
}: { logoClassName?: string }) => {
  const { adminOrSupplierUser } = useAppSelector((store) => store.userStoreReducer);
  const user = adminOrSupplierUser;

  const getPanelTitle = (): string => {
    switch (user?.role) {
      case EUserRole.ADMIN:
        return 'Admin Panel';
      case EUserRole.SUPPLIER:
        return 'Supplier Panel';
      default:
        return 'Admin & Supplier Panel';
    }
  };

  return (
    <Link to={APP_ROUTING_PATHS.ADMIN_HOME_PAGE} className="admin-header__title admin-header__title fw-normal text-decoration-none">
      <img src={adminLogo} alt="logo" className={`admin-header__title__logo ${logoClassName}`} /> {getPanelTitle()}
    </Link>
  )
}

export default AdminLogo
