import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, message, Form, Input, Modal, Typography } from 'antd';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import axios from 'axios';

const { Title } = Typography;
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1';

const PrizeManagement = () => {
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);
  const [form] = Form.useForm();

  const fetchPrizes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/events/prizes`);
      setPrizes(response.data.data);
    } catch (error) {
      message.error('Failed to fetch prizes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizes();
  }, []);

  const handleSave = async (values) => {
    try {
      if (editingPrize) {
        await axios.patch(`${API_BASE}/events/prizes/${editingPrize._id}`, values);
        message.success('Prize updated');
      } else {
        await axios.post(`${API_BASE}/events/prizes`, values);
        message.success('Prize created');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingPrize(null);
      fetchPrizes();
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prize?')) return;
    try {
      await axios.delete(`${API_BASE}/events/prizes/${id}`);
      message.success('Prize deleted');
      fetchPrizes();
    } catch (error) {
      message.error('Failed to delete prize');
    }
  };

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Card 
        title={<Space><Title level={4} style={{ margin: 0 }}>Prize Inventory</Title></Space>}
        extra={<Button type="primary" icon={<Plus size={16} />} onClick={() => { setEditingPrize(null); form.resetFields(); setIsModalOpen(true); }}>Add Prize</Button>}
      >
        <Table 
          dataSource={prizes} 
          loading={loading}
          rowKey="_id"
          columns={[
            { title: 'Prize Name', dataIndex: 'name', key: 'name' },
            { title: 'Value/Description', dataIndex: 'description', key: 'description' },
            { 
              title: 'Actions', 
              key: 'actions', 
              render: (_, record) => (
                <Space>
                  <Button 
                    type="text" 
                    icon={<Edit size={16} />} 
                    onClick={() => {
                      setEditingPrize(record);
                      form.setFieldsValue(record);
                      setIsModalOpen(true);
                    }} 
                  />
                  <Button 
                    type="text" 
                    danger 
                    icon={<Trash2 size={16} />} 
                    onClick={() => handleDelete(record._id)} 
                  />
                </Space>
              ) 
            },
          ]} 
        />
      </Card>

      <Modal
        title={editingPrize ? 'Edit Prize' : 'Add New Prize'}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Prize Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Premium Smart Watch" />
          </Form.Item>
          <Form.Item name="description" label="Description/Value" rules={[{ required: true }]}>
            <Input.TextArea placeholder="Detailed description or monetary value" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PrizeManagement;
