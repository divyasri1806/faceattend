import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Loader, UserPlus, Check, AlertCircle, Trash2, CameraOff } from 'lucide-react';
import { loadModels, detectFaceDescriptor, descriptorToArray } from '../lib/faceRecognition';
import { registerPerson, fetchPersons, deletePerson } from '../lib/attendance';
import type { Person } from '../types';

export default function Register() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [captureMsg, setCaptureMsg] = useState('');

  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'employee'>('student');
  const [department, setDepartment] = useState('');

  const [persons, setPersons] = useState<Person[]>([]);
  const [loadingPersons, setLoadingPersons] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPersons = useCallback(async () => {
    setLoadingPersons(true);
    const ps = await fetchPersons();
    setPersons(ps);
    setLoadingPersons(false);
  }, []);

  useEffect(() => { loadPersons(); }, [loadPersons]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCaptureStatus('error');
      setCaptureMsg('Could not access camera. Check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const capture = useCallback(async () => {
    if (!videoRef.current || !name.trim()) {
      setCaptureStatus('error');
      setCaptureMsg('Please enter a name before capturing.');
      return;
    }

    setCapturing(true);
    setCaptureStatus('idle');
    setCaptureMsg('');

    try {
      await loadModels();
      const descriptor = await detectFaceDescriptor(videoRef.current);
      if (!descriptor) {
        setCaptureStatus('error');
        setCaptureMsg('No face detected. Please ensure your face is clearly visible.');
        setCapturing(false);
        return;
      }

      await registerPerson({
        name: name.trim(),
        role,
        department: department.trim() || 'General',
        face_descriptor: descriptorToArray(descriptor),
        image_url: '',
      });

      setCaptureStatus('success');
      setCaptureMsg(`${name} registered successfully!`);
      setName('');
      setDepartment('');
      await loadPersons();
    } catch (err) {
      setCaptureStatus('error');
      setCaptureMsg(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setCapturing(false);
    }
  }, [name, role, department, loadPersons]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    await deletePerson(id);
    await loadPersons();
    setDeletingId(null);
  }, [loadPersons]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Register Person</h2>
        <p className="text-gray-500 text-sm mt-1">Capture and register a face for recognition</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration form */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Person Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <div className="flex gap-3">
                {(['student', 'employee'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium capitalize transition-colors ${
                      role === r ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department / Class</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Camera */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <div className="aspect-video relative">
              <video
                ref={videoRef}
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{ display: cameraActive ? 'block' : 'none' }}
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                  <Camera className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-xs opacity-40">Camera off</p>
                </div>
              )}
            </div>
            <div className="p-3 flex gap-2">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Open Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={stopCamera}
                    className="px-3 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    <CameraOff className="w-4 h-4" />
                  </button>
                  <button
                    onClick={capture}
                    disabled={capturing || !name.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {capturing ? <Loader className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {capturing ? 'Capturing...' : 'Capture & Register'}
                  </button>
                </>
              )}
            </div>
          </div>

          {captureStatus !== 'idle' && (
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
              captureStatus === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
            }`}>
              {captureStatus === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {captureMsg}
            </div>
          )}
        </div>

        {/* Registered persons */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Registered Persons ({persons.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[500px]">
            {loadingPersons ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-7 h-7 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : persons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <UserPlus className="w-8 h-8 mb-2" />
                <p className="text-xs">No persons registered yet</p>
              </div>
            ) : (
              persons.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors group">
                  <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sky-700 font-bold text-sm">{p.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 truncate capitalize">{p.role} · {p.department}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    {deletingId === p.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
