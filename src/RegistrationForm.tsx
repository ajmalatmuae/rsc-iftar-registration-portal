import { useState } from 'react';
import { useTheme } from './ThemeContext';
import { motion } from 'motion/react';
import { User, Mail, Building, Briefcase, Phone, Utensils, Users, MapPin, MessageCircle, Calendar, Compass, GraduationCap } from 'lucide-react';

const categoryProfessions: Record<string, string[]> = {
  'Legal & Financial Experts': ['Lawyers', 'Chartered Accountants', 'Company Secretaries', 'Bankers', 'Investment Consultants', 'Other'],
  'Business & Management Professionals': ['Entrepreneurs', 'Business Owners', 'HR Professionals', 'Marketing & Sales Experts', 'Other'],
  'Government Officials & Administrators': ['IAS (Indian Administrative Service)', 'IPS (Indian Police Service)', 'LSGD Officers (Local Self Government Department)', 'Public Sector Employees', 'Other'],
  'IT & Digital Experts': ['Software Developers', 'UI/UX Designers', 'Cybersecurity Experts', 'Data Analysts', 'Digital Marketers', 'Other'],
  'Media & Creative Professionals': ['Journalists', 'Writers', 'Photographers', 'Videographers', 'Graphic Designers', 'Other'],
  'Scientists & Researchers': ['In all fields', 'including Biotechnology', 'Physics', 'Chemistry', 'Social Sciences', 'Other'],
  'Skilled Professionals': ['Architects', 'Interior Designers', 'Trainers', 'Consultants', 'other skilled professional contributing to society', 'Other'],
  'Healthcare Professionals': ['Doctors', 'Nurses', 'Pharmacists', 'Medical Technicians', 'Paramedics', 'Other'],
  'Engineers & Technologists': ['Civil', 'Mechanical', 'Electrical', 'Software', 'AI/ML', 'Robotics', 'Telecom', 'Other'],
  'Educators & Academicians': ['Teachers', 'Professors', 'Trainers', 'Researchers', 'Other'],
  'Other': ['Other']
};

