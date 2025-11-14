// src/components/Engagements.jsx
import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

const API ="https://time-management-software.onrender.com" // e.g. 

function getAuthHeaders() {
  const token = localStorage.getItem('token'); // make sure your login stores the JWT here
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
        // credentials: 'include' // uncomment if your server uses cookie sessions
      });

      if (res.status === 401) {
        toast.error('Not authenticated — please log in');
        console.warn('fetchTasks: 401 Unauthorized');
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
        // credentials: 'include' // uncomment if using cookie sessions
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        toast.error('Not authenticated — please log in');
        console.warn('handleAdd: 401 Unauthorized — No token sent or token expired');
        return;
      }

      const body = await res.json();
      if (!res.ok) throw new Error(body.msg || body.error || 'Failed to add task');

      toast.success('Task created');
      setTitle(''); setStartTime(''); setEndTime(''); setDescription('');
      if (body.tasks) setTasks(prev => [...body.tasks, ...prev]);
    } catch (err) {
      toast.error(err.message || 'Error');
      console.error(err);
    } finally { setLoading(false); }
  }

  return (
    <div className={isDark ? 'min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white p-8' : 'min-h-screen bg-gray-50 text-gray-900 p-8'}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-6">Engagements</h1>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Add a Task</h3>
                <p className="text-sm opacity-80">Create time-blocked engagements for your calendar</p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="col-span-1 md:col-span-2">
                <Input placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div>
                <label className="text-sm mb-1 block">Start</label>
                <input className="w-full rounded-md p-2 border bg-transparent" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>

              <div>
                <label className="text-sm mb-1 block">End (optional)</label>
                <input className="w-full rounded-md p-2 border bg-transparent" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-sm mb-1 block">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md p-2 border bg-transparent h-24" />
              </div>

              <CardFooter className="col-span-1 md:col-span-2 flex justify-end">
                <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Task'}</Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Your Tasks</h3>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="opacity-70">No tasks yet — create one above.</p>
            ) : (
              <ul className="space-y-3">
                {tasks.map(t => (
                  <li key={t._id || t.title + t.startTime} className="p-3 rounded-lg border flex justify-between items-start">
                    <div>
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs opacity-80">{new Date(t.startTime).toLocaleString()} — {t.endTime ? new Date(t.endTime).toLocaleString() : '—'}</div>
                      {t.description && <div className="mt-1 text-sm opacity-80">{t.description}</div>}
                    </div>
                    <div className="text-xs opacity-60">{new Date(t.createdAt || Date.now()).toLocaleString()}</div>
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
