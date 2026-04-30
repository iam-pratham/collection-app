import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const doctors = [
  { id: '1', name: 'Peter J Berger', specialty: 'Chiro' },
  { id: '2', name: 'Jay E Brecker', specialty: 'Chiro' },
  { id: '3', name: 'Bruce J Buckman', specialty: 'PT' },
  { id: '4', name: 'Christian S Gartner', specialty: 'PT' },
  { id: '5', name: 'Madison Lynn Smith', specialty: 'OT' },
  { id: '6', name: 'Monreo Castro', specialty: 'PT' },
  { id: '7', name: 'Michael Kelly', specialty: 'Provider' },
  { id: '8', name: 'Sridhar Yalamanchili', specialty: 'PT' },
  { id: '9', name: 'Andy Koser', specialty: 'PT' },
  { id: '10', name: 'Billy Ford', specialty: 'Pain Mgmt' }
];

export default function DoctorList() {
  const navigate = useNavigate();

  return (
    <div className="container animate-fade-up">
      <div className="page-header delay-1">
        <h1 className="page-title">Providers</h1>
        <p className="page-subtitle">Select a provider to manage their collection files.</p>
      </div>

      <div className="card-grid delay-2">
        {doctors.map((doctor) => (
          <div 
            key={doctor.id} 
            className="premium-card doctor-card"
            onClick={() => navigate(`/doctor/${doctor.id}`, { state: { doctor } })}
          >
            <div className="doctor-avatar">
              {doctor.name.charAt(0)}
            </div>
            <div className="doctor-info" style={{ flex: 1 }}>
              <h3>{doctor.name}</h3>
              <p>{doctor.specialty}</p>
            </div>
            <ChevronRight className="chevron-icon" />
          </div>
        ))}
      </div>
    </div>
  );
}
