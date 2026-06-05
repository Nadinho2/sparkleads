import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import PrintBar from './PrintBar';

function getCurrencySymbol(currency: string) {
  if (currency === 'NGN') return '₦';
  if (currency === 'USD') return '$';
  if (currency === 'GBP') return '£';
  return currency;
}

export default async function PrintProposalPage({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!proposal) notFound();

  const p = proposal.proposal_data || {};
  const services: { name: string; description: string; value_prop: string; deliverables: string[] }[] =
    Array.isArray(p.services) ? p.services : typeof p.services === 'string' ? [] : [];
  const pricing: { service: string; price: number; currency: string }[] = proposal.pricing || [];
  const total = pricing.reduce((a: number, s: { price?: number }) => a + (s.price || 0), 0) || p.total_price || 0;
  const currency = pricing[0]?.currency || p.currency || 'NGN';
  const sym = getCurrencySymbol(currency);
  const whyUs: string[] = Array.isArray(p.why_us) ? p.why_us : typeof p.why_us === 'string' ? [p.why_us] : [];
  const nextSteps: string[] = Array.isArray(p.next_steps) ? p.next_steps : typeof p.next_steps === 'string' ? [p.next_steps] : [];

  return (
    <>
      <style>{`
        /* Override dark theme for this page */
        html { background: #ffffff !important; }
        body { background: #ffffff !important; color: #1a1a1a !important; font-family: 'Georgia', 'Times New Roman', serif !important; }
        nav, aside, header, .no-print, [data-sidebar] { display: none !important; }

        #print-root * {
          font-family: 'Georgia', 'Times New Roman', serif !important;
        }
      `}</style>

      <div id="print-root" style={{
        background: '#ffffff',
        color: '#1a1a1a',
        minHeight: '100vh',
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}>
        {/* Print bar */}
        <PrintBar businessName={proposal.business_name} />

        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '40px',
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            padding: '40px 0 30px',
            borderBottom: '3px solid #1a1a1a',
            marginBottom: '40px',
          }}>
            <p style={{
              fontSize: '13pt', fontWeight: 'normal',
              letterSpacing: '4px', textTransform: 'uppercase',
              color: '#555', marginBottom: '12px',
            }}>
              {p.agency_name || 'Agency'}
            </p>
            <h1 style={{
              fontSize: '28pt', fontWeight: 'bold',
              color: '#1a1a1a', marginBottom: '8px',
            }}>
              Digital Marketing Proposal
            </h1>
            <p style={{ fontSize: '12pt', color: '#444', marginTop: '8px' }}>
              Prepared for: <strong>{proposal.business_name}</strong>
            </p>
            <p style={{ fontSize: '10pt', color: '#888', marginTop: '4px' }}>
              {new Date(proposal.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>

          {/* Opening */}
          {p.opening && (
            <div style={{
              background: '#f9f9f9',
              borderLeft: '4px solid #1a1a1a',
              padding: '24px 28px',
              borderRadius: '0 4px 4px 0',
              marginBottom: '36px',
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>
                Dear {proposal.business_name} team,
              </p>
              <p style={{ color: '#333', marginBottom: '8px' }}>{p.opening}</p>
            </div>
          )}

          {/* The Situation */}
          {p.problem_statement && (
            <div style={{ marginBottom: '36px', breakInside: 'avoid' }}>
              <h2 style={{
                fontSize: '15pt', fontWeight: 'bold', color: '#1a1a1a',
                borderBottom: '2px solid #e0e0e0', paddingBottom: '8px', marginBottom: '16px',
              }}>The Situation</h2>
              <p style={{ color: '#333', marginBottom: '12px' }}>{p.problem_statement}</p>
            </div>
          )}

          {/* Our Solution */}
          {p.solution_overview && (
            <div style={{ marginBottom: '36px', breakInside: 'avoid' }}>
              <h2 style={{
                fontSize: '15pt', fontWeight: 'bold', color: '#1a1a1a',
                borderBottom: '2px solid #e0e0e0', paddingBottom: '8px', marginBottom: '16px',
              }}>Our Solution</h2>
              <p style={{ color: '#333', marginBottom: '12px' }}>{p.solution_overview}</p>
            </div>
          )}

          {/* Services */}
          {services.length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <h2 style={{
                fontSize: '15pt', fontWeight: 'bold', color: '#1a1a1a',
                borderBottom: '2px solid #e0e0e0', paddingBottom: '8px', marginBottom: '16px',
              }}>Services Included</h2>
              {services.map((service, i) => {
                const priceItem = pricing.find((pr) => pr.service === service.name);
                return (
                  <div key={i} style={{
                    border: '1px solid #e0e0e0', borderRadius: '8px',
                    padding: '24px', marginBottom: '20px', breakInside: 'avoid',
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: '12px',
                    }}>
                      <span style={{ fontSize: '13pt', fontWeight: 'bold', color: '#1a1a1a' }}>
                        ● {service.name}
                      </span>
                      {priceItem && priceItem.price > 0 && (
                        <span style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1a1a1a' }}>
                          {getCurrencySymbol(priceItem.currency)}{Number(priceItem.price).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#444', marginBottom: '12px', fontSize: '10.5pt' }}>
                      {service.description}
                    </p>
                    {service.value_prop && (
                      <div style={{
                        background: '#f5f5f5', padding: '12px 16px',
                        borderRadius: '4px', marginBottom: '12px',
                        fontSize: '10pt', color: '#333',
                      }}>
                        <strong style={{ color: '#1a1a1a' }}>Why you need this:</strong> {service.value_prop}
                      </div>
                    )}
                    {service.deliverables?.length > 0 && (
                      <>
                        <p style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '6px', color: '#1a1a1a' }}>
                          What&apos;s included:
                        </p>
                        <ul style={{ listStyle: 'none', marginTop: '8px' }}>
                          {service.deliverables.map((d, j) => (
                            <li key={j} style={{
                              display: 'flex', alignItems: 'flex-start',
                              gap: '8px', padding: '4px 0',
                              fontSize: '10pt', color: '#444',
                            }}>
                              <span style={{ color: '#1a1a1a', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
                              {d}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Investment Summary */}
          {pricing.length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <h2 style={{
                fontSize: '15pt', fontWeight: 'bold', color: '#1a1a1a',
                borderBottom: '2px solid #e0e0e0', paddingBottom: '8px', marginBottom: '16px',
              }}>Investment Summary</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
                <tbody>
                  {pricing.filter((item) => item.price > 0).map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px 8px', color: '#333', fontSize: '11pt' }}>{item.service}</td>
                      <td style={{ padding: '12px 8px', color: '#333', fontSize: '11pt', textAlign: 'right', fontWeight: 600 }}>
                        {getCurrencySymbol(item.currency)}{Number(item.price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#1a1a1a' }}>
                    <td style={{ padding: '16px 8px', color: '#ffffff', fontSize: '13pt', fontWeight: 'bold' }}>Total Investment</td>
                    <td style={{ padding: '16px 8px', color: '#ffffff', fontSize: '13pt', fontWeight: 'bold', textAlign: 'right' }}>
                      {sym}{total.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Timeline */}
          {p.timeline_overview && (
            <div style={{ marginBottom: '36px' }}>
              <h2 style={{
                fontSize: '15pt', fontWeight: 'bold', color: '#1a1a1a',
                borderBottom: '2px solid #e0e0e0', paddingBottom: '8px', marginBottom: '16px',
              }}>Timeline</h2>
              <p style={{ color: '#333' }}>{p.timeline_overview}</p>
            </div>
          )}

          {/* Why Choose Us */}
          {whyUs.length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <h2 style={{
                fontSize: '15pt', fontWeight: 'bold', color: '#1a1a1a',
                borderBottom: '2px solid #e0e0e0', paddingBottom: '8px', marginBottom: '16px',
              }}>Why Choose {p.agency_name || 'Us'}</h2>
              {whyUs.map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 'bold', color: '#1a1a1a', minWidth: '20px' }}>{i + 1}.</span>
                  <span style={{ color: '#333' }}>{point}</span>
                </div>
              ))}
            </div>
          )}

          {/* Next Steps */}
          {nextSteps.length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <h2 style={{
                fontSize: '15pt', fontWeight: 'bold', color: '#1a1a1a',
                borderBottom: '2px solid #e0e0e0', paddingBottom: '8px', marginBottom: '16px',
              }}>Next Steps</h2>
              {nextSteps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '16px', alignItems: 'flex-start',
                  padding: '14px 0', borderBottom: '1px solid #f0f0f0',
                }}>
                  <div style={{
                    width: '28px', height: '28px', background: '#f0f0f0',
                    border: '2px solid #1a1a1a', color: '#1a1a1a', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '10pt', flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ color: '#333', fontSize: '10.5pt', paddingTop: '3px' }}>{step}</p>
                </div>
              ))}
            </div>
          )}

          {/* Closing */}
          {p.closing && (
            <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>
              <p style={{ color: '#333', marginBottom: '24px', fontSize: '11pt' }}>{p.closing}</p>
              <div style={{ marginTop: '24px', fontWeight: 'bold', color: '#1a1a1a' }}>
                {p.agency_name || 'Agency'}<br />
                <span style={{ fontWeight: 'normal', fontSize: '10pt', color: '#555' }}>
                  {p.agency_contact}
                </span>
              </div>
            </div>
          )}

          {/* P.S. */}
          {p.ps_line && (
            <div style={{
              marginTop: '24px', padding: '16px 20px',
              background: '#f9f9f9', border: '1px solid #e0e0e0',
              borderRadius: '4px', fontStyle: 'italic',
              color: '#555', fontSize: '10pt',
            }}>
              <strong>P.S.</strong> {p.ps_line}
            </div>
          )}

          {/* Footer */}
          <div style={{
            marginTop: '48px', paddingTop: '16px',
            borderTop: '2px solid #1a1a1a',
            display: 'flex', justifyContent: 'space-between',
            fontSize: '9pt', color: '#888',
          }}>
            <span>{p.agency_name || 'Agency'} · Confidential Proposal</span>
            <span>Prepared {new Date(proposal.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </>
  );
}
