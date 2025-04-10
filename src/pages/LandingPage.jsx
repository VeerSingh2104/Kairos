import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/base.css'
import '../styles/components/navbar.css'
import '../styles/components/hero.css'
import '../styles/components/features.css'
import '../styles/components/sections.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const contentRef = useRef(null)

  useEffect(() => {
    // Navbar scroll effect
    const handleScroll = () => {
      const navbar = document.querySelector('.navbar')
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled')
      } else {
        navbar.classList.remove('scrolled')
      }

      // Content slide-up animation with staggered delays
      const contentElements = document.querySelectorAll('[data-scroll]')
      contentElements.forEach((el, index) => {
        const elementTop = el.getBoundingClientRect().top
        const windowHeight = window.innerHeight
        if (elementTop < windowHeight - 100) {
          el.setAttribute('data-scroll', 'in')
          // Set staggered delays for text elements
          const textElements = el.querySelectorAll('h1, h2, h3, h4, p, li, span')
          textElements.forEach((textEl, i) => {
            textEl.style.setProperty('--delay', `${i * 0.1}s`)
          })
        }
      })
    }

    // Counter animation
    const stats = [
      { element: document.querySelectorAll('.stat-number')[0], target: 500, duration: 2500 },
      { element: document.querySelectorAll('.stat-number')[1], target: 10000, duration: 2500 },
      { element: document.querySelectorAll('.stat-number')[2], target: 95, duration: 2500 }
    ]

    const animateCounters = () => {
      document.querySelectorAll('.stat-number').forEach(el => {
        el.classList.add('animate')
      })

      stats.forEach(stat => {
        const startTime = Date.now()
        const endTime = startTime + stat.duration
        const startValue = 0
        
        const updateCounter = () => {
          const now = Date.now()
          const progress = Math.min((now - startTime) / stat.duration, 1)
          const currentValue = Math.floor(progress * stat.target)
          
          stat.element.textContent = currentValue === stat.target ? 
            `${currentValue}${stat.target === 95 ? '%' : '+'}` : 
            `${currentValue}${stat.target === 95 ? '%' : '+'}`
            
          if (progress < 1) {
            requestAnimationFrame(updateCounter)
          }
        }
        
        updateCounter()
      })
    }

    // Initialize animations
    const timer = setTimeout(animateCounters, 500)
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Trigger on initial load

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
  return (
    <div className="landing-container">
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">Kairos</div>
          <div className="nav-right-group">
            <div className="nav-links">
              <a href="#about">About Us</a>
              <a href="#pricing">Pricing</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="auth-buttons">
              <button 
                className="login-btn"
                onClick={() => navigate('/auth/role-selection?action=login')}
              >
                Login
              </button>
              <button 
                className="signup-btn"
                onClick={() => navigate('/auth/role-selection?action=signup')}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      <header className="hero-section" data-scroll>
        <div className="hero-content">
          <h1>Kairos</h1>
          <p className="tagline">Seize the right career opportunities, at the right time.</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">500+</span>
              <span className="stat-label">Mentors</span>
            </div>
            <div className="stat">
              <span className="stat-number">10,000+</span>
              <span className="stat-label">Students</span>
            </div>
            <div className="stat">
              <span className="stat-number">95%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
          <button className="cta-button">Get Started</button>
        </div>
        <div className="hero-image">
          <div className="floating-elements">
            <div className="element-1"></div>
            <div className="element-2"></div>
            <div className="element-3"></div>
          </div>
        </div>
      </header>

      <section className="features-section" data-scroll>
        <div className="feature-card">
          <h3>Mentorship-Driven</h3>
          <p>Connect with HR professionals and industry experts from top companies</p>
        </div>
        <div className="feature-card">
          <h3>AI-Powered Optimization</h3>
          <p>Personalized resume analysis and interview preparation</p>
        </div>
        <div className="feature-card">
          <h3>Tailored Job Matching</h3>
          <p>Curated job listings that match your skills and aspirations</p>
        </div>
      </section>

      <section id="about" className="about-section" data-scroll>
        <div className="container">
          <h2>Why Kairos?</h2>
          <p className="lead">
            In today's competitive job market, students face overwhelming noise when searching for 
            internships and entry-level roles. Kairos cuts through the clutter with focused, 
            expert-driven guidance.
          </p>

          <div className="mission-statement">
            <h3>Our Mission</h3>
            <p>
              To connect students directly with HR professionals and technical experts from top 
              companies, ensuring they make the right career moves at the perfect moment - their 
              <strong> Kairos</strong> moment.
            </p>
          </div>

          <div className="value-props">
            <div className="value-card">
              <h4>AI-Powered Precision</h4>
              <p>
                Our platform analyzes resumes, identifies skill gaps, and provides targeted 
                improvements from both technical and hiring perspectives.
              </p>
            </div>
            
            <div className="value-card">
              <h4>Direct Expert Access</h4>
              <p>
                Get personalized feedback from hiring managers and technical leads at top companies, 
                not generic automated advice.
              </p>
            </div>

            <div className="value-card">
              <h4>Curated Opportunities</h4>
              <p>
                We surface only the most relevant internships and entry-level positions matched to 
                your unique profile and aspirations.
              </p>
            </div>
          </div>

          <div className="platform-differentiators">
            <h3>What Makes Kairos Different</h3>
            <ul>
              <li>Mentorship-driven approach rather than just job listings</li>
              <li>Video-based resume feedback from actual hiring professionals</li>
              <li>Live Q&A sessions with industry experts</li>
              <li>AI that learns your career goals to provide better matches</li>
              <li>Distraction-free interface focused only on what matters</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <h2>Pricing</h2>
        <div className="pricing-cards">
          <div className="pricing-card">
            <h3>Basic</h3>
            <p className="price">Free</p>
            <ul>
              <li>Access to job listings</li>
              <li>Basic resume review</li>
              <li>Limited mentor connections</li>
            </ul>
          </div>
          <div className="pricing-card">
            <h3>Premium</h3>
            <p className="price">$9.99/month</p>
            <ul>
              <li>Priority job matching</li>
              <li>AI-powered resume optimization</li>
              <li>Unlimited mentor connections</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <h2>Contact Us</h2>
        <form className="contact-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" placeholder="Your name" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Your email" />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" placeholder="Your message"></textarea>
          </div>
          <button type="submit" className="submit-btn">Send Message</button>
        </form>
      </section>
    </div>
  )
}
