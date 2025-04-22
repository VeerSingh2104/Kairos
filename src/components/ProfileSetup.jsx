import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import '../styles/components/components.css';

const ProfileSetup = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    education: [{ institution: '', degree: '', year: '' }],
    experience: [{ company: '', position: '', duration: '' }],
    skills: ['']
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNext = () => step < 4 ? setStep(step + 1) : onComplete(formData);
  const handleBack = () => step > 1 && setStep(step - 1);

  const handleInputChange = (e, index, field) => {
    const { name, value } = e.target;
    if (field) {
      const updatedArray = [...formData[field]];
      updatedArray[index] = { ...updatedArray[index], [name]: value };
      setFormData(prev => ({ ...prev, [field]: updatedArray }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addItem = (field) => {
    const template = field === 'education' 
      ? { institution: '', degree: '', year: '' }
      : field === 'experience'
      ? { company: '', position: '', duration: '' }
      : '';
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], template]
    }));
  };

  const removeItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="profile-setup-container">
      <div className="profile-header">
        {step === 0 ? (
          <>
            <h1 className="welcome-message-large">Hello! Let's set up your profile</h1>
            <div className="wizard-actions">
              <button 
                onClick={() => setStep(1)}
              >
                Ok, sounds great!
              </button>
            </div>
          </>
        ) : (
          <h2 className="welcome-message">Hi! Let's set up your profile</h2>
        )}
      </div>
      
      <div className="setup-content">
        {step === 1 && (
          <div className="setup-step">
            <h3>Basic Information</h3>
            <div className="form-group">
              <label>First Name</label>
              <input 
                type="text" 
                name="firstName" 
                value={formData.firstName}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input 
                type="text" 
                name="lastName" 
                value={formData.lastName}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone}
                onChange={(e) => handleInputChange(e)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="setup-step">
            <h3>Education</h3>
            {formData.education.map((edu, index) => (
              <div key={index} className="education-item">
                <div className="form-group">
                  <label>Institution</label>
                  <input
                    type="text"
                    name="institution"
                    value={edu.institution}
                    onChange={(e) => handleInputChange(e, index, 'education')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Degree</label>
                  <input
                    type="text"
                    name="degree"
                    value={edu.degree}
                    onChange={(e) => handleInputChange(e, index, 'education')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="text"
                    name="year"
                    value={edu.year}
                    onChange={(e) => handleInputChange(e, index, 'education')}
                  />
                </div>
                {index > 0 && (
                  <button 
                    className="remove-btn"
                    onClick={() => removeItem('education', index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button 
              className="add-btn"
              onClick={() => addItem('education')}
            >
              Add Education
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="setup-step">
            <h3>Experience</h3>
            {formData.experience.map((exp, index) => (
              <div key={index} className="experience-item">
                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    name="company"
                    value={exp.company}
                    onChange={(e) => handleInputChange(e, index, 'experience')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    name="position"
                    value={exp.position}
                    onChange={(e) => handleInputChange(e, index, 'experience')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duration (years)</label>
                  <input
                    type="number"
                    name="duration"
                    value={exp.duration}
                    onChange={(e) => handleInputChange(e, index, 'experience')}
                  />
                </div>
                {index > 0 && (
                  <button 
                    className="remove-btn"
                    onClick={() => removeItem('experience', index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button 
              className="add-btn"
              onClick={() => addItem('experience')}
            >
              Add Experience
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="setup-step">
            <h3>Skills</h3>
            {formData.skills.map((skill, index) => (
              <div key={index} className="skill-item">
                <div className="form-group">
                  <label>Skill {index + 1}</label>
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => {
                      const newSkills = [...formData.skills];
                      newSkills[index] = e.target.value;
                      setFormData(prev => ({ ...prev, skills: newSkills }));
                    }}
                    required
                  />
                </div>
                {index > 0 && (
                  <button 
                    className="remove-btn"
                    onClick={() => removeItem('skills', index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button 
              className="add-btn"
              onClick={() => addItem('skills')}
            >
              Add Skill
            </button>
          </div>
        )}
      </div>

      {step > 0 && (
        <div className="wizard-actions setup-actions">
          {step > 1 && (
            <button className="back-btn" onClick={handleBack}>
              Back
            </button>
          )}
          <button className="next-btn" onClick={handleNext}>
            {step === 4 ? 'Complete Profile' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileSetup;