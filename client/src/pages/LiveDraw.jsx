import React, { useState, useEffect } from 'react';
import { Layout, Typography, Row, Col, Card, Spin, Button } from 'antd';
import { Volume2, VolumeX, Maximize } from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';

const { Title, Text } = Typography;
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const LiveDraw = () => {
  const [drawState, setDrawState] = useState({
    event: null,
    currentRound: null,
    winner: null,
    status: 'IDLE' // IDLE, DRAWING, REVEALED
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('draw_started', (data) => {
      setDrawState(prev => ({ ...prev, status: 'DRAWING', currentRound: data.round }));
      if (soundEnabled) playSound('suspense');
    });

    socket.on('winner_revealed', (data) => {
      setDrawState(prev => ({ ...prev, status: 'REVEALED', winner: data.winner }));
      if (soundEnabled) playSound('win');
    });

    // Recovery on load
    const recoverState = async () => {
      try {
        const res = await axios.get(`${API_BASE}/event-summary/current-draw`);
        setDrawState(res.data.data);
      } catch (err) {
        console.error('Recovery failed', err);
      } finally {
        setLoading(false);
      }
    };

    recoverState();

    return () => socket.disconnect();
  }, [soundEnabled]);

  const playSound = (type) => {
    // Placeholder for audio implementation
    console.log(`Playing ${type} sound...`);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>;

  return (
    <div style={{ 
      height: '100vh', 
      background: 'linear-gradient(135deg, #4a0e0e 0%, #000000 100%)', 
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Controls */}
      <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 10 }}>
        <Button 
          type="text" 
          style={{ color: 'white', background: 'rgba(255,255,255,0.1)' }} 
          onClick={() => setSoundEnabled(!soundEnabled)}
          icon={soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        />
        <Button 
          type="text" 
          style={{ color: 'white', background: 'rgba(255,255,255,0.1)' }} 
          onClick={toggleFullscreen}
          icon={<Maximize size={20} />}
        />
      </div>

      <Title level={1} style={{ color: '#d4af37', fontSize: '4rem', marginBottom: 10 }}>
        {drawState.event?.name || 'Grand Diwali Lucky Draw'}
      </Title>
      <Text style={{ fontSize: '1.5rem', color: '#ccc' }}>Celebrating Prosperity & Joy</Text>

      <div style={{ 
        marginTop: 60, 
        padding: 40, 
        border: '4px solid #d4af37', 
        borderRadius: 20, 
        background: 'rgba(0,0,0,0.5)', 
        minWidth: 600,
        boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)'
      }}>
        {drawState.status === 'IDLE' && (
          <div style={{ fontSize: '2rem' }}>Waiting for next round...</div>
        )}

        {drawState.status === 'DRAWING' && (
          <div style={{ fontSize: '2rem', animation: 'pulse 1s infinite' }}>
            <div style={{ color: '#d4af37', fontWeight: 'bold' }}>
              Category: {drawState.currentRound?.category}
            </div>
            <div style={{ fontSize: '3rem', marginTop: 20 }}>Rolling...</div>
          </div>
        )}

        {drawState.status === 'REVEALED' && (
          <div style={{ animation: 'fadeIn 1s ease-in' }}>
            <div style={{ fontSize: '1.5rem', color: '#ccc' }}>WINNER!</div>
            <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#d4af37', margin: '20px 0' }}>
              {drawState.winner?.name}
            </div>
            <div style={{ fontSize: '2rem' }}>
              Prize: {drawState.currentRound?.prize?.name}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default LiveDraw;
