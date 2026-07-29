import React, { useEffect, useState } from "react";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ILoginRequest } from '../../auth.types';
import { useAppDispatch } from '../../../store';
import { loginRequest } from '../../auth.store';
import { APP_ROUTING_PATHS } from '../../../routing';
import AppLogo from '../../../../shared/components/app-logo/AppLogo';
import { useLoginStyles } from './clientLogin.utils';
import ButtonAnimationWrapper from '../../../../shared/components/button-animation-wrapper/ButtonAnimationWrapper';
import './ClientLogin.scss';

const ClientLogin: React.FC = () => {
  const classes = useLoginStyles();
  const [loginErrorMsg, setLoginErrorMsg] = useState<string | null>(null);
  let dispatch = useAppDispatch();
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<ILoginRequest>();

  let emailRef = register("email", {
    required: true,
    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  });
  let passRef = register("password", { required: true, minLength: 8 });

  const formSend = (data: ILoginRequest) => {
    setLoginErrorMsg(null);
    dispatch(loginRequest(data))
      .unwrap()
      .catch(() => setLoginErrorMsg('Invalid email or password. Please try again.'));
  };

  return (
    <Container component="main" maxWidth="xs" className="client-login-container">
      <div className="mx-auto text-center">
        <AppLogo />
      </div>
      <CssBaseline />
      <div className={classes.paper} >
        <Avatar className={classes.avatar}>
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
            <div className="text-danger text-center">{loginErrorMsg}</div>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
          >
            Log In
          </Button>
          <ButtonAnimationWrapper>
            <div className="mt-2 text-center">
              <Link
                to={APP_ROUTING_PATHS.AUTH_SIGNUP_PAGE}
                className="sign-up-link text-decoration-none mt-sm-0 mt-1"
              >
                {"Don't have an account? Sign Up"}
              </Link>
            </div>
          </ButtonAnimationWrapper>
        </form>
      </div>
    </Container>
  );
};

export default ClientLogin;

