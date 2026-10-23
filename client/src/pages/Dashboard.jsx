import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space } from 'antd';
import { 
  Users, 
  Gift, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp 
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1';

const Dashboard = () => {
  const [stats, setStats] = useState({
    employees: 0,
    cardsAssigned: 0,
    prizes: 0,
    roundsCompleted: 0,
    totalRounds: 9
  });
  const [recentWinners, setRecentWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, we'd have a /dashboard/summary endpoint
        // For now, we fetch multiple endpoints or a composite one
        const [empRes, prizeRes, roundRes] = await Promise.all([
          axios.get(`${API_BASE}/import/stats`), // Assuming this exists or will be created
          axios.get(`${API_BASE}/events/prizes`),
          axios.get(`${API_BASE}/draw/status`), // Summary of rounds
        ]);
        
        setStats({
          employees: empRes.data.totalEmployees || 0,
          cardsAssigned: empRes.data.cardsAssigned || 0,
          prizes: prizeRes.data.length || 0,
          roundsCompleted: roundRes.data.completedCount || 0,
          totalRounds: 9
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Employees', value: stats.employees, icon: <Users />, color: '#1890ff' },
    { label: 'Cards Assigned', value: stats.cardsAssigned, icon: <CheckCircle />, color: '#52c41a' },
    { label: 'Prizes Configured', value: stats.prizes, icon: <Gift />, color: '#faad14' },
    { label: 'Rounds Completed', value: stats.roundsCompleted, icon: <TrendingUp />, color: '#722ed1' },
  ];

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Row gutter={[16, 16]}>
        {statCards.map((card, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Statistic 
                title={card.label} 
                value={card.value} 
                prefix={<span style={{ color: card.color }}>{card.icon}</span>} 
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Recent Activity" bordered={false}>
            <Table 
              dataSource={recentWinners} 
              columns={[
                { title: 'Round', dataIndex: 'round', key: 'round' },
                { title: 'Category', dataIndex: 'category', key: 'category' },
                { title: 'Winner', dataIndex: 'winnerName', key: 'winnerName' },
                { title: 'Prize', dataIndex: 'prize', key: 'prize' },
                { 
                  title: 'Status', 
                  dataIndex: 'status', 
                  key: 'status',
                  render: (s) => <Tag color={s === 'COMPLETED' ? 'green' : 'orange'}>{s}</Tag>
                },
              ]} 
            />
            {recentWinners.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <AlertCircle size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                <p style={{ color: '#999' }}>No winners announced yet</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
