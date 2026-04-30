import React from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const months = [
  { id: 'jan-2026', name: 'January', year: '2026', link: 'https://docs.google.com/spreadsheets/d/1_dummy_link_jan' },
  { id: 'feb-2026', name: 'February', year: '2026', link: 'https://docs.google.com/spreadsheets/d/1_dummy_link_feb' },
  { id: 'mar-2026', name: 'March', year: '2026', link: 'https://docs.google.com/spreadsheets/d/1_dummy_link_mar' },
  { id: 'apr-2026', name: 'April', year: '2026', link: 'https://docs.google.com/spreadsheets/d/1_dummy_link_apr' },
];

export default function DoctorDetail() {
  const { doctorId } = useParams();
  const location = useLocation();
  const doctor = location.state?.doctor || { name: `Provider ${doctorId}`, specialty: 'Specialist' };

  return (
    <div className="container animate-fade-up">
      <Link to="/" className="back-btn delay-1">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="page-header delay-1" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="doctor-avatar" style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
          {doctor.name.charAt(0)}
        </div>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem', fontSize: '2rem' }}>{doctor.name}</h1>
          <p className="page-subtitle">{doctor.specialty} • Collection Reports</p>
        </div>
      </div>

      <div className="card-grid delay-2">
        {months.map((month) => (
          <a 
            key={month.id} 
            href={month.link}
            target="_blank"
            rel="noopener noreferrer"
            className="premium-card month-card"
          >
            <div>
              <h3>{month.name}</h3>
              <p>{month.year}</p>
            </div>
            <ExternalLink size={20} className="chevron-icon" />
          </a>
        ))}
      </div>
    </div>
  );
}
