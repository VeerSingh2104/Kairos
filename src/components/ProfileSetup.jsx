import { useEffect, useState } from 'react';
import '../styles/components/components.css';

const blank = {
  firstName: '', lastName: '', email: '', phone: '', headline: '', location: '', bio: '',
  education: [{ institution: '', degree: '', year: '' }],
  experience: [{ company: '', position: '', duration: '' }],
  skills: ['']
};

export default function ProfileSetup({ onComplete, autofillData, onLogout }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (autofillData) {
      setData({ ...blank, ...autofillData, skills: autofillData.skills?.length ? autofillData.skills : [''] });
    }
  }, [autofillData]);

  const update = (field, value) => setData((prev) => ({ ...prev, [field]: value }));
  const updateArray = (field, index, key, value) => setData((prev) => ({
    ...prev, [field]: prev[field].map((item, i) => i === index ? { ...item, [key]: value } : item)
  }));
  const add = (field) => {
    const item = field === 'education' ? { institution: '', degree: '', year: '' } : field === 'experience' ? { company: '', position: '', duration: '' } : '';
    setData((prev) => ({ ...prev, [field]: [...prev[field], item] }));
  };
  const remove = (field, index) => setData((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));

  const next = () => setStep((value) => Math.min(4, value + 1));
  const back = () => setStep((value) => Math.max(1, value - 1));
  const complete = async () => {
    setSaving(true);
    await onComplete({
      ...data,
      skills: data.skills.map((s) => s.trim()).filter(Boolean),
      education: data.education.filter((item) => item.institution || item.degree || item.year),
      experience: data.experience.filter((item) => item.company || item.position || item.duration)
    });
    setSaving(false);
  };

  return (
    <main className="profile-setup-container">
      <section className="profile-wizard">
        <div className="profile-wizard-top">
          <div><p className="eyebrow">KAIROS PROFILE</p><h1>Build your professional profile</h1><p>Complete the basics once. Your resume AI and career workspace can use this information later.</p></div>
          {onLogout && <button className="wizard-logout" onClick={onLogout}>Sign out</button>}
        </div>
        <div className="setup-progress"><span style={{ width: `${step * 25}%` }} /></div>
        <div className="setup-step-label">Step {step} of 4</div>

        {step === 1 && <div className="setup-grid">
          <label>First name<input value={data.firstName} onChange={(e) => update('firstName', e.target.value)} required /></label>
          <label>Last name<input value={data.lastName} onChange={(e) => update('lastName', e.target.value)} /></label>
          <label>Email<input value={data.email} onChange={(e) => update('email', e.target.value)} type="email" required /></label>
          <label>Phone<input value={data.phone} onChange={(e) => update('phone', e.target.value)} /></label>
          <label className="full">Professional headline<input value={data.headline} onChange={(e) => update('headline', e.target.value)} placeholder="Computer Science student | Frontend Developer" /></label>
          <label>Location<input value={data.location} onChange={(e) => update('location', e.target.value)} placeholder="Noida, India" /></label>
          <label className="full">About you<textarea value={data.bio} onChange={(e) => update('bio', e.target.value)} placeholder="A short professional introduction..." /></label>
        </div>}

        {step === 2 && <div className="setup-list">
          <h2>Education</h2>
          {data.education.map((item, index) => <div className="setup-item" key={index}>
            <label>Institution<input value={item.institution} onChange={(e) => updateArray('education', index, 'institution', e.target.value)} /></label>
            <label>Degree<input value={item.degree} onChange={(e) => updateArray('education', index, 'degree', e.target.value)} /></label>
            <label>Year<input value={item.year} onChange={(e) => updateArray('education', index, 'year', e.target.value)} /></label>
            {index > 0 && <button className="remove-btn" onClick={() => remove('education', index)}>Remove</button>}
          </div>)}
          <button className="add-btn" onClick={() => add('education')}>+ Add education</button>
        </div>}

        {step === 3 && <div className="setup-list">
          <h2>Experience</h2>
          {data.experience.map((item, index) => <div className="setup-item" key={index}>
            <label>Company<input value={item.company} onChange={(e) => updateArray('experience', index, 'company', e.target.value)} /></label>
            <label>Position<input value={item.position} onChange={(e) => updateArray('experience', index, 'position', e.target.value)} /></label>
            <label>Duration<input value={item.duration} onChange={(e) => updateArray('experience', index, 'duration', e.target.value)} placeholder="6 months" /></label>
            {index > 0 && <button className="remove-btn" onClick={() => remove('experience', index)}>Remove</button>}
          </div>)}
          <button className="add-btn" onClick={() => add('experience')}>+ Add experience</button>
        </div>}

        {step === 4 && <div className="setup-list">
          <h2>Skills</h2>
          <p>Add the technologies and strengths you want Kairos to use for matching.</p>
          <div className="skills-editor">{data.skills.map((skill, index) => <div className="skill-editor-row" key={index}><input value={skill} onChange={(e) => setData((prev) => ({ ...prev, skills: prev.skills.map((s, i) => i === index ? e.target.value : s) }))} placeholder="React" />{index > 0 && <button className="remove-btn" onClick={() => remove('skills', index)}>×</button>}</div>)}</div>
          <button className="add-btn" onClick={() => add('skills')}>+ Add skill</button>
        </div>}

        <div className="wizard-actions setup-actions">
          <button className="back-btn" onClick={back} disabled={step === 1}>Back</button>
          {step < 4 ? <button className="next-btn" onClick={next}>Continue</button> : <button className="next-btn" onClick={complete} disabled={saving}>{saving ? 'Saving…' : 'Complete profile'}</button>}
        </div>
      </section>
    </main>
  );
}
