import { AuthError } from '@supabase/supabase-js';
import { traducirErrorLogin } from '../authErrorMessages';

function authError(code: string, message: string): AuthError {
  return { name: 'AuthError', message, status: 400, code } as AuthError;
}

describe('traducirErrorLogin', () => {
  it('devuelve null cuando no hay error', () => {
    expect(traducirErrorLogin(null)).toBeNull();
  });

  it('traduce credenciales inválidas por código', () => {
    const texto = traducirErrorLogin(authError('invalid_credentials', 'Invalid login credentials'));
    expect(texto).toContain('correo o la contraseña son incorrectos');
  });

  it('traduce credenciales inválidas incluso sin código', () => {
    const texto = traducirErrorLogin(authError('', 'Invalid login credentials'));
    expect(texto).toContain('correo o la contraseña son incorrectos');
  });

  it('avisa cuando el correo no está confirmado', () => {
    const texto = traducirErrorLogin(authError('email_not_confirmed', 'Email not confirmed'));
    expect(texto).toContain('confirmas tu correo');
  });

  it('cubre errores inesperados con un respaldo accionable', () => {
    const texto = traducirErrorLogin(authError('over_request_rate_limit', 'Too many requests'));
    expect(texto).toContain('vuelve a intentarlo');
  });
});