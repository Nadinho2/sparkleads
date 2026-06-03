import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'SparkLeads — Find 200+ Business Leads in 60 Seconds';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0F',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
            }}
          >
            ⚡
          </div>
          <span
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: '#F0F0FF',
            }}
          >
            SparkLeads
          </span>
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#F0F0FF',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: 24,
            maxWidth: 900,
          }}
        >
          Find 200+ Business Leads
          <br />
          <span style={{ color: '#3B82F6' }}>in 60 Seconds</span>
        </div>

        <div
          style={{
            fontSize: 24,
            color: '#6B6B8A',
            textAlign: 'center',
            maxWidth: 700,
          }}
        >
          Real phone numbers, emails, addresses instantly.
          <br />
          One-time ₦19,900. No monthly fees.
        </div>
      </div>
    ),
    { ...size }
  );
}
