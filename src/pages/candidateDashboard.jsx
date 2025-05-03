import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import ProfileSetup from '../components/ProfileSetup';
import ResumeAnalyzer from '../components/ResumeAnalyzer';
import '../styles/components/dashboard.css';

const db = getFirestore();

function CandidateDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [autofillData, setAutofillData] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setRole(data.role || data.userRole || null);
          setProfileData(data);
          if (data.profileComplete === true) {
            setProfileComplete(true);
          }
        }
      } else {
        navigate('/auth/login/candidate');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (profileData?.profileData) {
      setEditedProfile({ ...profileData.profileData });
    }
  }, [profileData]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileComplete = async (profileData) => {
    try {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          profileData: profileData,
          profileComplete: true
        }, { merge: true });
        alert('Profile saved successfully!');
        setProfileComplete(true);
        setProfileData(prev => ({ ...prev, profileData }));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const toggleEdit = () => setIsEditing(!isEditing);

  const handleInputChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEducationChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      education: [{ ...prev.education?.[0], [field]: value }]
    }));
  };

  const handleExperienceChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      experience: [{ ...prev.experience?.[0], [field]: value }]
    }));
  };

  const saveEdits = () => {
    handleProfileComplete(editedProfile);
    setIsEditing(false);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Candidate Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      <main className="dashboard-main-content">
        {user && !profileComplete && (
          <div className="profile-setup-section">
            <ProfileSetup
              onComplete={handleProfileComplete}
              autofillData={autofillData}
            />
            <ResumeAnalyzer onExtractedData={setAutofillData} />
          </div>
        )}

        {user && profileComplete && (
          <div className="main-dashboard-content">
            <h2>Welcome to your main dashboard</h2>
            <section className="dashboard-welcome">
              <p>Here you can manage your profile, upload resumes, and explore job opportunities tailored for you.</p>
              <section className="profile-details">
                <h3>Your Profile Summary</h3>
                <p><strong>Full Name:</strong> {profileData?.profileData?.firstName || 'N/A'} {profileData?.profileData?.lastName || ''}</p>
                <p><strong>Email:</strong> {profileData?.profileData?.email || 'N/A'}</p>
                <p><strong>Institution:</strong> {profileData?.profileData?.education?.[0]?.institution || 'N/A'}</p>
                <p><strong>Degree:</strong> {profileData?.profileData?.education?.[0]?.degree || 'N/A'}</p>
                <p><strong>Experience:</strong> {profileData?.profileData?.experience?.[0]?.company || 'N/A'}</p>
              </section>
            </section>

            <section className="dashboard-features">
              <div className="feature-card">
                <h3>Profile Management</h3>
                {!isEditing ? (
                  <>
                    <p>
                      <strong>Name:</strong> {profileData?.profileData?.firstName} {profileData?.profileData?.lastName}<br />
                      <strong>Email:</strong> {profileData?.profileData?.email}<br />
                      <strong>Education:</strong> {profileData?.profileData?.education?.[0]?.degree} @ {profileData?.profileData?.education?.[0]?.institution} ({profileData?.profileData?.education?.[0]?.year})<br />
                      <strong>Experience:</strong> {profileData?.profileData?.experience?.[0]?.position} at {profileData?.profileData?.experience?.[0]?.company}
                    </p>
                    <button onClick={toggleEdit}>Edit Profile</button>
                  </>
                ) : (
                  <>
                    <div className="edit-form">
                      <input
                        type="text"
                        placeholder="First Name"
                        value={editedProfile?.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={editedProfile?.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={editedProfile?.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Institution"
                        value={editedProfile?.education?.[0]?.institution || ''}
                        onChange={(e) => handleEducationChange('institution', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Degree"
                        value={editedProfile?.education?.[0]?.degree || ''}
                        onChange={(e) => handleEducationChange('degree', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Year"
                        value={editedProfile?.education?.[0]?.year || ''}
                        onChange={(e) => handleEducationChange('year', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Company"
                        value={editedProfile?.experience?.[0]?.company || ''}
                        onChange={(e) => handleExperienceChange('company', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Position"
                        value={editedProfile?.experience?.[0]?.position || ''}
                        onChange={(e) => handleExperienceChange('position', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Duration"
                        value={editedProfile?.experience?.[0]?.duration || ''}
                        onChange={(e) => handleExperienceChange('duration', e.target.value)}
                      />
                      <button onClick={saveEdits}>Save</button>
                      <button onClick={toggleEdit}>Cancel</button>
                    </div>
                  </>
                )}
              </div>

              <div className="feature-card">
                <h3>Resume Analyzer</h3>
                <p>Upload your resume to get skill recommendations and job matching insights.</p>
              </div>

              <div className="feature-card">
                <h3>Job Opportunities</h3>
                <p>Browse and apply to jobs that match your profile and preferences.</p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default CandidateDashboard;
