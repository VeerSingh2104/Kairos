import { useEffect, useMemo, useState } from 'react';
import { FiBell, FiBriefcase, FiFileText, FiHome, FiLogOut, FiSettings, FiTarget, FiUsers } from 'react-icons/fi';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import User from '../models/User';
import ResumeAnalyzer from '../components/ResumeAnalyzer';
import '../styles/components/dashboard.css';

const nav=[['overview','Overview',FiHome],['resume','Resume AI',FiFileText],['jobs','Jobs',FiBriefcase],['mentors','Mentors',FiUsers],['applications','Applications',FiTarget]];

export default function CandidateDashboard(){
 const navigate=useNavigate(),[record,setRecord]=useState(null),[active,setActive]=useState('overview');
 useEffect(()=>onAuthStateChanged(auth,async user=>{
  if(!user){navigate('/auth/login/candidate',{replace:true});return;}
  const data=await User.getById(user.uid);
  if(!data||data.role!=='candidate'){navigate('/auth/login/candidate',{replace:true});return;}
  if(!data.profileComplete){navigate('/profile-setup',{replace:true});return;}
  setRecord(data);
 }),[navigate]);
 const profile=record?.profileData||{},skills=profile.skills||[];
 const name=[profile.firstName,profile.lastName].filter(Boolean).join(' ')||'Candidate';
 const completion=useMemo(()=>Math.round(([profile.firstName,profile.lastName,profile.email,profile.headline,profile.location,skills.length].filter(Boolean).length/6)*100),[profile,skills]);
 const logout=async()=>{await signOut(auth);navigate('/',{replace:true});};
 if(!record)return <div className="dashboard-loading">Loading your Kairos workspace...</div>;
 return <div className="kairos-dashboard"><aside className="dashboard-sidebar">
  <div className="brand-lockup"><span className="brand-mark">K</span>Kairos</div>
  <div className="sidebar-profile"><div className="avatar">{name[0]}</div><div><strong>{name}</strong><span>Candidate</span></div></div>
  <nav className="dashboard-nav">{nav.map(([id,label,Icon])=><button key={id} className={active===id?'active':''} onClick={()=>setActive(id)}><Icon/>{label}</button>)}</nav>
  <div className="sidebar-bottom"><button onClick={()=>setActive('settings')}><FiSettings/>Settings</button><button onClick={logout}><FiLogOut/>Sign out</button></div>
 </aside><main className="dashboard-content">
  <header className="dashboard-topbar"><div><p className="eyebrow">CANDIDATE WORKSPACE</p><h1>{active==='overview'?'Good to see you, '+(profile.firstName||'there'):(active[0].toUpperCase()+active.slice(1))}</h1></div><button className="notification-btn"><FiBell/></button></header>
  {active==='overview'&&<><section className="hero-panel"><div><span className="status-pill">Profile active</span><h2>Your career workspace, in one place.</h2><p>Improve your resume, discover relevant roles and prepare for your next opportunity.</p></div><div className="profile-progress"><span>{completion}%</span><small>profile</small></div></section>
  <section className="metric-grid"><article className="metric-card"><span>Profile</span><strong>{completion}%</strong><small>completion</small></article><article className="metric-card"><span>Skills</span><strong>{skills.length}</strong><small>skills added</small></article><article className="metric-card"><span>Applications</span><strong>0</strong><small>tracked</small></article><article className="metric-card"><span>Mentors</span><strong>0</strong><small>connections</small></article></section>
  <section className="dashboard-grid"><article className="dashboard-panel wide"><p className="eyebrow">RESUME AI</p><h3>Turn your resume into a plan.</h3><p>Upload a PDF or DOCX and get skills, career direction and improvement suggestions.</p><button className="primary-btn" onClick={()=>setActive('resume')}><FiFileText/> Analyze resume</button></article><article className="dashboard-panel"><p className="eyebrow">PROFILE</p><h3>{profile.headline||'Your professional profile'}</h3><p>{profile.location||'Location not added'} · {profile.education?.[0]?.institution||'Education not added'}</p><div className="chip-list">{skills.slice(0,6).map(s=><span key={s}>{s}</span>)}</div></article></section></>}
  {active==='resume'&&<section className="dashboard-panel standalone"><ResumeAnalyzer/></section>}
  {['jobs','mentors','applications'].includes(active)&&<section className="dashboard-panel standalone empty-state"><FiBriefcase size={34}/><h2>{active==='jobs'?'Opportunity matching':active==='mentors'?'Mentorship':'Application tracking'}</h2><p>This module is wired into the candidate workspace and ready for its backend.</p></section>}
  {active==='settings'&&<section className="dashboard-panel standalone"><p className="eyebrow">ACCOUNT</p><h2>Settings</h2><p>{profile.email}</p><button className="secondary-btn" onClick={()=>navigate('/profile-setup')}>Edit profile</button></section>}
 </main></div>;
}