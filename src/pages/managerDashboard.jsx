import { useEffect, useState } from 'react';
import { FiBriefcase, FiClipboard, FiHome, FiLogOut, FiPlus, FiUsers, FiSettings } from 'react-icons/fi';
import { getFirestore, collection, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, firebaseApp } from '../firebase';
import User from '../models/User';
import '../styles/components/dashboard.css';

const db = getFirestore(firebaseApp);

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [record,setRecord]=useState(null);
  const [active,setActive]=useState('overview');
  const [jobs,setJobs]=useState([]);
  const [applications,setApplications]=useState([]);
  const [candidates,setCandidates]=useState([]);
  const [form,setForm]=useState({title:'',company:'',location:'Remote',description:'',skills:''});
  const [message,setMessage]=useState('');

  useEffect(()=>onAuthStateChanged(auth,async(user)=>{
    if(!user){navigate('/auth/login/manager',{replace:true});return;}
    const data=await User.getById(user.uid);
    if(!data||data.role!=='manager'){navigate('/auth/login/manager',{replace:true});return;}
    if(!data.profileComplete){navigate('/profile-setup',{replace:true});return;}
    setRecord(data);
    await Promise.all([loadJobs(user.uid),loadCandidates()]);
  }),[navigate]);

  const loadJobs=async(uid)=>{
    try{
      const snapshot=await getDocs(query(collection(db,'jobs'),where('managerId','==',uid),limit(50)));
      const items=snapshot.docs.map((item)=>({id:item.id,...item.data()}));
      setJobs(items);
      if(items.length){
        const apps=await getDocs(query(collection(db,'applications'),where('jobId','in',items.slice(0,10).map((item)=>item.id)),limit(50)));
        setApplications(apps.docs.map((item)=>({id:item.id,...item.data()})));
      }
    }catch(err){console.warn(err);}
  };

  const loadCandidates=async()=>{
    try{
      const snapshot=await getDocs(query(collection(db,'users'),where('role','==','candidate'),limit(50)));
      setCandidates(snapshot.docs.map((item)=>({id:item.id,...item.data()})));
    }catch(err){console.warn(err);}
  };

  const createJob=async(event)=>{
    event.preventDefault();
    if(!auth.currentUser||!form.title.trim()){return;}
    try{
      await addDoc(collection(db,'jobs'),{
        title:form.title.trim(),company:form.company.trim()||record.profileData?.firstName+' Hiring',
        location:form.location.trim()||'Remote',description:form.description.trim(),
        skills:form.skills.split(',').map((s)=>s.trim()).filter(Boolean),
        managerId:auth.currentUser.uid,managerName:[record.profileData?.firstName,record.profileData?.lastName].filter(Boolean).join(' '),
        status:'Open',createdAt:serverTimestamp()
      });
      setForm({title:'',company:'',location:'Remote',description:'',skills:''});
      setMessage('Job posted successfully.');
      await loadJobs(auth.currentUser.uid);
      setActive('jobs');
    }catch(err){setMessage('Could not post the job. Check Firestore permissions.');}
  };

  const logout=async()=>{await signOut(auth);navigate('/',{replace:true});};
  if(!record)return <div className="dashboard-loading">Loading manager workspace...</div>;
  const name=[record.profileData?.firstName,record.profileData?.lastName].filter(Boolean).join(' ')||'Manager';
  const nav=[['overview','Overview',FiHome],['jobs','Jobs',FiBriefcase],['applications','Applications',FiClipboard],['candidates','Candidates',FiUsers]];

  return <div className="kairos-dashboard">
    <aside className="dashboard-sidebar"><div className="brand-lockup"><span className="brand-mark">K</span>Kairos</div><div className="sidebar-profile"><div className="avatar">{name[0]}</div><div><strong>{name}</strong><span>Manager</span></div></div><nav className="dashboard-nav">{nav.map(([id,label,Icon])=><button key={id} className={active===id?'active':''} onClick={()=>setActive(id)}><Icon/>{label}</button>)}</nav><div className="sidebar-bottom"><button onClick={()=>navigate('/profile-setup')}><FiSettings/>Settings</button><button onClick={logout}><FiLogOut/>Sign out</button></div></aside>
    <main className="dashboard-content"><header className="dashboard-topbar"><div><p className="eyebrow">MANAGER WORKSPACE</p><h1>{active==='overview'?'Good to see you, '+(record.profileData?.firstName||'there'):active[0].toUpperCase()+active.slice(1)}</h1></div></header>{message&&<div className="dashboard-message" onClick={()=>setMessage('')}>{message}</div>}
      {active==='overview'&&<><section className="hero-panel"><div><span className="status-pill">Manager account active</span><h2>Recruit better, from one workspace.</h2><p>Publish roles, review applicants and build your candidate pipeline.</p></div><div className="profile-progress" style={{'--progress':'100%'}}><span>{jobs.length}</span><small>jobs</small></div></section><section className="metric-grid"><article className="metric-card"><span>Open roles</span><strong>{jobs.length}</strong><small>posted by you</small></article><article className="metric-card"><span>Applications</span><strong>{applications.length}</strong><small>received</small></article><article className="metric-card"><span>Candidates</span><strong>{candidates.length}</strong><small>in Kairos</small></article><article className="metric-card"><span>Profile</span><strong>100%</strong><small>complete</small></article></section><section className="dashboard-grid"><article className="dashboard-panel wide"><p className="eyebrow">HIRING</p><h3>Create a role</h3><p>Publish a job and candidates will see it in their Jobs workspace.</p><button className="primary-btn" onClick={()=>setActive('create')}><FiPlus/> Post a job</button></article><article className="dashboard-panel"><p className="eyebrow">RECENT</p><h3>{jobs[0]?.title||'No roles yet'}</h3><p>{jobs[0]?.description||'Create your first role to start receiving applications.'}</p></article></section></>}
      {active==='create'&&<section className="dashboard-panel standalone"><p className="eyebrow">NEW ROLE</p><h2>Post a job</h2><form className="job-form" onSubmit={createJob}><label>Job title<input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="Frontend Developer" required/></label><label>Company<input value={form.company} onChange={(e)=>setForm({...form,company:e.target.value})} placeholder="Company name"/></label><label>Location<input value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})}/></label><label>Skills<input value={form.skills} onChange={(e)=>setForm({...form,skills:e.target.value})} placeholder="React, TypeScript, Node.js"/></label><label className="full">Description<textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} placeholder="What will this person work on?"/></label><button className="primary-btn" type="submit"><FiPlus/> Publish role</button></form></section>}
      {active==='jobs'&&<section className="dashboard-panel standalone"><div className="section-heading"><div><p className="eyebrow">YOUR ROLES</p><h2>Job postings</h2></div><button className="primary-btn" onClick={()=>setActive('create')}><FiPlus/> New job</button></div><div className="job-list">{jobs.length?jobs.map((job)=><article className="job-card" key={job.id}><div><h3>{job.title}</h3><p>{job.company} · {job.location}</p><div className="chip-list">{(job.skills||[]).map((s)=><span key={s}>{s}</span>)}</div></div><b>{applications.filter((a)=>a.jobId===job.id).length} applicants</b></article>):<div className="empty-state"><FiBriefcase size={34}/><h2>No jobs posted</h2><p>Create a role to start your hiring pipeline.</p></div>}</div></section>}
      {active==='applications'&&<section className="dashboard-panel standalone"><p className="eyebrow">PIPELINE</p><h2>Applications</h2><div className="application-list">{applications.length?applications.map((item)=><article className="application-row" key={item.id}><div><strong>{item.candidateName||'Candidate'}</strong><span>{item.jobTitle} · {item.company}</span></div><b>{item.status||'Applied'}</b></article>):<div className="empty-state"><FiClipboard size={34}/><h2>No applications yet</h2><p>Applications will appear when candidates apply to your roles.</p></div>}</div></section>}
      {active==='candidates'&&<section className="dashboard-panel standalone"><p className="eyebrow">TALENT POOL</p><h2>Candidate profiles</h2><div className="candidate-grid">{candidates.map((candidate)=><article className="mentor-card" key={candidate.id}><div className="avatar">{(candidate.profileData?.firstName||'C')[0]}</div><h3>{[candidate.profileData?.firstName,candidate.profileData?.lastName].filter(Boolean).join(' ')||'Candidate'}</h3><p>{candidate.profileData?.headline||'Candidate profile'}</p><div className="chip-list">{(candidate.profileData?.skills||[]).slice(0,5).map((s)=><span key={s}>{s}</span>)}</div></article>)}</div></section>}
    </main>
  </div>;
}
