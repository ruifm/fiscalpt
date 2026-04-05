import { ImageResponse } from 'next/og'

export const alt = 'FiscalPT — Otimização Fiscal Inteligente'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: 'white',
            fontWeight: 700,
          }}
        >
          F
        </div>
        <span style={{ fontSize: '56px', fontWeight: 700, color: 'white' }}>FiscalPT</span>
      </div>
      <div
        style={{
          fontSize: '32px',
          color: '#94a3b8',
          marginBottom: '48px',
        }}
      >
        Otimização Fiscal Inteligente
      </div>
      <div
        style={{
          display: 'flex',
          gap: '40px',
          color: '#64748b',
          fontSize: '20px',
        }}
      >
        <span>IRS 2024/2025</span>
        <span>·</span>
        <span>Tributação Conjunta</span>
        <span>·</span>
        <span>IRS Jovem</span>
        <span>·</span>
        <span>NHR</span>
      </div>
    </div>,
    { ...size },
  )
}
