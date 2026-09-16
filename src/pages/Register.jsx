import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'

function EyeIcon({ hidden }) {
  return hidden ? (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.8 10.8 0 0112 5c5.3 0 9 5.8 9 7s-1.4 3.4-4.2 5.2M6.6 6.6C4.4 8 3 10.5 3 12c0 1.2 3.7 7 9 7 1.1 0 2.2-.2 3.1-.6" /></svg>
  ) : (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12s3.2-7 9-7 9 7 9 7-3.2 7-9 7-9-7-9-7z" /><circle cx="12" cy="12" r="2.5" /></svg>
  )
}

function friendlyError(error) {
  if (!error?.status) return 'We could not reach the service. Please check your connection and try again.'
  if (error.status === 409) return 'An account with this email or phone already exists.'
  if (error.status === 422) return 'Please check the details and password requirements.'
  return 'Unable to create your account right now. Please try again.'
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const from = location.state?.from || '/profile'

  const validate = () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Name is required.'
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Please enter a valid email address.'
    if (!form.phone.trim()) nextErrors.phone = 'Phone is required.'
    if (!form.password) nextErrors.password = 'Password is required.'
    else if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = (field) => `w-full rounded-xl border bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 ${errors[field] ? 'border-red-300' : 'border-neutral-200'}`

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-neutral-50 py-10 sm:py-16">
      <div className="container-app">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-[var(--shadow-card-hover)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-primary-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div><Link to="/" className="text-xl font-bold">Fresh<span className="text-primary-200">Harvest</span></Link><h2 className="mt-20 text-4xl font-bold leading-tight">A fresher way<br />to shop.</h2><p className="mt-5 max-w-xs text-primary-100">Create an account to save your cart, track deliveries, and reorder your favourites.</p></div>
            <p className="text-sm text-primary-100">Fresh picks, made simple.</p>
          </div>
          <div className="p-6 sm:p-10 lg:p-14">
            <Link to="/" className="text-lg font-bold text-neutral-900 lg:hidden">Fresh<span className="text-primary-600">Harvest</span></Link>
            <h1 className="mt-8 text-3xl font-bold text-neutral-900 lg:mt-0">Create your account</h1>
            <p className="mt-2 text-neutral-500">Start shopping fresh today.</p>
            {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              {[
                ['name', 'Full name', 'text', 'name'],
                ['email', 'Email', 'email', 'email'],
                ['phone', 'Phone', 'tel', 'tel'],
              ].map(([field, label, type, autocomplete]) => (
                <div key={field}><label htmlFor={`register-${field}`} className="mb-2 block text-sm font-medium text-neutral-700">{label}</label><input id={`register-${field}`} name={field} type={type} autoComplete={autocomplete} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className={inputClass(field)} />{errors[field] && <p className="mt-1.5 text-xs text-red-600">{errors[field]}</p>}</div>
              ))}
              <PasswordField id="register-password" label="Password" value={form.password} error={errors.password} visible={showPassword} onChange={(value) => setForm({ ...form, password: value })} onToggle={() => setShowPassword(!showPassword)} autocomplete="new-password" inputClass={inputClass('password')} />
              <PasswordField id="register-confirm-password" label="Confirm password" value={form.confirmPassword} error={errors.confirmPassword} visible={showConfirmPassword} onChange={(value) => setForm({ ...form, confirmPassword: value })} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} autocomplete="new-password" inputClass={inputClass('confirmPassword')} />
              <p className="text-xs text-neutral-500">Password must be at least 8 characters.</p>
              <Button type="submit" className="w-full py-3" disabled={submitting}>{submitting ? 'Creating account...' : 'Create account'}</Button>
            </form>
            <p className="mt-8 text-center text-sm text-neutral-500">Already have an account? <Link to="/login" state={{ from }} className="font-semibold text-primary-700 hover:text-primary-800">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PasswordField({ id, label, value, error, visible, onChange, onToggle, autocomplete, inputClass }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-medium text-neutral-700">{label}</label><div className="relative"><input id={id} name={id} type={visible ? 'text' : 'password'} autoComplete={autocomplete} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} pr-12`} /><button type="button" onClick={onToggle} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"><EyeIcon hidden={!visible} /></button></div>{error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}</div>
}
