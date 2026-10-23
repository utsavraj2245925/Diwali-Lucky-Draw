import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, message, Form, Input, Modal, Typography, Select, Row, Col } from 'antd';
import { Settings, Play, Lock, Unlock } from 'lucide-react';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1';

const EventConfig = () => {
  const [event, setEvent] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      // In a real multi-event system, we'd select an event. Here we assume the first one.
      const response = await axios.get(`${API_BASE}/events/current`); // I need to implement this endpoint
      setEvent(response.data.data);
      fetchRounds();
    } catch (error) {
      message.error('Failed to fetch event configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchRounds = async () => {
    try {
      const response = await axios.get(`${API_BASE}/rounds`); // Need this endpoint
      setRounds(response.data.data);
    } catch (error) {
      console.error('Failed to fetch rounds');
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setStatusLoading(true);
    try {
      await axios.patch(`${API_BASE}/events/${event._id}/status`, { status: newStatus });
      message.success(`Event status updated to ${newStatus}`);
      fetchEvent();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleInitRounds = async () => {
    try {
      await axios.patch(`${API_BASE}/events/${event._id}/initialize-rounds`);
      message.success('Default rounds initialized');
      fetchRounds();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to initialize rounds');
    }
  };

  if (!event) return <div style={{ textAlign: 'center', padding: 50 }}>Loading Event Configuration...</div>;

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="General Settings" bordered={false}>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Event Name:</Typography.Text>
              <div>{event.name}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Current Status:</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Tag color={event.status === 'LIVE' ? 'green' : 'blue'}>{event.status}</Tag>
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <Typography.Text strong>Configuration Lock:</Typography.Text>
              <div style={{ marginTop: 8 }}>
                {event.config.locked ? 
                  <Tag color="red" icon={<Lock size={12} />}>Locked</Tag> : 
                  <Tag color="green" icon={<Unlock size={12} />}>Unlocked</Tag>
                }
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button 
                disabled={event.config.locked || statusLoading} 
                onClick={() => handleStatusUpdate('READY')}
              >
                Set to READY
              </Button>
              <Button 
                type="primary" 
                disabled={event.config.locked || event.status === 'LIVE' || statusLoading} 
                onClick={() => handleStatusUpdate('LIVE')}
              >
                Go LIVE
              </Button>
              <Button 
                danger 
                disabled={statusLoading} 
                onClick={() => handleStatusUpdate('COMPLETED')}
              >
                Mark COMPLETED
              </Button>
            </div>
          </Card>
        </Col>
        
        <Col span={16}>
          <Card 
            title="Round Configuration" 
            extra={
              <Button 
                disabled={event.config.locked} 
                onClick={handleInitRounds}
                icon={<Settings size={16} />}
              >
                Reset Default Rounds
              </Button>
            }
            bordered={false}
          >
            <Table 
              dataSource={rounds} 
              rowKey="_id"
              columns={[
                { title: 'Order', dataIndex: 'order', key: 'order', width: 70 },
                { title: 'Category', dataIndex: 'category', key: 'category' },
                { title: 'Round #', dataIndex: 'roundNumber', key: 'roundNumber', width: 100 },
                { title: 'Prize', dataIndex: 'prize', key: 'prize' },
                { 
                  title: 'Status', 
                  dataIndex: 'status', 
                  key: 'status',
                  render: (s) => (
                    <Tag color={s === 'COMPLETED' ? 'green' : 'orange'}>{s}</Tag>
                  )
                },
              ]} 
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EventConfig;
