export function validateEmail(email: string) {
  if (!email.trim()) {
    return 'Введите email';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return 'Введите корректный email';
  }

  return null;
}

export function validatePassword(password: string) {
  if (!password) {
    return 'Введите пароль';
  }

  if (password.length < 8) {
    return 'Пароль должен быть не короче 8 символов';
  }

  return null;
}

export function validatePasswordRepeat(password: string, repeatPassword: string) {
  if (!repeatPassword) {
    return 'Повторите пароль';
  }

  if (password !== repeatPassword) {
    return 'Пароли не совпадают';
  }

  return null;
}