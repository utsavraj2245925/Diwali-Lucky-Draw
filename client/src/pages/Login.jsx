import React from 'react';
import { Card, Button, Input, Form, message } from 'antd';
import { Lock, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, values);
      localStorage.setItem('token', response.data.token);
      message.success('Login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      message.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: '#f0f2f5' 
    }}>
      <Card style={{ width: 400, textAlign: 'center', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            background: '#d4af37', 
            width: 64, 
            height: 64, 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px',
            color: 'white'
          }}>
            <Lock size={32} />
          </div>
          <h2 style={{ margin: 0 }}>Admin Login</h2>
          <p style={{ color: '#8c8c8c' }}>Grand Diwali Lucky Draw</p>
        </div>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item 
            name="username" 
            label="Username" 
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input size="large" placeholder="admin" />
          </Form.Item>
          <Form.Item 
            name="password" 
            label="Password" 
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password size="large" placeholder="••••••••" />
          </Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            size="large" 
            block 
            loading={loading}
            icon={<LogIn size={18} />}
          >
            Sign In
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
