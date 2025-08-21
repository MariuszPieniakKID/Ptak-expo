import { Box, Card, Typography, Button, Link } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import FormTextField from '../../components/form/FormTextField';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/images/logo.png';
import styles from './Login.module.scss';
import { useNavigate } from 'react-router-dom';

interface LoginFormData {
  email: string;
  password: string;
}

const schema = yup
  .object({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup
      .string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
  })
  .required();

const Login = () => {
  const { t } = useTranslation('login');
  const navigate = useNavigate();
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(schema),
  });
  const { login } = useAuth();

  const onSubmit = (data: LoginFormData) => {
    console.log('Login data', data);
    //todo api call, token handle
    login({ id: 1, name: 'Jan', email: 'jan@kowalski.pl' });
    navigate('/');
  };

  return (
    <Box className={styles.background}>
      <Box className={styles.logo}>
        <img src={logo} alt="Logo" />
      </Box>
      <Box className={styles.children}>
        <Card className={styles.loginCard} variant="outlined">
          <Typography variant="h4" width={'70%'} textAlign={'center'}>
            {t('title')}
          </Typography>
          <Typography variant="h5" width={'100%'} textAlign={'left'}>
            {t('login')}
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className={styles.loginForm}
          >
            <FormTextField name="email" label={t('email')} control={control} type="email" />
            <FormTextField
              name="password"
              label={t('password')}
              control={control}
              type="password"
            />

            <Button type="submit" fullWidth variant="contained" className={styles.loginButton}>
              {t('loginButton')}
            </Button>
          </Box>

          <Link
            component="button"
            type="button"
            variant="body2"
            className={styles.forgotPasswordLink}
          >
            {t('forgotPassword')}
          </Link>
        </Card>
      </Box>
    </Box>
  );
};
export default Login;
