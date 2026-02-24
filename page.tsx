export const metadata = {
  title: 'Access Restricted | Reflex Wars',
  description: 'Access to this game is restricted in your region',
}

export default function BlockedPage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #1a1a3e 0%, #0d0d1a 50%, #050510 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(20, 20, 40, 0.95)',
        borderRadius: '24px',
        padding: '60px 40px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: '80px', marginBottom: '24px' }}>🚫</div>
        
        <h1 style={{
          fontSize: '32px',
          fontWeight: '900',
          color: '#fff',
          margin: '0 0 16px',
          letterSpacing: '2px',
        }}>
          ACCESS RESTRICTED
        </h1>
        
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0 0 24px',
        }}>
          We apologize, but Reflex Wars is not available in your region at this time.
        </p>

        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '14px',
            margin: '0 0 12px',
          }}>
            This restriction may be due to:
          </p>
          <ul style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '14px',
            textAlign: 'left',
            margin: 0,
            paddingLeft: '20px',
          }}>
            <li style={{ marginBottom: '8px' }}>Local gaming regulations</li>
            <li style={{ marginBottom: '8px' }}>Licensing requirements</li>
            <li>Geographic availability restrictions</li>
          </ul>
        </div>

        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '14px',
          margin: 0,
        }}>
          For questions or to request access, please contact support.
        </p>

        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '12px',
            margin: 0,
          }}>
            © 2024 Reflex Wars. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  )
}

