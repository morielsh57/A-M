import React, { useState } from "react";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import CircularProgress from "@mui/material/CircularProgress";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { EAPIStatus } from '../../../../shared/api/models';
import { ILoginRequest } from '../../auth.types';
import { useAppDispatch, useAppSelector } from '../../../store';
import { loginRequest } from '../../auth.store';
import { APP_ROUTING_PATHS } from '../../../routing';
import AppLogo from '../../../../shared/components/app-logo/AppLogo';
import { useClientAuthFormStyles } from '../shared/clientAuthForm.utils';
import ButtonAnimationWrapper from '../../../../shared/components/button-animation-wrapper/ButtonAnimationWrapper';
import paletteColors from '../../../../shared/styles/colors.module.scss';
import '../shared/ClientAuthForm.scss';

const ClientLogin: React.FC = () => {
  const classes = useClientAuthFormStyles();
  const [loginErrorMsg, setLoginErrorMsg] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const { loginRes } = useAppSelector((store) => store.authStoreReducer);
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<ILoginRequest>();
  const isLoginButtonDisabled = isSubmitting || loginRes.status === EAPIStatus.PENDING;

  const emailRef = register("email", {
    required: true,
    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  });
  const passRef = register("password", { required: true, minLength: 8 });

  const formSend = async (data: ILoginRequest) => {
    setLoginErrorMsg(null);
    dispatch(loginRequest(data))
      .unwrap()
      .catch(() => setLoginErrorMsg('Invalid email or password. Please try again.'));
  };

  return (
    <div className="client-auth-page">
      <CssBaseline />
      <Container component="main" maxWidth="xs" className="client-auth-inner-container">
        <div className="mx-auto text-center">
          <AppLogo />
        </div>
        <div className={classes.paper} >
          <Avatar
            className={classes.avatar}
            sx={{ bgcolor: paletteColors.deepPink8 }}
          >
            <LockOutlinedIcon />
          </Avatar>

          <Typography component="h1" variant="h5" className="text-center">
            Log In
          </Typography>

          <form className={classes.form} onSubmit={handleSubmit(formSend)}>
            <div className="mb-3 mt-2">
              <input
                {...emailRef}
                name="email"
                type="text"
                className={`form-control ${classes.input}`}
                id="email"
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
                className={`form-control ${classes.input}`}
                id="pass"
                placeholder="Password*"
              />
              {errors.password && (
                <div className="text-danger">Password must be at least 8 characters</div>
              )}
            </div>
            {loginErrorMsg && (
              <div className="text-danger text-center" style={{ whiteSpace: 'pre-line', marginBottom: '4px'}}>{loginErrorMsg}</div>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
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
                  to={APP_ROUTING_PATHS.AUTH_SIGNUP_PAGE}
                  className="auth-link text-decoration-none"
                >
                  {"Don't have an account? Sign Up"}
                </Link>
              </div>
            </ButtonAnimationWrapper>
          </form>
        </div>
      </Container>
    </div>
  );
};

export default ClientLogin;
