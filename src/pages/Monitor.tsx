import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, CameraOff, Loader, UserCheck, AlertCircle } from 'lucide-react';
import {
  loadModels,
  areModelsLoaded,
  detectAllFaces,
  computeDistance,
  RECOGNITION_THRESHOLD,
} from '../lib/faceRecognition';
import { fetchPersons, markAttendance } from '../lib/attendance';
import type { AttendanceLog, Person } from '../types';

interface RecognizedEvent {
  person: Person;
  log: AttendanceLog;
}

export default function Monitor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);

  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [persons, setPersons] = useState<Person[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecognizedEvent[]>([]);

  const stopCamera = useCallback(() => {
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setStatus('idle');
  }, []);

  const startCamera = useCallback(async () => {
    setStatus('loading');
    setStatusMsg('Loading AI models...');

    try {
      await loadModels();
      setStatusMsg('Fetching registered persons...');
      const ps = await fetchPersons();
      setPersons(ps);

      setStatusMsg('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await new Promise<void>(resolve => {
        videoRef.current!.onloadedmetadata = () => resolve();
      });
      await videoRef.current.play();

      setStatus('running');
      setStatusMsg('');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setStatusMsg(err instanceof Error ? err.message : 'Failed to start camera');
    }
  }, []);

  // Detection loop
  useEffect(() => {
    if (status !== 'running' || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    let running = true;
    const recentlyMarked = new Set<string>();

    async function loop() {
      if (!running || !video || !canvas) return;

      if (video.readyState === 4) {
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);

        const detections = await detectAllFaces(video);
        const resized = faceapi.resizeResults(detections, displaySize);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          for (const det of resized) {
            const { x, y, width, height } = det.detection.box;

            let bestPerson: Person | null = null;
            let bestDist = Infinity;

            for (const p of persons) {
              if (p.face_descriptor.length === 0) continue;
              const dist = computeDistance(p.face_descriptor, det.descriptor);
              if (dist < bestDist) { bestDist = dist; bestPerson = p; }
            }

            const isKnown = bestPerson && bestDist < RECOGNITION_THRESHOLD;
            const confidence = isKnown ? 1 - bestDist : 0;

            // Draw box
            ctx.strokeStyle = isKnown ? '#10b981' : '#f59e0b';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // Draw label background
            const label = isKnown ? bestPerson!.name : 'Unknown';
            ctx.font = '13px Inter, sans-serif';
            const textWidth = ctx.measureText(label).width;
            ctx.fillStyle = isKnown ? '#10b981' : '#f59e0b';
            ctx.fillRect(x, y - 24, textWidth + 16, 22);
            ctx.fillStyle = '#fff';
            ctx.fillText(label, x + 8, y - 7);

            if (isKnown && bestPerson && !recentlyMarked.has(bestPerson.id)) {
              recentlyMarked.add(bestPerson.id);
              const lateHour = new Date().getHours() >= 9;
              markAttendance(bestPerson.id, confidence, lateHour ? 'late' : 'present')
                .then(log => {
                  if (log) {
                    setRecentEvents(prev => [{ person: bestPerson!, log }, ...prev.slice(0, 9)]);
                  }
                })
                .catch(console.error);

              // Cool-down 10s per person
              setTimeout(() => recentlyMarked.delete(bestPerson!.id), 10000);
            }
          }
        }
      }

      loopRef.current = requestAnimationFrame(loop);
    }

    loop();
    return () => { running = false; };
  }, [status, persons]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const refreshPersons = useCallback(async () => {
    const ps = await fetchPersons();
    setPersons(ps);
  }, []);

  useEffect(() => {
    if (status === 'running') {
      const id = setInterval(refreshPersons, 60000);
      return () => clearInterval(id);
    }
  }, [status, refreshPersons]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Monitor</h2>
          <p className="text-gray-500 text-sm mt-1">Real-time face detection and attendance marking</p>
        </div>
        <div className="flex gap-3">
          {status === 'running' ? (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm font-medium"
            >
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </button>
          ) : (
            <button
              onClick={startCamera}
              disabled={status === 'loading'}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium disabled:opacity-60"
            >
              {status === 'loading' ? <Loader className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {status === 'loading' ? 'Starting...' : 'Start Camera'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera feed */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video relative">
            <video
              ref={videoRef}
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: status === 'running' ? 'block' : 'none' }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ display: status === 'running' ? 'block' : 'none' }}
            />
            {status !== 'running' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                {status === 'loading' ? (
                  <>
                    <Loader className="w-10 h-10 mb-3 animate-spin text-sky-400" />
                    <p className="text-sm text-gray-400">{statusMsg}</p>
                  </>
                ) : status === 'error' ? (
                  <>
                    <AlertCircle className="w-10 h-10 mb-3 text-rose-400" />
                    <p className="text-rose-400 text-sm font-medium">Camera Error</p>
                    <p className="text-gray-500 text-xs mt-1 max-w-xs text-center">{statusMsg}</p>
                  </>
                ) : (
                  <>
                    <Camera className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm opacity-50">Click "Start Camera" to begin</p>
                  </>
                )}
              </div>
            )}
            {status === 'running' && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white text-xs font-medium">LIVE</span>
              </div>
            )}
          </div>

          <div className="mt-4 bg-sky-50 rounded-xl px-4 py-3">
            <p className="text-sky-700 text-xs font-medium">
              {persons.length > 0
                ? `Recognizing against ${persons.length} registered person${persons.length !== 1 ? 's' : ''}. Green box = recognized, Yellow = unknown.`
                : 'No persons registered yet. Go to Register Person to add people.'}
            </p>
          </div>
        </div>

        {/* Recent events */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Recognitions</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {recentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <UserCheck className="w-8 h-8 mb-2" />
                <p className="text-xs">No recognitions yet</p>
              </div>
            ) : (
              recentEvents.map((ev, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-xs">{ev.person.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{ev.person.name}</p>
                    <p className="text-xs text-gray-400">{new Date(ev.log.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-xs text-emerald-600 font-semibold">{Math.round(ev.log.confidence * 100)}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
