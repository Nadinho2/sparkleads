import { createSupabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';

function getCurrencySymbol(currency: string) {
  if (currency === 'NGN') return '₦';
  if (currency === 'USD') return '$';
  if (currency === 'GBP') return '£';
  return currency;
}

export default async function PrintProposalPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseAdmin();

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!proposal) notFound();

  const p = proposal.proposal_data || {};
  const services: { name: string; description: string; value_prop: string; deliverables: string[] }[] =
    Array.isArray(p.services) ? p.services : [];
  const pricing: { service: string; price: number; currency: string }[] = proposal.pricing || [];
  const total = pricing.reduce((a: number, s: { price?: number }) => a + (s.price || 0), 0) || p.total_price || 0;
  const currency = pricing[0]?.currency || p.currency || 'NGN';
  const sym = getCurrencySymbol(currency);
  const whyUs: string[] = Array.isArray(p.why_us) ? p.why_us : typeof p.why_us === 'string' ? [p.why_us] : [];
  const nextSteps: string[] = Array.isArray(p.next_steps) ? p.next_steps : typeof p.next_steps === 'string' ? [p.next_steps] : [];

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Proposal — {proposal.business_name}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background: #ffffff;
            color: #1a1a1a;
            font-size: 11pt;
            line-height: 1.7;
          }

          .page {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }

          .header {
            text-align: center;
            padding: 40px 0 30px;
            border-bottom: 3px solid #1a1a1a;
            margin-bottom: 40px;
          }

          .agency-name {
            font-size: 13pt;
            font-weight: normal;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: #555;
            margin-bottom: 12px;
          }

          .proposal-title {
            font-size: 28pt;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 8px;
          }

          .prepared-for {
            font-size: 12pt;
            color: #444;
            margin-top: 8px;
          }

          .proposal-date {
            font-size: 10pt;
            color: #888;
            margin-top: 4px;
          }

          .section {
            margin-bottom: 36px;
            break-inside: avoid;
          }

          .section-title {
            font-size: 15pt;
            font-weight: bold;
            color: #1a1a1a;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }

          .section p {
            color: #333;
            margin-bottom: 12px;
          }

          .opening {
            background: #f9f9f9;
            border-left: 4px solid #1a1a1a;
            padding: 24px 28px;
            border-radius: 0 4px 4px 0;
            margin-bottom: 36px;
          }

          .opening p { color: #333; margin-bottom: 8px; }

          .service-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 20px;
            break-inside: avoid;
          }

          .service-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
          }

          .service-name { font-size: 13pt; font-weight: bold; color: #1a1a1a; }
          .service-price { font-size: 14pt; font-weight: bold; color: #1a1a1a; }
          .service-description { color: #444; margin-bottom: 12px; font-size: 10.5pt; }

          .value-prop {
            background: #f5f5f5;
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 12px;
            font-size: 10pt;
            color: #333;
          }
          .value-prop strong { color: #1a1a1a; }

          .deliverables { list-style: none; margin-top: 8px; }
          .deliverables li {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            padding: 4px 0;
            font-size: 10pt;
            color: #444;
          }
          .deliverables li::before {
            content: "\\2713";
            color: #1a1a1a;
            font-weight: bold;
            flex-shrink: 0;
            margin-top: 1px;
          }

          .investment-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          .investment-table tr { border-bottom: 1px solid #e0e0e0; }
          .investment-table td { padding: 12px 8px; color: #333; font-size: 11pt; }
          .investment-table td:last-child { text-align: right; font-weight: 600; }
          .investment-total { background: #1a1a1a; }
          .investment-total td { color: #ffffff !important; font-size: 13pt; font-weight: bold; padding: 16px 8px; }

          .step-item {
            display: flex;
            gap: 16px;
            align-items: flex-start;
            padding: 14px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .step-number {
            width: 28px; height: 28px;
            background: #f0f0f0;
            border: 2px solid #1a1a1a;
            color: #1a1a1a;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 10pt; flex-shrink: 0;
          }
          .step-text { color: #333; font-size: 10.5pt; padding-top: 3px; }

          .why-item { display: flex; gap: 12px; margin-bottom: 12px; }
          .why-number { font-weight: bold; color: #1a1a1a; min-width: 20px; }

          .closing {
            margin-top: 36px;
            padding-top: 24px;
            border-top: 1px solid #e0e0e0;
          }
          .closing-text { color: #333; margin-bottom: 24px; font-size: 11pt; }
          .signature { margin-top: 24px; font-weight: bold; color: #1a1a1a; }

          .ps-line {
            margin-top: 24px;
            padding: 16px 20px;
            background: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-style: italic;
            color: #555;
            font-size: 10pt;
          }

          .footer {
            margin-top: 48px;
            padding-top: 16px;
            border-top: 2px solid #1a1a1a;
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            color: #888;
          }

          .print-bar {
            position: fixed; top: 0; left: 0; right: 0;
            background: #1a1a1a; color: white;
            padding: 10px 24px;
            display: flex; align-items: center; justify-content: space-between;
            z-index: 100;
          }

          @media print {
            body { font-size: 10pt; }
            .page { padding: 20px; }
            .proposal-title { font-size: 24pt; }
            .no-print { display: none !important; }
            .page { padding-top: 20px !important; }
          }
        `}</style>
      </head>
      <body>
        <div className="print-bar no-print">
          <span style={{ fontSize: '13px' }}>
            Proposal for {proposal.business_name}
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

        <div className="page" style={{ paddingTop: '60px' }}>
          <div className="header">
            <p className="agency-name">
              {p.agency_name || 'Agency'}
            </p>
            <h1 className="proposal-title">Digital Marketing Proposal</h1>
            <p className="prepared-for">
              Prepared for: <strong>{proposal.business_name}</strong>
            </p>
            <p className="proposal-date">
              {new Date(proposal.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>

          {p.opening && (
            <div className="opening">
              <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>
                Dear {proposal.business_name} team,
              </p>
              <p>{p.opening}</p>
            </div>
          )}

          {p.problem_statement && (
            <div className="section">
              <h2 className="section-title">The Situation</h2>
              <p>{p.problem_statement}</p>
            </div>
          )}

          {p.solution_overview && (
            <div className="section">
              <h2 className="section-title">Our Solution</h2>
              <p>{p.solution_overview}</p>
            </div>
          )}

          {services.length > 0 && (
            <div className="section">
              <h2 className="section-title">Services Included</h2>
              {services.map((service, i) => {
                const priceItem = pricing.find((pr) => pr.service === service.name);
                return (
                  <div key={i} className="service-card">
                    <div className="service-header">
                      <span className="service-name">● {service.name}</span>
                      {priceItem && priceItem.price > 0 && (
                        <span className="service-price">
                          {getCurrencySymbol(priceItem.currency)}{Number(priceItem.price).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="service-description">{service.description}</p>
                    {service.value_prop && (
                      <div className="value-prop">
                        <strong>Why you need this:</strong> {service.value_prop}
                      </div>
                    )}
                    {service.deliverables?.length > 0 && (
                      <>
                        <p style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '6px', color: '#1a1a1a' }}>
                          What&apos;s included:
                        </p>
                        <ul className="deliverables">
                          {service.deliverables.map((d, j) => (
                            <li key={j}>{d}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {pricing.length > 0 && (
            <div className="section">
              <h2 className="section-title">Investment Summary</h2>
              <table className="investment-table">
                <tbody>
                  {pricing.filter((item) => item.price > 0).map((item, i) => (
                    <tr key={i}>
                      <td>{item.service}</td>
                      <td>{getCurrencySymbol(item.currency)}{Number(item.price).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="investment-total">
                    <td>Total Investment</td>
                    <td>{sym}{total.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {p.timeline_overview && (
            <div className="section">
              <h2 className="section-title">Timeline</h2>
              <p>{p.timeline_overview}</p>
            </div>
          )}

          {whyUs.length > 0 && (
            <div className="section">
              <h2 className="section-title">Why Choose {p.agency_name || 'Us'}</h2>
              {whyUs.map((point, i) => (
                <div key={i} className="why-item">
                  <span className="why-number">{i + 1}.</span>
                  <span style={{ color: '#333' }}>{point}</span>
                </div>
              ))}
            </div>
          )}

          {nextSteps.length > 0 && (
            <div className="section">
              <h2 className="section-title">Next Steps</h2>
              {nextSteps.map((step, i) => (
                <div key={i} className="step-item">
                  <div className="step-number">{i + 1}</div>
                  <p className="step-text">{step}</p>
                </div>
              ))}
            </div>
          )}

          {p.closing && (
            <div className="closing">
              <p className="closing-text">{p.closing}</p>
              <div className="signature">
                {p.agency_name || 'Agency'}<br />
                <span style={{ fontWeight: 'normal', fontSize: '10pt', color: '#555' }}>
                  {p.agency_contact}
                </span>
              </div>
            </div>
          )}

          {p.ps_line && (
            <div className="ps-line">
              <strong>P.S.</strong> {p.ps_line}
            </div>
          )}

          <div className="footer">
            <span>{p.agency_name || 'Agency'} · Confidential Proposal</span>
            <span>Prepared {new Date(proposal.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </body>
    </html>
  );
}
