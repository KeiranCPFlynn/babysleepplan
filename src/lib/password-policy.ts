export const PASSWORD_MIN_LENGTH = 8

// At least 1 lowercase, 1 uppercase, 1 digit, 1 symbol, no whitespace.
export const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/

export const PASSWORD_POLICY_HINT =
  'Use at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 symbol.'

export function getPasswordPolicyErrors(password: string): string[] {
  const errors: string[] = []

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`at least ${PASSWORD_MIN_LENGTH} characters`)
  }
  if (!/[a-z]/.test(password)) {
    errors.push('one lowercase letter')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('one uppercase letter')
  }
  if (!/\d/.test(password)) {
    errors.push('one number')
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('one symbol')
  }
  if (/\s/.test(password)) {
    errors.push('no spaces')
  }

  return errors
}
