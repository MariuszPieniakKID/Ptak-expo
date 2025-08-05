import React, { useState, ChangeEvent, FormEvent } from "react";
import { useAuth } from '../contexts/AuthContext';

interface LoginFormProps {
  onLoginSuccess?: (data: any) => void;
}

interface Credentials {
  email: string;
  password: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState<Credentials>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Login attempt with credentials:', credentials);

    try {
      const result = await login(credentials);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, redirecting...');
        onLoginSuccess?.(result.data);
      } else {
        console.log('Login failed:', result.error);
        setError(result.error || 'Błąd logowania');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Wystąpił nieoczekiwany błąd podczas logowania');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = (): void => {
    setCredentials({
      email: 'test@test.com',
      password: 'test123'
    });
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
        }
      `}</style>
      <div style={{
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        minHeight: '100vh'
      }}>
      <div style={{
        backgroundColor: '#ffffff',
        height: '768px',
        overflow: 'hidden',
        width: '1366px',
        position: 'relative'
      }}>
        <div style={{
          backgroundImage: 'url(https://cdn.animaapp.com/projects/6864fc3918d2c9ae335f348c/releases/6864fdf3637921489cf6600d/img/image-35@1x.png)',
          backgroundPosition: '50% 50%',
          backgroundSize: 'cover',
          height: '768px',
          position: 'relative',
          width: '100%'
        }}>
          {/* Background overlay */}
          <img
            style={{
              height: '768px',
              left: 0,
              mixBlendMode: 'overlay',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              width: '1366px'
            }}
            alt="Rectangle"
            src="https://cdn.animaapp.com/projects/6864fc3918d2c9ae335f348c/releases/6864fdf3637921489cf6600d/img/rectangle-8378@1x.png"
          />

          {/* Background gradient */}
          <img
            style={{
              height: '674px',
              left: 0,
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              width: '1366px'
            }}
            alt="Rectangle"
            src="https://cdn.animaapp.com/projects/6864fc3918d2c9ae335f348c/releases/6864fdf3637921489cf6600d/img/rectangle-8313@1x.png"
          />

          {/* Logo */}
          <img
            style={{
              height: '67px',
              left: '648px',
              objectFit: 'cover',
              position: 'absolute',
              top: '63px',
              width: '71px'
            }}
            alt="Group"
            src="https://cdn.animaapp.com/projects/6864fc3918d2c9ae335f348c/releases/6864fdf3637921489cf6600d/img/group-257@1x.png"
          />

          {/* Login panel background */}
          <img
            style={{
              height: '344px',
              left: '539px',
              objectFit: 'cover',
              position: 'absolute',
              top: '153px',
              width: '289px'
            }}
            alt="Group"
            src="https://cdn.animaapp.com/projects/6864fc3918d2c9ae335f348c/releases/6864fdf3637921489cf6600d/img/group-761@1x.png"
          />

          {/* Login form overlay */}
          <div style={{
            position: 'absolute',
            left: '560px',
            top: '190px',
            width: '250px',
            height: '270px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: '0 0 5px 0',
                color: '#333'
              }}>
                Panel Wystawcy
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: 0
              }}>
                Logowanie
              </p>
            </div>

            {error && (
              <div style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                color: '#c33',
                fontSize: '12px',
                borderRadius: '4px',
                marginBottom: '10px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <div>
                <label style={{
                  fontSize: '12px',
                  color: '#666',
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  Adres E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="adres@mail.com"
                  value={credentials.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: loading ? '#f5f5f5' : '#fff'
                  }}
                />
              </div>

              <div>
                <label style={{
                  fontSize: '12px',
                  color: '#666',
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  Hasło
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="********"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: loading ? '#f5f5f5' : '#fff'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  height: '40px',
                  backgroundColor: '#7DF1C7',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Logowanie..." : "Zaloguj się"}
              </button>

              <div style={{ textAlign: 'center' }}>
                <a
                  href="#"
                  style={{
                    fontSize: '12px',
                    color: '#666',
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
                  onMouseOut={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
                >
                  Przypomnij hasło
                </a>
              </div>
            </form>

            {/* Test credentials */}
            <div style={{
              position: 'absolute',
              bottom: '-60px',
              left: '0',
              right: '0',
              padding: '8px',
              backgroundColor: 'rgba(255, 248, 220, 0.9)',
              border: '1px solid #f0e68c',
              borderRadius: '4px',
              textAlign: 'center',
              fontSize: '11px'
            }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#333' }}>
                Dane testowe:
              </p>
              <p style={{ margin: '0 0 8px 0', fontFamily: 'monospace', color: '#666' }}>
                test@test.com / test123
              </p>
              <button
                type="button"
                onClick={handleTestLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  height: '24px',
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Użyj
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default LoginForm;