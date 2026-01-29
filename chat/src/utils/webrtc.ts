export class WebRTCService {
    public peerConnection: RTCPeerConnection | null = null;
    public localStream: MediaStream | null = null;
    public remoteStream: MediaStream | null = null;
    public onRemoteStream?: (stream: MediaStream) => void;
    public onIceCandidate?: (candidate: RTCIceCandidate) => void;

    private config: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, // Free STUN server
            // Turn servers would be needed for production behind symmetric NATs
        ]
    };

    constructor() { }

    async initialize(localStream: MediaStream) {
        this.localStream = localStream;
        this.peerConnection = new RTCPeerConnection(this.config);

        // Add local tracks to peer connection
        this.localStream.getTracks().forEach(track => {
            this.peerConnection?.addTrack(track, this.localStream!);
        });

        // Handle remote tracks
        this.peerConnection.ontrack = (event) => {
            console.log('WebRTC: Remote track received', event.streams[0]);
            this.remoteStream = event.streams[0];
            if (this.onRemoteStream) {
                this.onRemoteStream(event.streams[0]);
            }
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.onIceCandidate) {
                this.onIceCandidate(event.candidate);
            }
        };
    }

    async createOffer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) throw new Error('PeerConnection not initialized');
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        return offer;
    }

    async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) throw new Error('PeerConnection not initialized');
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }

    async setRemoteDescription(ans: RTCSessionDescriptionInit) {
        if (!this.peerConnection) throw new Error('PeerConnection not initialized');
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(ans));
    }

    async addIceCandidate(candidate: RTCIceCandidateInit) {
        if (!this.peerConnection) return;
        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('Error adding ICE candidate', e);
        }
    }

    close() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.localStream = null;
        this.remoteStream = null;
    }
}

export const webRTC = new WebRTCService();
