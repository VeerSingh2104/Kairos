import { useEffect, useMemo, useState } from 'react';
import { FiBell, FiBriefcase, FiFileText, FiHome, FiLogOut, FiSettings, FiTarget, FiUsers, FiMapPin, FiSend } from 'react-icons/fi';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, firebaseApp } from '../firebase';
import User from '../models/User';
import ResumeAnalyzer from '../components/ResumeAnalyzer';
import '../styles/components/dashboard.css';

const db = getFirestore(firebaseApp);
const nav = [['overview','Overview',FiHome],['resume','Resume AI',FiFileText],['jobs','Jobs',FiBriefcase],['mentors','Mentors',FiUsers],['applications','Applications',FiTarget]];

const normalize = (value = '') => value.toLowerCase().replace(/[.\/_-]/g, ' ').replace(/\\s+/g, ' ').trim();

function scoreJob(job, resume) {
  if (!resume) return { score: 0, matchedSkills: [], reasons: [] };

  const resumeSkills = [...new Set([
    ...(resume.skills || []),
    ...(resume.recommended_skills || []),
    ...(resume.ats_keywords || [])
  ].map(normalize).filter(Boolean))];

  const jobSkills = [...new Set((job.skills || []).map(normalize).filter(Boolean))];
  const matchedSkills = jobSkills.filter((jobSkill) =>
    resumeSkills.some((resumeSkill) =>
      resumeSkill === jobSkill || resumeSkill.includes(jobSkill) || jobSkill.includes(resumeSkill)
    )
  );

  const searchableJob = normalize([job.title, job.description, job.company].join(' '));
  const roles = (resume.recommended_roles || []).map(normalize);
  const careerField = normalize(resume.career_field || '');
  const roleMatch = roles.some((role) => role && (searchableJob.includes(role) || role.includes(normalize(job.title))));
  const fieldMatch = careerField && searchableJob.includes(careerField);

  const skillScore = jobSkills.length ? (matchedSkills.length / jobSkills.length) * 65 : 0;
  const roleScore = roleMatch ? 25 : fieldMatch ? 18 : 0;
  const keywordScore = resumeSkills.length
    ? Math.min(10, resumeSkills.filter((skill) => searchableJob.includes(skill)).length * 2)
    : 0;

  const score = Math.min(100, Math.round(skillScore + roleScore + keywordScore));
  const reasons = [];
  if (matchedSkills.length) reasons.push(`${matchedSkills.length} matching skill${matchedSkills.length > 1 ? 's' : ''}`);
  if (roleMatch) reasons.push('career role match');
  else if (fieldMatch) reasons.push('career field match');

  return { score, matchedSkills, reasons };
}

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [record,setRecord] = useState(null);
  const [active,setActive] = useState('overview');
  const [jobs,setJobs] = useState([]);
  const [applications,setApplications] = useState([]);
  const [mentors,setMentors] = useState([]);
  const [message,setMessage] = useState('');

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { navigate('/auth/login/candidate',{replace:true}); return; }
    const data = await User.getById(user.uid);
    if (!data || data.role !== 'candidate') { navigate('/auth/login/candidate',{replace:true}); return; }
    if (!data.profileComplete) { navigate('/profile-setup',{replace:true}); return; }
    setRecord(data);
    setResumeInsights(data.resumeInsights || null);
    await Promise.all([loadJobs(user.uid), loadApplications(user.uid), loadMentors()]);
  }), [navigate]);

  const loadJobs = async () => {
    try {
      const snapshot = await getDocs(query(collection(db,'jobs'), orderBy('createdAt','desc'), limit(30)));
      setJobs(snapshot.docs.map((item) => ({id:item.id,...item.data()})));
    } catch (err) { console.warn('Jobs unavailable',err); }
  };

  const loadApplications = async (uid) => {
    try {
      const snapshot = await getDocs(query(collection(db,'applications'), where('candidateId','==',uid), limit(30)));
      setApplications(snapshot.docs.map((item) => ({id:item.id,...item.data()})));
    } catch (err) { console.warn('Applications unavailable',err); }
  };

  const loadMentors = async () => {
    try {
      const snapshot = await getDocs(query(collection(db,'users'), where('role','==','manager'), limit(20)));
      setMentors(snapshot.docs.map((item) => ({id:item.id,...item.data()})));
    } catch (err) { console.warn('Mentors unavailable',err); }
  };

  const apply = async (job) => {
    if (!auth.currentUser) return;
    if (applications.some((item) => item.jobId === job.id)) { setMessage('You already applied to this role.'); return; }
    try {
      await addDoc(collection(db,'applications'), {
        jobId: job.id, jobTitle: job.title, company: job.company || 'Kairos employer', managerId: job.managerId || '',
        candidateId: auth.currentUser.uid, candidateName: [record.profileData.firstName,record.profileData.lastName].filter(Boolean).join(' '),
        status:'Applied', createdAt:serverTimestamp()
      });
      setMessage('Application submitted.');
      await loadApplications(auth.currentUser.uid);
    } catch (err) { setMessage('Could not submit the application. Check Firestore permissions.'); }
  };

  const handleResumeInsights = async (analysis) => {
    if (!analysis || !auth.currentUser) return;
    setResumeInsights(analysis);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        resumeInsights: {
          career_field: analysis.career_field || '',
          skills: analysis.skills || [],
          recommended_skills: analysis.recommended_skills || [],
          recommended_roles: analysis.recommended_roles || [],
          ats_keywords: analysis.ats_keywords || [],
          score: Number(analysis.score) || 0,
          mode: analysis.mode || 'local',
          updatedAt: new Date().toISOString()
        }
      });
      setMessage('Resume insights saved. Your job recommendations are now personalized.');
    } catch (err) {
      console.warn('Could not save resume insights:', err);
    }
  };

  const rankedJobs = useMemo(() => {
    return jobs
      .map((job) => ({ ...job, match: scoreJob(job, resumeInsights) }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [jobs, resumeInsights]);

  const profile = record?.profileData || {};
  const skills = profile.skills || [];
  const name = [profile.firstName,profile.lastName].filter(Boolean).join(' ') || 'Candidate';
  const completion = useMemo(() => Math.round(([profile.firstName,profile.lastName,profile.email,profile.headline,profile.location,skills.length].filter(Boolean).length/6)*100), [profile,skills]);
  const logout = async () => { await signOut(auth); navigate('/',{replace:true}); };
  if (!record) return <div className="dashboard-loading">Loading your Kairos workspace...</div>;

  const title = active === 'overview' ? 'Good to see you, ' + (profile.firstName || 'there') : active === 'resume' ? 'Resume AI' : active[0].toUpperCase()+active.slice(1);

  return <div className="kairos-dashboard">
    <aside className="dashboard-sidebar">
      <div className="brand-lockup"><span className="brand-mark">K</span>Kairos</div>
      <div className="sidebar-profile"><div className="avatar">{name[0]}</div><div><strong>{name}</strong><span>Candidate</span></div></div>
      <nav className="dashboard-nav">{nav.map(([id,label,Icon]) => <button key={id} className={active===id?'active':''} onClick={() => setActive(id)}><Icon/>{label}</button>)}</nav>
      <div className="sidebar-bottom"><button onClick={() => setActive('settings')}><FiSettings/>Settings</button><button onClick={logout}><FiLogOut/>Sign out</button></div>
    </aside>

    <main className="dashboard-content">
      <header className="dashboard-topbar"><div><p className="eyebrow">CANDIDATE WORKSPACE</p><h1>{title}</h1></div><button className="notification-btn"><FiBell/></button></header>
      {message && <div className="dashboard-message" onClick={() => setMessage('')}>{message}</div>}

      {active==='overview' && <>
        <section className="hero-panel"><div><span className="status-pill">Profile active</span><h2>Your career workspace, in one place.</h2><p>Improve your resume, discover relevant roles, connect with mentors and track applications.</p></div><div className="profile-progress" style={{'--progress': completion + '%'}}><span>{completion}%</span><small>profile</small></div></section>
        <section className="metric-grid"><article className="metric-card"><span>Profile</span><strong>{completion}%</strong><small>completion</small></article><article className="metric-card"><span>Skills</span><strong>{skills.length}</strong><small>skills added</small></article><article className="metric-card"><span>Applications</span><strong>{applications.length}</strong><small>tracked</small></article><article className="metric-card"><span>Mentors</span><strong>{mentors.length}</strong><small>available</small></article></section>
        <section className="dashboard-grid"><article className="dashboard-panel wide"><p className="eyebrow">RESUME AI</p><h3>Turn your resume into a plan.</h3><p>Get an ATS score, skills, career direction, improvement suggestions and interview questions.</p><button className="primary-btn" onClick={() => setActive('resume')}><FiFileText/> Analyze resume</button></article><article className="dashboard-panel"><p className="eyebrow">PROFILE</p><h3>{profile.headline || 'Your professional profile'}</h3><p>{profile.location || 'Location not added'} · {profile.education?.[0]?.institution || 'Education not added'}</p><div className="chip-list">{skills.slice(0,6).map((s)=><span key={s}>{s}</span>)}</div></article></section>
      </>}

      {active==='resume' && <section className="dashboard-panel standalone"><ResumeAnalyzer onExtractedData={handleResumeInsights} /></section>}

      {active==='jobs' && <section className="dashboard-panel standalone"><div className="section-heading"><div><p className="eyebrow">AI JOB MATCHING</p><h2>Jobs matched to your resume</h2><p className="section-subtitle">{resumeInsights ? `Ranked using your ${resumeInsights.career_field || 'career'} profile and detected skills.` : 'Analyze your resume first to unlock personalized job matching.'}</p></div><span>{jobs.length} roles</span></div>{!resumeInsights && <div className="dashboard-message"><FiFileText/> Analyze your resume in Resume AI to personalize these recommendations.</div>}<div className="job-list">{rankedJobs.length ? rankedJobs.map((job)=><article className="job-card" key={job.id}><div className="job-main"><div className="job-title-row"><h3>{job.title}</h3>{resumeInsights && <span className="match-badge">{job.match.score}% match</span>}</div><p>{job.company || 'Hiring team'} · <FiMapPin/> {job.location || 'Remote'}</p><div className="chip-list">{(job.skills || []).slice(0,6).map((s)=><span key={s} className={job.match.matchedSkills.some((m)=>normalize(m)===normalize(s)||normalize(m).includes(normalize(s))||normalize(s).includes(normalize(m))) ? 'matched-chip' : ''}>{s}</span>)}</div>{resumeInsights && job.match.reasons.length > 0 && <p className="match-reason">{job.match.reasons.join(' · ')}</p>}</div><button className="primary-btn" onClick={()=>apply(job)}><FiSend/> Apply</button></article>) : <div className="empty-state"><FiBriefcase size={34}/><h2>No jobs yet</h2><p>Manager-posted opportunities will appear here.</p></div>}</div></section>}

      {active==='mentors' && <section className="dashboard-panel standalone"><p className="eyebrow">MENTORSHIP</p><h2>Connect with industry professionals</h2><div className="mentor-grid">{mentors.length ? mentors.map((mentor)=><article className="mentor-card" key={mentor.id}><div className="avatar">{(mentor.profileData?.firstName || 'M')[0]}</div><h3>{[mentor.profileData?.firstName,mentor.profileData?.lastName].filter(Boolean).join(' ') || 'Industry mentor'}</h3><p>{mentor.profileData?.headline || 'Hiring manager / industry professional'}</p><span>{mentor.profileData?.location || 'Location not listed'}</span><button className="secondary-btn">Request mentorship</button></article>) : <div className="empty-state"><FiUsers size={34}/><h2>No mentors yet</h2><p>Managers who complete their profiles will appear here.</p></div>}</div></section>}

      {active==='applications' && <section className="dashboard-panel standalone"><p className="eyebrow">APPLICATIONS</p><h2>Your application pipeline</h2><div className="application-list">{applications.length ? applications.map((item)=><article className="application-row" key={item.id}><div><strong>{item.jobTitle}</strong><span>{item.company}</span></div><b>{item.status || 'Applied'}</b></article>) : <div className="empty-state"><FiTarget size={34}/><h2>No applications yet</h2><p>Apply to a role from the Jobs tab and it will appear here.</p></div>}</div></section>}

      {active==='settings' && <section className="dashboard-panel standalone"><p className="eyebrow">ACCOUNT</p><h2>Settings</h2><p>{profile.email}</p><button className="secondary-btn" onClick={()=>navigate('/profile-setup')}>Edit profile</button></section>}
    </main>
  </div>;
}
