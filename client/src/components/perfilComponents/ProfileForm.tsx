import React, { useEffect, useState } from 'react';
import styles from "./ProfileForm.module.css";
import {
  AccordionItem,
  AccordionHeader,
  AccordionBody,
} from 'reactstrap';

export default function ProfileForm({ userId: propUserId }: { userId?: string } = {}) {
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    sector: '',
    interest_field: '',
    target_position: '',
    minimum_salary: '',
    education_level: '',
    availability: '',
    city: ''
  });
  const [savedMessage, setSavedMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(propUserId || null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // If no userId prop, fetch the list of appusers and pick the first
        if (!userId) {
          const resp = await fetch('/api/appusers');
          if (!resp.ok) throw new Error('failed to fetch users');
          const users = await resp.json();
          if (!users || users.length === 0) {
            if (mounted) setLoading(false);
            return;
          }
          if (mounted) setUserId(users[0].id_app_user);
          // continue to fetch that user below
          const uid = users[0].id_app_user;
          const r2 = await fetch(`/api/users/${uid}`);
          if (!r2.ok) throw new Error('failed to fetch user');
          const u = await r2.json();
          if (!mounted) return;
          setProfileForm({
            name: u.name || '',
            email: u.email || '',
            sector: u.sector || '',
            interest_field: u.interest_field || '',
            target_position: u.target_position || '',
            minimum_salary: u.minimum_salary != null ? String(u.minimum_salary) : '',
            education_level: u.education_level || '',
            availability: u.availability || '',
            city: u.city || ''
          });
        } else {
          // prop provided
          const r = await fetch(`/api/users/${userId}`);
          if (!r.ok) throw new Error('failed to fetch user');
          const u = await r.json();
          if (!mounted) return;
          setProfileForm({
            name: u.name || '',
            email: u.email || '',
            sector: u.sector || '',
            interest_field: u.interest_field || '',
            target_position: u.target_position || '',
            minimum_salary: u.minimum_salary != null ? String(u.minimum_salary) : '',
            education_level: u.education_level || '',
            availability: u.availability || '',
            city: u.city || ''
          });
        }
      } catch (err) {
        console.error('Error pre-filling profile form', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [propUserId]);

  return (
    <AccordionItem>
      <AccordionHeader targetId="1">✅ Háblanos de tí</AccordionHeader>
      <AccordionBody accordionId="1">
        {loading ? <div>Cargando...</div> : (
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            const uid = userId;
            if (!uid) {
              console.warn('No user id available to save');
              setSavedMessage('No se encontró usuario para guardar');
              setTimeout(() => setSavedMessage(''), 3000);
              return;
            }
            // prepare payload
            const payload: any = { ...profileForm };
            // convert empty strings to null for optional fields
            for (const k of Object.keys(payload)) {
              if (payload[k] === '') payload[k] = null;
            }
            // numeric conversion for minimum_salary
            if (payload.minimum_salary != null) {
              const v = payload.minimum_salary;
              payload.minimum_salary = v === null ? null : Number(v);
            }

            const resp = await fetch(`/api/users/${uid}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!resp.ok) throw new Error('save failed');
            const saved = await resp.json();
            setSavedMessage('Datos guardados correctamente');
            // update form with normalized values
            setProfileForm({
              name: saved.name || '',
              email: saved.email || '',
              sector: saved.sector || '',
              interest_field: saved.interest_field || '',
              target_position: saved.target_position || '',
              minimum_salary: saved.minimum_salary != null ? String(saved.minimum_salary) : '',
              education_level: saved.education_level || '',
              availability: saved.availability || '',
              city: saved.city || ''
            });
            setTimeout(() => setSavedMessage(''), 3000);
          } catch (err) {
            console.error('Error saving profile', err);
            setSavedMessage('Error al guardar (ver consola)');
            setTimeout(() => setSavedMessage(''), 3000);
          }
  }}>
          <div className="row">
            <div className="col-md-6 mb-2">
              <label className="form-label">Nombre</label>
              <input className="form-control" name="name" value={profileForm.name} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} />
            </div>
            <div className="col-md-6 mb-2">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" name="email" value={profileForm.email} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} />
            </div>

            <div className="col-md-6 mb-2">
              <label className="form-label">Sector</label>
              <input className="form-control" name="sector" value={profileForm.sector} onChange={(e) => setProfileForm({...profileForm, sector: e.target.value})} />
            </div>
            <div className="col-md-6 mb-2">
              <label className="form-label">Áreas de interés <small className={styles.texto_secundario}>(Recomendamos poner 3, separadas por comas)</small></label>
              <input className="form-control" name="interest_field" value={profileForm.interest_field} onChange={(e) => setProfileForm({...profileForm, interest_field: e.target.value})} />
            </div>

            <div className="col-md-6 mb-2">
              <label className="form-label">Puesto objetivo</label>
              <input className="form-control" name="target_position" value={profileForm.target_position} onChange={(e) => setProfileForm({...profileForm, target_position: e.target.value})} />
            </div>
            <div className="col-md-6 mb-2">
              <label className="form-label">Salario mínimo</label>
              <input type="number" step="0.01" className="form-control" name="minimum_salary" value={profileForm.minimum_salary} onChange={(e) => setProfileForm({...profileForm, minimum_salary: e.target.value})} />
            </div>

            <div className="col-md-6 mb-2">
              <label className="form-label">Nivel educativo</label>
              <input className="form-control" name="education_level" value={profileForm.education_level} onChange={(e) => setProfileForm({...profileForm, education_level: e.target.value})} />
            </div>
            <div className="col-md-6 mb-2">
              <label className="form-label">Disponibilidad</label>
              <input className="form-control" name="availability" value={profileForm.availability} onChange={(e) => setProfileForm({...profileForm, availability: e.target.value})} />
            </div>

            <div className="col-12 mb-2">
              <label className="form-label">Ciudad</label>
              <input className="form-control" name="city" value={profileForm.city} onChange={(e) => setProfileForm({...profileForm, city: e.target.value})} />
            </div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-primary">Guardar</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setProfileForm({ name: '', email: '', sector: '', interest_field: '', target_position: '', minimum_salary: '', education_level: '', availability: '', city: '' }); setSavedMessage(''); }}>Limpiar</button>
            {savedMessage ? <div className="text-success ms-2">{savedMessage}</div> : null}
          </div>
        </form>
        )}
      </AccordionBody>
    </AccordionItem>
  );
}
