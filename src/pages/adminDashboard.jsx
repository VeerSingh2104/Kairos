import { useEffect, useState } from 'react';
import { FiActivity, FiLogOut, FiShield, FiUsers, FiSettings } from 'react-icons/fi';
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, firebaseApp } from '../firebase';
import User from '../models/User';
import '../styles/components/dashboard.css';

const db=getFirestore(firebaseApp);

export default function AdminDashboard(){
  const navigate=useNavigate();
  const [record,setRecord]=useState(null);
  const [users,setUsers]=useState([]);
  const [active,setActive]=useState('overview');
  const [message,setMessage]=useState('');

  useEffect(()=>onAuthStateChanged(auth,async(user)=>{
    if(!user){navigate('/auth/login/admin',{replace:true});return;}
    const data=await User.getById(user.uid);
    if(!data||data.role!=='admin'){navigate('/auth/login/admin',{replace:true});return;}
    setRecord(data);
    loadUsers();
  }),[navigate]);

  const loadUsers=async()=>{
    try{
      const snapshot=await getDocs(query(collection(db,'users'),limit(100)));
      setUsers(snapshot.docs.map((item)=>({id:item.id,...item.data()})));
    }catch(err){setMessage('Could not load users. Check Firestore permissions.');}
  };

  const toggleStatus=async(item)=>{
    const next=item.status==='suspended'?'active':'suspended';
    try{await updateDoc(doc(db,'users',item.id),{status:next});setUsers((items)=>items.map((u)=>u.id===item.id?{...u,status:next}:u));}
    catch(err){setMessage('Unable to update user status.');}
  };

  const logout=async()=>{await signOut(auth);navigate('/',{replace:true});};
  if(!record)return <div className="dashboard-loading">Loading admin workspace...</div>;
  const candidates=users.filter((u)=>u.role==='candidate').length;
  const managers=users.filter((u)=>u.role==='manager').length;
  const admins=users.filter((u)=>u.role==='admin').length;
  const nav=[['overview','Overview',FiActivity],['users','Users',FiUsers]];

  return <div className="kairos-dashboard"><aside className="dashboard-sidebar"><div className="brand-lockup"><span className="brand-mark">K</span>Kairos</div><div className="sidebar-profile"><div className="avatar">A</div><div><strong>Administrator</strong><span>Admin</span></div></div><nav className="dashboard-nav">{nav.map(([id,label,Icon])=><button key={id} className={active===id?'active':''} onClick={()=>setActive(id)}><Icon/>{label}</button>)}</nav><div className="sidebar-bottom"><button onClick={()=>navigate('/profile-setup')}><FiSettings/>Settings</button><button onClick={logout}><FiLogOut/>Sign out</button></div></aside>
  <main className="dashboard-content"><header className="dashboard-topbar"><div><p className="eyebrow">ADMIN WORKSPACE</p><h1>{active==='overview'?'Platform overview':'User management'}</h1></div><FiShield size={25}/></header>{message&&<div className="dashboard-message">{message}</div>}
  {active==='overview'&&<><section className="hero-panel"><div><span className="status-pill">System access active</span><h2>Keep the Kairos workspace healthy.</h2><p>Monitor users, roles and profile activity from one place.</p></div><div className="profile-progress" style={{'--progress':'100%'}}><span>{users.length}</span><small>users</small></div></section><section className="metric-grid"><article className="metric-card"><span>Candidates</span><strong>{candidates}</strong><small>registered</small></article><article className="metric-card"><span>Managers</span><strong>{managers}</strong><small>registered</small></article><article className="metric-card"><span>Admins</span><strong>{admins}</strong><small>registered</small></article><article className="metric-card"><span>Total</span><strong>{users.length}</strong><small>accounts</small></article></section><section className="dashboard-panel standalone"><p className="eyebrow">RECENT USERS</p><h2>Latest platform accounts</h2><div className="application-list">{users.slice(0,6).map((u)=><article className="application-row" key={u.id}><div><strong>{[u.profileData?.firstName,u.profileData?.lastName].filter(Boolean).join(' ')||u.profileData?.email||'User'}</strong><span>{u.profileData?.email||'No email'} · {u.role}</span></div><b>{u.status||'active'}</b></article>)}</div></section></>}
  {active==='users'&&<section className="dashboard-panel standalone"><div className="section-heading"><div><p className="eyebrow">ACCOUNT DIRECTORY</p><h2>All users</h2></div><span>{users.length} accounts</span></div><div className="application-list">{users.map((u)=><article className="application-row" key={u.id}><div><strong>{[u.profileData?.firstName,u.profileData?.lastName].filter(Boolean).join(' ')||'User'}</strong><span>{u.profileData?.email||'No email'} · {u.role}</span></div><button className="secondary-btn" onClick={()=>toggleStatus(u)}>{u.status==='suspended'?'Restore':'Suspend'}</button></article>)}</div></section>}</main></div>;
}
