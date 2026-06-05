'use client';

export default function PrintBar({ businessName }: { businessName: string }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#1a1a1a', color: 'white',
      padding: '10px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{ fontSize: '13px' }}>
        Proposal for {businessName}
      </span>
      <button
        onClick={() => window.print()}
        style={{
          background: 'white', color: '#1a1a1a',
          border: 'none', padding: '8px 20px',
          borderRadius: '6px', fontWeight: 'bold',
          cursor: 'pointer', fontSize: '13px',
        }}
      >
        Download PDF
      </button>
    </div>
  );
}
