'use client';
import React, { useState, useEffect } from 'react';
// import { createClient } from '@supabase/supabase-js'; // UNCOMMENT THIS IN YOUR REPO

// --- MOCK CLIENT (DELETE THIS BLOCK IN YOUR REPO) ---
const mockSupabase = {
  auth: { getUser: async () => ({ data: { user: { id: 'mock-user' } } }) },
  from: () => ({
    select: () => ({ order: async () => ({ data: [] }) }),
    insert: async () => ({ error: null })
  })
};
const supabase = mockSupabase;
// --- END MOCK CLIENT ---

// --- REAL CLIENT (UNCOMMENT THIS BLOCK IN YOUR REPO) ---
/*
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
*/

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formStatus, setFormStatus] = useState(null);
  const [formData, setFormData] = useState({
    account_name: '', smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', imap_host: '', imap_port: 993,
  });

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('user_mail_accounts').select('*').order('created_at', { ascending: false });
      setAccounts(data || []);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('saving');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase.from('user_mail_accounts').insert([{ ...formData, user_id: user.id }]);
      if (!error) {
        setFormStatus('success');
        setFormData({ account_name: '', smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', imap_host: '', imap_port: 993 });
        fetchAccounts();
      } else {
        setFormStatus('error');
      }
    }
    setTimeout(() => setFormStatus(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Email Accounts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded shadow border">
          <h2 className="text-xl font-semibold mb-4">Connect Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input name="account_name" placeholder="Account Label" value={formData.account_name} onChange={handleInputChange} className="w-full border p-2 rounded" required />
            <input name="smtp_host" placeholder="SMTP Host" value={formData.smtp_host} onChange={handleInputChange} className="w-full border p-2 rounded" required />
            <input name="smtp_port" type="number" placeholder="SMTP Port" value={formData.smtp_port} onChange={handleInputChange} className="w-full border p-2 rounded" required />
            <input name="smtp_user" placeholder="SMTP Email" value={formData.smtp_user} onChange={handleInputChange} className="w-full border p-2 rounded" required />
            <input name="smtp_pass" type="password" placeholder="SMTP Password" value={formData.smtp_pass} onChange={handleInputChange} className="w-full border p-2 rounded" required />
            <button type="submit" disabled={formStatus === 'saving'} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
              {formStatus === 'saving' ? 'Saving...' : 'Save Account'}
            </button>
            {formStatus === 'success' && <p className="text-green-600 text-center">Saved!</p>}
            {formStatus === 'error' && <p className="text-red-600 text-center">Error saving.</p>}
          </form>
        </div>
        <div className="bg-white p-6 rounded shadow border">
          <h2 className="text-xl font-semibold mb-4">Your Accounts</h2>
          {loading ? <p>Loading...</p> : accounts.map(acc => (
             <div key={acc.id} className="p-3 border-b">
               <div className="font-bold">{acc.account_name}</div>
               <div className="text-sm text-gray-500">{acc.smtp_user}</div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
