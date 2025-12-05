import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

const API ="http://localhost:5000";

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export default function Engagements() {
  const { isDark } = useContext(ThemeContext);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);

  async function fetchTasks() {
    try {
      const res = await fetch(`${API}/api/executive/me/tasks`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (res.status === 401) {
        toast.error('Not authenticated — please log in');
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ msg: 'Failed to fetch tasks' }));
        throw new Error(err.msg || 'Failed to fetch tasks');
      }

      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('fetchTasks error', err);
    }
  }

  useEffect(() => { fetchTasks(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title || !startTime) return toast.error('Title and start time required');
    setLoading(true);
    try {
      const payload = { tasks: { title, startTime, endTime: endTime || undefined, description } };
      const res = await fetch(`${API}/api/executive/me/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        toast.error('Not authenticated — please log in');
        return;
      }

      const body = await res.json();
      if (!res.ok) throw new Error(body.msg || body.error || 'Failed to add task');

      toast.success('Task created');
      setTitle(''); setStartTime(''); setEndTime(''); setDescription('');
      if (body.tasks) setTasks(prev => [...body.tasks, ...prev]);
    } catch (err) {
      toast.error(err.message || 'Error');
    } finally { setLoading(false); }
  }

  const palette = [
    'from-pink-400 to-pink-200',
    'from-indigo-400 to-indigo-200',
    'from-emerald-400 to-emerald-200',
    'from-amber-400 to-amber-200',
    'from-violet-400 to-violet-200',
    'from-cyan-400 to-cyan-200',
  ];

  return (
    <div className={isDark ? 'min-h-screen p-8 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white'
      : 'min-h-screen p-8 bg-gradient-to-br from-indigo-50 via-sky-50 to-white text-gray-900'}>
      
      <div className="max-w-4xl mx-auto">
        <h1 className={isDark ? 'text-4xl font-extrabold mb-6 text-white'
          : 'text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500'}>
          Engagements
        </h1>

        {/* Add Task Card */}
        <Card className={isDark ? 'mb-6 bg-gradient-to-r from-slate-900 to-slate-800 border border-white/5 shadow-xl'
          : 'mb-6 bg-white/80 border border-gray-100 shadow-lg'}>
          
          <CardHeader>
            <div>
              <h3 className="text-lg font-semibold">Add a Task</h3>
              <p className="text-sm opacity-80">Create time-blocked engagements for your calendar</p>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              
              <div className="col-span-1 md:col-span-2">
                <Input placeholder="Task title" value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={isDark ? 'bg-slate-800 text-white rounded-lg p-3' : 'bg-white rounded-lg p-3 shadow-sm'} />
              </div>

              <div>
                <label className="text-sm mb-1 block">Start</label>
                <input type="datetime-local" value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className={isDark ? 'w-full rounded-md p-2 border border-white/10 bg-transparent'
                    : 'w-full rounded-md p-2 border border-gray-200 bg-white'} />
              </div>

              <div>
                <label className="text-sm mb-1 block">End (optional)</label>
                <input type="datetime-local" value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className={isDark ? 'w-full rounded-md p-2 border border-white/10 bg-transparent'
                    : 'w-full rounded-md p-2 border border-gray-200 bg-white'} />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-sm mb-1 block">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  className={isDark ? 'w-full rounded-md p-2 border border-white/10 bg-transparent h-24'
                    : 'w-full rounded-md p-2 border border-gray-200 bg-white h-24'} />
              </div>

              <CardFooter className="col-span-1 md:col-span-2 flex justify-end">
                <Button type="submit" disabled={loading}
                  className={isDark ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md'
                    : 'bg-gradient-to-r from-indigo-500 to-sky-400 text-white shadow-md'}>
                  {loading ? 'Adding...' : 'Add Task'}
                </Button>
              </CardFooter>

            </form>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card className={isDark ? 'bg-gradient-to-r from-slate-900 to-slate-800 border border-white/5 shadow-xl'
          : 'bg-white/95 border border-gray-100 shadow-lg'}>
          
          <CardHeader>
            <h3 className="text-lg font-semibold">Your Tasks</h3>
          </CardHeader>

          <CardContent>
            {tasks.length === 0 ? (
              <p className="opacity-70">No tasks yet — create one above.</p>
            ) : (
              // ✅ Mobile = 1 column, Desktop = 2 columns
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((t, i) => (
                  <li key={t._id || t.title + t.startTime}
                    className={`p-4 rounded-2xl flex flex-col justify-between shadow-md border border-transparent overflow-hidden relative 
                      bg-gradient-to-br ${palette[i % palette.length]} 
                      text-slate-900 dark:text-slate-100 

                      /* Hover animation */ 
                      transition-all duration-300 
                      hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1
                    `}>
                    
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-lg">{t.title}</div>
                        <div className="text-xs opacity-80">{new Date(t.startTime).toLocaleString()}</div>
                      </div>

                      {t.description && (
                        <div className="mt-2 text-sm opacity-90">{t.description}</div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs opacity-80">
                        {t.endTime ? new Date(t.endTime).toLocaleString() : '—'}
                      </div>
                      <div className="text-xs opacity-70">
                        {new Date(t.createdAt || Date.now()).toLocaleString()}
                      </div>
                    </div>

                    <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-20 blur-3xl" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
