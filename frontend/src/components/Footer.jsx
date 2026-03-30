import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  Phone, 
  Globe, 
  MessageSquare,
  Instagram,
  X
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const [submitted, setSubmitted] = React.useState(false);

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 px-6 mt-auto print:hidden">
      <div className="container max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">BE</span>
              </div>
              Bill Easy
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Simplify your business billing and inventory management with Bill Easy professional SaaS platform. Designed for growth and efficiency.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                <X className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to={user ? "/dashboard" : "/login"} className="hover:text-blue-400 transition-colors">Dashboard</Link></li>
              <li><Link to={user ? "/invoices" : "/login"} className="hover:text-blue-400 transition-colors">Sales Invoices</Link></li>
              <li><Link to={user ? "/products" : "/login"} className="hover:text-blue-400 transition-colors">Inventory</Link></li>
              <li><Link to={user ? "/reports" : "/login"} className="hover:text-blue-400 transition-colors">Business Reports</Link></li>
              <li><Link to={user ? "/settings" : "/login"} className="hover:text-blue-400 transition-colors">Business Settings</Link></li>
            </ul>
          </div>

          {/* Quick Enquiry Section */}
          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs">Quick Enquiry</h4>
            {submitted ? (
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 animate-in fade-in zoom-in duration-300">
                <p className="text-xs font-bold text-blue-400 leading-relaxed text-center">
                  Thank you for contacting Bill Easy. Our executive will get in touch with you shortly.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="w-full mt-3 text-[10px] uppercase font-black text-slate-500 hover:text-white transition-colors underline"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form 
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const data = {
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    message: 'Quick callback request from footer'
                  };
                  try {
                    const response = await fetch('https://billeasy-backend.onrender.com/api/enquiries', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data)
                    });
                    if (response.ok) {
                      setSubmitted(true);
                      e.target.reset();
                    } else {
                      alert('Failed to send. Please try again.');
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Connectivity issue. Please check your internet.');
                  }
                }}
              >
                <input 
                  name="name"
                  type="text" 
                  placeholder="Your Name" 
                  required
                  className="w-full bg-slate-800 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-white"
                />
                <input 
                  name="phone"
                  type="tel" 
                  placeholder="Phone Number" 
                  required
                  className="w-full bg-slate-800 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-white"
                />
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-lg shadow-blue-900/20"
                >
                  Request Callback
                </button>
              </form>
            )}
          </div>

          {/* Reach Us */}
          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs">Reach Us</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-blue-500 mt-1" />
                <span>+91 99869 95848<br/><span className="text-[10px] text-slate-500">(Sales & Support)</span></span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-blue-500 mt-1" />
                <span>support@charisbilleasy.store</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
          <p>© {currentYear} Bill Easy SaaS Platform. All rights reserved.</p>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            </div>
            <a href="https://charisnetwork.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-full transition-all border border-slate-800 group">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="opacity-80 group-hover:opacity-100 transition-opacity">
                <path d="M15.5702 8.13142C15.7729 8.0412 16.0007 8.18878 15.9892 8.4103C15.8374 11.3192 14.0965 14.0405 11.2531 15.3065C8.40964 16.5725 5.2224 16.0453 2.95912 14.2117C2.78676 14.072 2.82955 13.804 3.03219 13.7137L4.95677 12.8568C5.04866 12.8159 5.15446 12.823 5.24204 12.8725C6.73377 13.7153 8.59176 13.8649 10.2772 13.1145C11.9626 12.3641 13.0947 10.8833 13.4665 9.21075C13.4883 9.11256 13.5539 9.02918 13.6457 8.98827L15.5702 8.13142Z" fill="white"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="M15.3066 4.74698L15.5067 5.19653C15.5759 5.35178 15.5061 5.53366 15.3508 5.60278L1.29992 11.8586C1.14467 11.9278 0.962794 11.8579 0.893675 11.7027L0.701732 11.2716L0.693457 11.2531C-1.10317 7.21778 0.711626 2.49007 4.74692 0.693443C8.78221 -1.10318 13.51 0.711693 15.3066 4.74698ZM2.82356 8.55367C2.63552 8.63739 2.41991 8.51617 2.40853 8.31065C2.28373 6.05724 3.53858 3.85787 5.72286 2.88536C7.90715 1.91286 10.3813 2.45199 11.9724 4.05256C12.1175 4.19854 12.0633 4.43988 11.8753 4.5236L2.82356 8.55367Z" fill="#10b981"></path>
              </svg>
              <span className="text-[11px] text-slate-400 group-hover:text-white transition-colors font-semibold">
                Powered by Charis Network
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
