import React from 'react';
import { ISignUpForm } from '../../../auth/auth.types';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import AddIcon from '@material-ui/icons/Add';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import CircularProgress from '@mui/material/CircularProgress';
import { useForm } from "react-hook-form";
import { Link } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications';
import { EAPIStatus } from '../../../../shared/api/models';
import AppLogo from '../../../../shared/components/app-logo/AppLogo';
import { APP_ROUTING_PATHS } from '../../../routing';
import ButtonAnimationWrapper from '../../../../shared/components/button-animation-wrapper/ButtonAnimationWrapper';
import paletteColors from '../../../../shared/styles/colors.module.scss';
import { useClientAuthFormStyles } from '../shared/clientAuthForm.utils';
import { signupRequest } from '../../auth.store';
import { useAppDispatch, useAppSelector } from '../../../store';
import '../shared/ClientAuthForm.scss';

const ClientSignup: React.FC = () => {
  const classes = useClientAuthFormStyles();
  const dispatch = useAppDispatch();
  const { addToast } = useToasts();
  const { signupRes } = useAppSelector((store) => store.authStoreReducer);
  const [signupErrorMsg, setSignupErrorMsg] = React.useState<string | null>(null);
  const { register, formState: { errors, isSubmitting }, handleSubmit, getValues } = useForm<ISignUpForm>();

  const nameRef = register("name", { required: true, minLength: 2 });
  const emailRef = register("email", { required: true, pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i });
  const phoneRef = register("phone", { required: true, minLength: 9 });
  const addressRef = register("address", { required: true, minLength: 2 });
  const passRef = register("password", { required: true, minLength: 8 });
  const passRef2 = register("password2", {
    required: true,
    validate: (value) => value === getValues("password"),
  });

  const formSend = async ({ password2, ...formData }: ISignUpForm) => {
    setSignupErrorMsg(null);

    try {
      await dispatch(signupRequest(formData)).unwrap();
      addToast(`Verify your email`,
        {
          appearance: 'info',
        });
    } catch {
      setSignupErrorMsg('There was a problem creating your account.\nPlease try again.');
    }
  };

  const isSignupButtonDisabled = isSubmitting || signupRes.status === EAPIStatus.PENDING;

  return (
    <div className="client-auth-page">
      <CssBaseline />
      <Container component="main" maxWidth="xs" className="client-auth-inner-container">
        <div className="mx-auto text-center">
          <AppLogo />
        </div>
        <div className={classes.paper}>
          <Avatar
            className={classes.avatar}
            sx={{ bgcolor: paletteColors.deepPink8 }}
          >
            <AddIcon />
          </Avatar>
          <Typography component="h1" variant="h5" className="text-center">
            Sign Up
          </Typography>
          <form className={classes.form} onSubmit={handleSubmit(formSend)}>
            <div className="mb-3 mt-2">
              <input
                {...nameRef}
                name="name"
                type="text"
                className={`form-control ${classes.input}`}
                id="name"
                placeholder="Name*"
              />
              {errors.name && <div className="text-danger">Name must be at least 2 characters</div>}
            </div>
            <div className="mb-3">
              <input
                {...emailRef}
                name="email"
                type="text"
                className={`form-control ${classes.input}`}
                id="email"
                placeholder="Email Address*"
              />
              {errors.email && <div className="text-danger">Enter valid email</div>}
            </div>
            <div className="mb-3">
              <input
                {...phoneRef}
                name="phone"
                type="text"
                className={`form-control ${classes.input}`}
                id="phone"
                placeholder="Phone Number*"
              />
              {errors.phone && <div className="text-danger">Phone number must be at least 9 digits</div>}
            </div>
            <div className="mb-3">
              <input
                {...addressRef}
                name="address"
                type="text"
                className={`form-control ${classes.input}`}
                id="address"
                placeholder="Address*"
              />
              {errors.address && <div className="text-danger">Address must be at least 2 characters</div>}
            </div>
            <div className="mb-3">
              <input
                {...passRef}
                name="password"
                type="password"
                className={`form-control ${classes.input}`}
                id="password"
                placeholder="Password*"
              />
              {errors.password && <div className="text-danger">Password must be at least 8 characters</div>}
            </div>
            <div className="mb-3">
              <input
                {...passRef2}
                name="password2"
                type="password"
                className={`form-control ${classes.input}`}
                id="password2"
                placeholder="Confirm Password*"
              />
              {errors.password2 && <div className="text-danger">Passwords do not match</div>}
            </div>
            {signupErrorMsg && (
              <div className="text-danger text-center" style={{ whiteSpace: 'pre-line', marginBottom: '4px'}}>{signupErrorMsg}</div>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              disabled={isSignupButtonDisabled}
            >
              {isSignupButtonDisabled ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                'Sign Up'
              )}
            </Button>
            <ButtonAnimationWrapper>
              <div className="mt-3 text-center">
                <Link
                  to={APP_ROUTING_PATHS.AUTH_LOGIN_PAGE}
                  className="auth-link text-decoration-none"
                >
                  {"Already have an account? Log In"}
                </Link>
              </div>
            </ButtonAnimationWrapper>
          </form>
        </div>
      </Container>
    </div>
  );
};

export default ClientSignup;
