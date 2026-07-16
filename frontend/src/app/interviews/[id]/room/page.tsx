"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Loader, useToast } from "@/components/ui";
import { apiClient } from "@/lib/api";
import { WS_BASE_URL } from "@/lib/env";
import { useAuth } from "@/lib/auth";

type ParticipantRole = "interviewer" | "candidate";

interface InterviewRoom {
  id: string;
  title: string;
  role: string;
  technologies: string[];
  status: "in-progress" | "completed";
}

interface SignalMessage {
  type: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  participantName?: string;
  message?: string;
}

interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  own: boolean;
}

export default function InterviewRoomPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [interview, setInterview] = useState<InterviewRoom | null>(null);
  const [participantRole, setParticipantRole] = useState<ParticipantRole>("candidate");
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [remoteName, setRemoteName] = useState("Waiting for the other participant");
  const [chatMessage, setChatMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    apiClient<{ success: boolean; data: { interview: InterviewRoom } }>(`/interviews/${params.id}`)
      .then((response) => setInterview(response.data.interview))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to load interview room"))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, params.id, router, user]);

  useEffect(() => {
    if (isJoined && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [isJoined]);

  useEffect(() => () => cleanupCall(), []);

  function sendSignal(message: object) {
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify(message));
  }

  function createPeerConnection() {
    if (peerRef.current) return peerRef.current;
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    localStreamRef.current?.getTracks().forEach((track) => peer.addTrack(track, localStreamRef.current as MediaStream));
    peer.onicecandidate = (event) => { if (event.candidate) sendSignal({ type: "ice-candidate", candidate: event.candidate }); };
    peer.ontrack = (event) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0]; };
    peer.onconnectionstatechange = () => { if (["failed", "disconnected"].includes(peer.connectionState)) setError("The other participant disconnected."); };
    peerRef.current = peer;
    return peer;
  }

  async function createOffer() {
    const peer = createPeerConnection();
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    sendSignal({ type: "offer", offer });
  }

  async function handleSignal(message: SignalMessage) {
    if (message.participantName) setRemoteName(message.participantName);
    if (message.type === "peer-joined") {
      await createOffer();
      return;
    }
    if (message.type === "peer-left") {
      setRemoteName("Waiting for the other participant");
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      peerRef.current?.close();
      peerRef.current = null;
      return;
    }
    if (message.type === "offer" && message.offer) {
      const peer = createPeerConnection();
      await peer.setRemoteDescription(message.offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      sendSignal({ type: "answer", answer });
      return;
    }
    if (message.type === "answer" && message.answer && peerRef.current) {
      await peerRef.current.setRemoteDescription(message.answer);
      return;
    }
    if (message.type === "ice-candidate" && message.candidate && peerRef.current) {
      await peerRef.current.addIceCandidate(message.candidate);
      return;
    }
    if (message.type === "chat" && message.message) {
      setChat((current) => [...current, { id: Date.now(), sender: message.participantName ?? "Participant", text: message.message as string, own: false }]);
    }
  }

  async function joinCall() {
    if (!interview || !token) return;
    setIsConnecting(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const socket = new WebSocket(`${WS_BASE_URL}/signaling?roomId=${encodeURIComponent(interview.id)}&token=${encodeURIComponent(token)}`);
      socketRef.current = socket;
      socket.onopen = () => { setIsJoined(true); setIsConnecting(false); };
      socket.onmessage = (event) => { void handleSignal(JSON.parse(event.data as string) as SignalMessage); };
      socket.onerror = () => { setError("Unable to connect to the interview room."); setIsConnecting(false); };
      socket.onclose = () => setIsJoined(false);
    } catch (joinError) {
      setIsConnecting(false);
      setError(joinError instanceof Error && joinError.name === "NotAllowedError" ? "Camera and microphone permission is required to join." : "Unable to access your camera and microphone.");
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Interview link copied to clipboard!");
  }

  function cleanupCall() {
    socketRef.current?.close();
    peerRef.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    socketRef.current = null;
    peerRef.current = null;
    localStreamRef.current = null;
  }

  function toggleCamera() {
    const enabled = !isCameraOn;
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = enabled; });
    setIsCameraOn(enabled);
  }

  function toggleMic() {
    const enabled = !isMicOn;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = enabled; });
    setIsMicOn(enabled);
  }

  function sendChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = chatMessage.trim();
    if (!message) return;
    sendSignal({ type: "chat", message });
    setChat((current) => [...current, { id: Date.now(), sender: "You", text: message, own: true }]);
    setChatMessage("");
  }

  async function endInterview() {
    if (!interview) return;
    try {
      await apiClient<{ success: boolean }>(`/interviews/${interview.id}/end`, { method: "POST" });
      cleanupCall();
      toast.success("Interview ended");
      router.push("/interviews");
    } catch (endError) {
      toast.error(endError instanceof Error ? endError.message : "Unable to end interview");
    }
  }

  if (isAuthLoading || isLoading) return <div className="flex justify-center py-16"><Loader size="lg" /></div>;
  if (error && !interview) return <Card><CardContent><p className="text-sm text-error">{error}</p></CardContent></Card>;
  if (!interview) return null;

  if (!isJoined) return <div className="mx-auto max-w-xl space-y-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-primary">Live interview room</p><h2 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{interview.title}</h2><p className="mt-2 text-sm text-muted">Join as an interviewer or candidate. Questions will be asked verbally during the call.</p></div>{participantRole === "interviewer" && <Button variant="secondary" onClick={copyLink}>Copy Link</Button>}</div><Card><CardHeader><CardTitle>Join interview</CardTitle><CardDescription>Allow camera and microphone access when your browser asks.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="flex w-full flex-col gap-1.5"><label htmlFor="participant-role" className="text-sm font-medium text-foreground">I am joining as</label><select id="participant-role" value={participantRole} onChange={(event) => setParticipantRole(event.target.value as ParticipantRole)} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/50"><option value="candidate">Candidate</option><option value="interviewer">Interviewer</option></select></div>{error && <p className="text-sm text-error">{error}</p>}<Button fullWidth size="lg" onClick={() => void joinCall()} isLoading={isConnecting}>Join video interview</Button></CardContent></Card></div>;

  return <div className="mx-auto max-w-7xl space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm font-medium text-primary">{participantRole === "interviewer" ? "Interviewer" : "Candidate"} · Live room</p><h2 className="mt-1 text-2xl font-bold text-foreground">{interview.title}</h2><p className="mt-1 text-sm text-muted">{remoteName}</p></div><div className="flex gap-3">{participantRole === "interviewer" && <Button variant="secondary" onClick={copyLink}>Copy Link</Button>}<Button variant="danger" onClick={() => void endInterview()}>End interview</Button></div></div>{error && <p className="text-sm text-error">{error}</p>}<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><Card padding="none" className="overflow-hidden"><div className="grid min-h-[28rem] gap-2 bg-black p-2 sm:grid-cols-2"><div className="relative min-h-64 overflow-hidden rounded-lg bg-surface"><video ref={remoteVideoRef} autoPlay playsInline className="h-full min-h-64 w-full object-cover" /><span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white">{remoteName}</span></div><div className="relative min-h-64 overflow-hidden rounded-lg bg-surface"><video ref={localVideoRef} autoPlay muted playsInline className={`h-full min-h-64 w-full object-cover ${isCameraOn ? "" : "opacity-0"}`} /><div className="absolute inset-0 flex items-center justify-center text-4xl font-semibold text-primary">{!isCameraOn && user?.name.slice(0, 1).toUpperCase()}</div><span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white">You · {participantRole}</span></div></div><div className="flex items-center justify-center gap-3 border-t border-border bg-surface p-4"><Button variant={isMicOn ? "secondary" : "danger"} onClick={toggleMic}>{isMicOn ? "Mute microphone" : "Unmute microphone"}</Button><Button variant={isCameraOn ? "secondary" : "danger"} onClick={toggleCamera}>{isCameraOn ? "Turn camera off" : "Turn camera on"}</Button></div></Card><Card padding="none" className="flex min-h-[28rem] flex-col"><CardHeader className="mb-0 border-b border-border px-4 py-4"><CardTitle className="text-base">Chat</CardTitle><CardDescription>Private room chat</CardDescription></CardHeader><CardContent className="flex flex-1 flex-col p-0"><div className="flex-1 space-y-3 overflow-y-auto p-4">{chat.length === 0 ? <p className="text-center text-sm text-muted">No messages yet.</p> : chat.map((message) => <div key={message.id} className={`flex ${message.own ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${message.own ? "bg-primary text-primary-foreground" : "bg-surface-hover text-foreground"}`}><p className="mb-1 text-[10px] font-medium opacity-70">{message.sender}</p>{message.text}</div></div>)}</div><form onSubmit={sendChat} className="flex gap-2 border-t border-border p-3"><Input aria-label="Chat message" placeholder="Type a message..." value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} /><Button type="submit" size="sm">Send</Button></form></CardContent></Card></div></div>;
}