export function RegistrationForm({ onSubmit, initialData }: { onSubmit: (data: any) => void; initialData?: any }) {
  const { isNight } = useTheme();
  const [formData, setFormData] = useState(initialData || {
    fullName: '',
    email: '',
    company: '',
    category: '',
    profession: '',
    otherProfession: '',
    phone: '',
    whatsappCode: '+971',
    whatsappNumber: '',
    area: '',
    gender: 'Male',
    age: '',
    musandamTrip: 'No',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'category') {
      setFormData({ ...formData, category: value, profession: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.gender !== 'Male') {
      alert('Only male professionals are eligible to register.');
      return;
    }
    if (parseInt(formData.age) > 34) {
      alert('Only age 34 and under can register');
      return;
    }
    onSubmit(formData);
  };

  const inputClasses = `w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
    isNight
      ? 'bg-slate-800/50 border-slate-700 text-amber-50 focus:ring-amber-500/50 focus:border-amber-500/50 placeholder-slate-500'
      : 'bg-white border-stone-200 text-stone-900 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder-stone-400'
  }`;

  const labelClasses = `block text-sm font-medium mb-2 ${
    isNight ? 'text-amber-200/80' : 'text-stone-700'
  }`;

  return (
    <motion.div
      className={`p-8 md:p-10 rounded-3xl border shadow-xl ${
        isNight
          ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-amber-900/5'
          : 'bg-white border-stone-100 shadow-stone-200/50'
      }`}
    >
      <h2 className={`text-2xl md:text-3xl font-serif mb-8 ${
        isNight ? 'text-amber-400' : 'text-stone-900'
      }`}>
        Reserve Your Seat
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className={`h-5 w-5 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
              </div>
              <input
                type="text"
                name="fullName"
                required
                className={`${inputClasses} pl-10`}
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className={`h-5 w-5 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
              </div>
              <input
                type="email"
                name="email"
                required
                className={`${inputClasses} pl-10`}
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Company</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className={`h-5 w-5 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
              </div>
              <input
                type="text"
                name="company"
                required
                className={`${inputClasses} pl-10`}
                placeholder="Acme Corp"
                value={formData.company}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Professional Category</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <GraduationCap className={`h-5 w-5 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
              </div>
              <select
                name="category"
                required
                className={`${inputClasses} pl-10 appearance-none`}
                value={formData.category}
                onChange={handleChange}
              >
                <option value="" disabled>Select your category</option>
                {Object.keys(categoryProfessions).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.category && (
            <div>
              <label className={labelClasses}>Profession</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className={`h-5 w-5 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
                </div>
                <select
                  name="profession"
                  required
                  className={`${inputClasses} pl-10 appearance-none`}
                  value={formData.profession}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select your profession</option>
                  {categoryProfessions[formData.category].map(prof => (
                    <option key={prof} value={prof}>{prof}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formData.profession === 'Other' && (
            <div>
              <label className={labelClasses}>Please specify your profession</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className={`h-5 w-5 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
                </div>
                <input
                  type="text"
                  name="otherProfession"
                  required
                  className={`${inputClasses} pl-10`}
                  placeholder="Your Profession"
                  value={formData.otherProfession}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <div>
            <label className={labelClasses}>Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className={`h-5 w-5 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
              </div>
              <input
                type="tel"
                name="phone"
                required
                className={`${inputClasses} pl-10`}
                placeholder="+971 50 123 4567"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>WhatsApp Number</label>
            <div className="flex gap-2">
              <div className="relative w-1/3">
                <select
                  name="whatsappCode"
                  className={`${inputClasses} appearance-none px-2 text-center`}
                  value={formData.whatsappCode}
                  onChange={handleChange}
                >
                  <option value="+971">+971</option>
                  <option value="+91">+91</option>
                </select>
              </div>
              <div className="relative w-2/3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MessageCircle className={`h-5 w-5 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
                </div>
                <input
                  type="tel"
                  name="whatsappNumber"
                  required
                  className={`${inputClasses} pl-10`}
                  placeholder="50 123 4567"
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClasses}>Area</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className={`h-5 w-5 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
              </div>
              <select
                name="area"
                required
                className={`${inputClasses} pl-10 appearance-none`}
                value={formData.area}
                onChange={handleChange}
              >
                <option value="" disabled>Select your area</option>
                <option value="Al Wahda South">Al Wahda South</option>
                <option value="Al Wahda North">Al Wahda North</option>
                <option value="Khalidiya">Khalidiya</option>
                <option value="Nadisiya">Nadisiya</option>
                <option value="Khaleefa City">Khaleefa City</option>
                <option value="Muroor">Muroor</option>
                <option value="Madina Zayed">Madina Zayed</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClasses}>Gender</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className={`h-5 w-5 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
              </div>
              <select
                name="gender"
                required
                className={`${inputClasses} pl-10 appearance-none`}
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClasses}>Age</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className={`h-5 w-5 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
              </div>
              <input
                type="number"
                name="age"
                required
                min="18"
                max="100"
                className={`${inputClasses} pl-10 ${parseInt(formData.age) > 34 ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}`}
                placeholder="25"
                value={formData.age}
                onChange={handleChange}
              />
            </div>
            {parseInt(formData.age) > 34 && (
              <p className="text-red-500 text-sm mt-1">Only age 34 and under can register</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClasses}>Musandam Adventure Trip (Eid Special)</label>
              <span className="bg-amber-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Limited Spots
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Compass className={`h-5 w-5 ${isNight ? 'text-slate-500' : 'text-stone-400'}`} />
              </div>
              <select
                name="musandamTrip"
                required
                className={`${inputClasses} pl-10 appearance-none ${isNight ? 'border-amber-500/30' : 'border-amber-200'}`}
                value={formData.musandamTrip}
                onChange={handleChange}
              >
                <option value="Yes">Count me in for the adventure! ⛵</option>
                <option value="No">Not this time</option>
              </select>
            </div>
            <p className={`text-[10px] mt-1.5 ${isNight ? 'text-amber-200/50' : 'text-stone-400'}`}>
              Join fellow professionals for an unforgettable Eid getaway.
            </p>
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            className={`w-full py-4 px-6 rounded-xl font-medium text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
              isNight
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/20'
                : 'bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-900/20'
            }`}
          >
            Continue to Registration
          </button>
        </div>
      </form>
    </motion.div>
  );
}
