import { APP_ROUTING_PATHS } from '../../../app/routing'
import { Link } from 'react-router-dom'
import mainLogo from '../../../assets/images/main-logo.png';
import authLogo from '../../../assets/images/auth-logo.png';
import './AppLogo.scss';

const AppLogo = ({ 
  logoClassName='' 
}: { logoClassName?: string }) => {
  const isAuthRoute = window.location.pathname.startsWith(APP_ROUTING_PATHS.AUTH);
  return (
    <Link to={APP_ROUTING_PATHS.APP_HOME_PAGE} className="text-decoration-none">
      <img src={isAuthRoute ? authLogo : mainLogo} alt="logo" className={`app-logo ${isAuthRoute ? 'auth-logo' : 'main-logo'} ${logoClassName}`} />
    </Link>
  )
}

export default AppLogo
