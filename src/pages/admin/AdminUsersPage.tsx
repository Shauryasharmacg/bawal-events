import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-context.js';
import { Shield, User, CheckCircle2 } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { adminToken } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!adminToken && !localStorage.getItem('bawal_admin_token')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<{ users: any[] }>('/api/admin/users');
      setUsers(res.users || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [adminToken]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await fetchApi(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl">
      <div>
        <span className="text-xs font-black text-[#3888FF] uppercase tracking-[0.2em] font-['Syne',sans-serif]">
          Role-Based Access
        </span>
        <h1 className="text-3xl font-black text-white font-['Syne',sans-serif]">
          User Accounts & Permissions ({users.length})
        </h1>
      </div>

      <div className="p-6 rounded-3xl bg-[#121218] border border-[#232330] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-gray-400 border-b border-[#20202A] uppercase">
              <tr>
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Contact</th>
                <th className="pb-3 font-semibold">Age / Gender</th>
                <th className="pb-3 font-semibold">Instagram</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C24] text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Loading user directory...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#16161F]">
                    <td className="py-3.5">
                      <p className="font-bold text-white">{u.name || 'Member'}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{u.id}</p>
                    </td>
                    <td className="py-3.5">
                      <p className="text-gray-300">{u.email || '-'}</p>
                      <p className="text-[10px] text-gray-500">{u.mobile || '-'}</p>
                    </td>
                    <td className="py-3.5 text-gray-400">
                      {u.age ? `${u.age} yrs` : '-'} • {u.gender || '-'}
                    </td>
                    <td className="py-3.5 font-mono text-[#FFB800]">
                      {u.instagram ? `@${u.instagram}` : '-'}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1C1C28] text-amber-400 border border-[#2A2A38]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0B0B0E] border border-[#2B2B3C] text-white text-[11px] focus:outline-none focus:border-[#0038FF]"
                      >
                        <option value="USER">USER</option>
                        <option value="STAFF">STAFF (Check-In)</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
