import { Link } from 'react-router-dom';
import './AppTitle.scss';

interface AppTitleProps {
  title?: string;
  to?: string;
}

const AppTitle = ({ title = "A&M Fashion Store", to }: AppTitleProps) => {
  const titleContent = to ? (
    <Link to={to} className="app-title__link">
      {title}
    </Link>
  ) : title;

  return (
    <>
      <hr className="app-title__hr-for-title" />
      <h1 className="app-title__title text-center fw-normal">
        <span>{titleContent}</span>
      </h1>
    </>
  )
}

export default AppTitle
