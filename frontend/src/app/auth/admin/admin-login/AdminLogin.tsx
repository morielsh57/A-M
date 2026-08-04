import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EAPIStatus } from '../../../../shared/api/models';
import { APP_ROUTING_PATHS } from '../../../routing';
import { useAppDispatch, useAppSelector } from '../../../store';
import { adminLoginRequest } from '../../auth.store';
import type { ILoginRequest } from '../../auth.types';
import ButtonAnimationWrapper from '../../../../shared/components/button-animation-wrapper/ButtonAnimationWrapper';
import '../../client/shared/ClientAuthForm.scss';
import AdminLogo from '../../../../shared/components/admin-logo/AdminLogo';
import './AdminLogin.scss';

const AdminLogin: React.FC = () => {
  const dispatch = useAppDispatch();
  const { adminLoginRes } = useAppSelector((store) => store.authStoreReducer);
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<ILoginRequest>();
  const isLoginButtonDisabled = isSubmitting || adminLoginRes.status === EAPIStatus.PENDING;
  const loginErrorMsg = adminLoginRes.error?.message;

  const emailRef = register('email', {
    required: true,
    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  });
  const passRef = register('password', { required: true, minLength: 8 });

  const formSend = async (data: ILoginRequest) => {
    await dispatch(adminLoginRequest(data));
  };

  return (
    <div className="admin-auth-page">
      <CssBaseline />
      <Container component="main" maxWidth={false} disableGutters className="admin-auth-shell">
        <div className="admin-auth-header">
          <AdminLogo />
        </div>
        <div className="admin-auth-body">
          <div className="admin-auth-form-wrap">
            <div className="admin-auth-card">
              <Avatar className="admin-auth-avatar">
                <LockOutlinedIcon />
              </Avatar>

              <Typography component="h1" variant="h5" className="text-center admin-auth-title">
                Admin Panel - Login
              </Typography>

              <form className="admin-auth-form" onSubmit={handleSubmit(formSend)}>
                <div className="mb-3 mt-2">
                  <input
                    {...emailRef}
                    name="email"
                    type="text"
                    className="form-control admin-auth-input"
                    id="admin-email"
                    placeholder="Email Address*"
                  />
                  {errors.email && (
                    <div className="text-danger">Enter valid email</div>
                  )}
                </div>

                <div className="mb-3">
                  <input
                    {...passRef}
                    name="password"
                    type="password"
                    className="form-control admin-auth-input"
                    id="admin-password"
                    placeholder="Password*"
                  />
                  {errors.password && (
                    <div className="text-danger">Password must be at least 8 characters</div>
                  )}
                </div>

                {loginErrorMsg && (
                  <div className="text-danger text-center" style={{ whiteSpace: 'pre-line', marginBottom: '4px' }}>
                    {loginErrorMsg}
                  </div>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  className="admin-auth-submit"
                  disabled={isLoginButtonDisabled}
                >
                  {isLoginButtonDisabled ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    'Log In'
                  )}
                </Button>

                <ButtonAnimationWrapper>
                  <div className="mt-3 text-center">
                    <Link
                      to={APP_ROUTING_PATHS.APP}
                      className="auth-link admin-auth-link text-decoration-none"
                    >
                      To home page
                    </Link>
                  </div>
                </ButtonAnimationWrapper>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AdminLogin;
