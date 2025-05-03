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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user role and profile from Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setRole(data.role || data.userRole || null);
          setProfileData(data);
          // Check if profile is complete (simple check: firstName exists)
          if (data.firstName && data.firstName.trim() !== '') {
            setProfileComplete(true);
          }
        }
      } else {
        navigate('/auth/login/candidate');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Removed redirect to /dashboard/main to prevent blank page
  // useEffect(() => {
  //   if (profileComplete) {
  //     // Redirect to main dashboard if profile is complete
  //     navigate('/dashboard/main', { replace: true });
  //   }
  // }, [profileComplete, navigate]);

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
        await setDoc(userRef, profileData, { merge: true });
        alert('Profile saved successfully!');
        setProfileComplete(true);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Candidate Dashboard</h1>
        <button 
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
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
            </section>
            <section className="dashboard-features">
              <div className="feature-card">
                <h3>Profile Management</h3>
                <p>Update your personal information, education, experience, and skills anytime.</p>
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
