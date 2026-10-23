import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Input, Modal, Form, Select, Typography, Tag, message } from 'antd';
import { Search, CreditCard, Ban, RotateCcw } from 'lucide-react';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1';

const CardManagement = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/cards`);
      setCards(res.data.data);
    } catch (err) {
      message.error('Failed to fetch cards');
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (id, currentStatus) => {
    try {
      await axios.patch(`${API_BASE}/cards/${id}`, { blocked: !currentStatus });
      message.success(`Card ${currentStatus ? 'unblocked' : 'blocked'}`);
      fetchCards();
    } catch (err) {
      message.error('Operation failed');
    }
  };

  const handleReassign = async (values) => {
    try {
      await axios.patch(`${API_BASE}/cards/${activeCard._id}`, { employeeId: values.employeeId });
      message.success('Card reassigned');
      setIsModalOpen(false);
      fetchCards();
    } catch (err) {
      message.error('Reassignment failed');
    }
  };

  const filteredCards = cards.filter(c =>
    c.cardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Card title="Card Inventory & Assignment" bordered={false}>
        <Space style={{ marginBottom: 24 }}>
          <Input
            prefix={<Search size={16} />}
            placeholder="Search card or employee..."
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
          />
          <Button icon={<RotateCcw size={16} />} onClick={fetchCards}>Refresh</Button>
        </Space>

        <Table
          dataSource={filteredCards}
          loading={loading}
          rowKey="_id"
          columns={[
            { title: 'Card Number', dataIndex: 'cardNumber', key: 'cardNumber' },
            { title: 'Employee', dataIndex: ['employee', 'name'], key: 'employeeName' },
            {
              title: 'Status',
              key: 'status',
              render: (_, record) => (
                <Tag color={record.blocked ? 'red' : 'green'}>
                  {record.blocked ? 'Blocked' : 'Active'}
                </Tag>
              )
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button
                    type="text"
                    icon={<RotateCcw size={16} />}
                    onClick={() => { setActiveCard(record); setIsModalOpen(true); }}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<Ban size={16} />}
                    onClick={() => toggleBlock(record._id, record.blocked)}
                  />
                </Space>
              )
            },
          ]}
        />
      </Card>

      <Modal
        title="Reassign Card"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleReassign}>
          <Form.Item name="employeeId" label="Select Employee" rules={[{ required: true }]}>
            <Select placeholder="Search employee...">
              {/* In real app, we'd have a searchable employee dropdown */}
              <Option value="emp123">John Doe</Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Confirm Reassignment</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default CardManagement;
