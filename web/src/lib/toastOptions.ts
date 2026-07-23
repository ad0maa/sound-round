import type { DefaultToastOptions } from 'react-hot-toast'

/** Shared <Toaster toastOptions> so toasts match the app's warm/pill theme. */
export const toastOptions: DefaultToastOptions = {
  className: 'font-body',
  style: {
    background: 'var(--card)',
    color: 'var(--foreground)',
    borderRadius: '999px',
    padding: '10px 18px',
    fontSize: '14px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--divider)',
  },
  success: {
    iconTheme: { primary: 'var(--brand2-600)', secondary: '#fff' },
  },
  error: {
    iconTheme: { primary: 'var(--destructive)', secondary: '#fff' },
  },
}
