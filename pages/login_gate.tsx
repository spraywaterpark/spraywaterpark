import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LOGIN_HERO_IMAGE = "/hero.webp"; // ← Your new hero image

interface LoginPageProps {
  onGuestLogin: (n: string, m: string) => void;
  onAdminLogin: (e: string) => void;
}

const LoginGate: React.FC<LoginPageProps> = ({ onGuestLogin, onAdminLogin }) => {
  const navigate = useNavigate();
  const [view, setView] = useState<'landing' | 'admin'>('landing');
  const [data, setData] = useState({ name: '', mobile: '', email: '', password: '' });
  const [errors, setErrors] = useState({ name: '', mobile: '' });

  const validateName = (name: string) => {
    if (name.trim() === "") return "";
    const nameRegex = /^[a-zA-Z\s]*$/;
    if (!nameRegex.test(name)) {
      return "Use alphabets only. No numbers or signs allowed. (केवल अक्षरों का उपयोग करें। नंबर या चिह्नों की अनुमति नहीं है।)";
    }
    if (name.trim().length < 2) {
      return "Name is too short. (नाम बहुत छोटा है।)";
    }
    return "";
  };

  const validateMobile = (mobile: string) => {
    if (mobile === "") return "";
    if (!/^[6-9]/.test(mobile)) {
      return "Must start with 6, 7, 8, or 9. (नंबर 6, 7, 8 या 9 से शुरू होना चाहिए।)";
    }
    if (!/^\d*$/.test(mobile)) {
      return "Numbers only. (केवल नंबर मान्य हैं।)";
    }
    if (mobile.length > 0 && mobile.length < 10) {
      return "Enter full 10 digits. (पूरे 10 अंक दर्ज करें।)";
    }
    return "";
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cleanVal = val.replace(/[^a-zA-Z\s]/g, '');
    setData({ ...data, name: cleanVal });

    if (val !== cleanVal) {
      setErrors(prev => ({ ...prev, name: "Numbers & signs are not allowed in names. (नाम में नंबर और चिह्न मान्य नहीं हैं।)" }));
    } else {
      setErrors(prev => ({ ...prev, name: validateName(cleanVal) }));
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length > 10) return;
    const cleanVal = val.replace(/\D/g, '');
    setData({ ...data, mobile: cleanVal });

    if (val !== cleanVal) {
      setErrors(prev => ({ ...prev, mobile: "Only numbers are allowed. (केवल नंबर दर्ज करें।)" }));
    } else {
      setErrors(prev => ({ ...prev, mobile: validateMobile(cleanVal) }));
    }
  };

  const handleGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateName(data.name);
    const mobileErr = data.mobile.length !== 10 ? "Please enter a valid 10-digit number." : validateMobile(data.mobile);

    if (nameErr || mobileErr || data.name.trim() === "" || data.mobile.trim() === "") {
      setErrors({ 
        name: nameErr || (data.name.trim() === "" ? "Name is required." : ""), 
        mobile: mobileErr || (data.mobile.trim() === "" ? "Mobile is required." : "") 
      });
      alert("Registration Error: Please provide valid details in the highlighted fields. (पंजीकरण त्रुटि: कृपया सही जानकारी भरें।)");
      return;
    }
    onGuestLogin(data.name.trim(), data.mobile.trim());
    navigate('/book');
  };

  const handleAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.email.trim() === 'admin@spraywaterpark.com' && data.password.trim() === 'admin123') {
      onAdminLogin(data.email.trim());
      navigate('/admin');
    } else {
      alert("Unauthorized access attempt. Please check credentials.");
    }
  };

  return (
    <div className="w-full flex items-center justify-center animate-slide-up">
      <div className="w-full max-w-5xl glass-card rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row h-auto md:h-[600px] border border-white/40">

        {/* LEFT SIDE: HERO IMAGE */}
        <div className="w-full md:w-5/12 h-64 md:h-full relative overflow-hidden bg-slate-900">
          <img 
            src={LOGIN_HERO_IMAGE} 
            alt="Spray Water Park Guests" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-12 text-center md:text-left">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none mb-2">
              Spray Aqua Resort
            </h1>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.3em]">
              Premium Waterfront Destination
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: FORM (UNCHANGED) */}
        {/* ... same as your original */}
