import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Upload, message, Modal, Form, Input, Select, Row, Col, Spin, Tag, Statistic } from 'antd';
import { Upload as UploadIcon, Search, Filter, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1';

const EmployeeImport = () => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [category, setCategory] = useState('Company Worker');

  const handleUpload = async (info) => {
    const uploadedFile = info.file;
    setFile(uploadedFile);
    
    // In a real app, we'd send the file to the server for preview
    // For this implementation, we assume the server has a /import/preview endpoint
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      const res = await axios.post(`${API_BASE}/import/preview`, formData);
      setPreviewData(res.data.data);
    } catch (err) {
      message.error('Failed to preview file');
    }
  };

  const confirmImport = async () => {
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      
      const res = await axios.post(`${API_BASE}/import/confirm`, formData);
      setImportResults(res.data.data);
      message.success('Import completed successfully');
    } catch (err) {
      message.error('Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Card title="Employee Bulk Import" bordered={false}>
        <Row gutter={24}>
          <Col span={8}>
            <Form layout="vertical">
              <Form.Item label="Step 1: Upload File">
                <Upload
                  beforeUpload={() => false}
                  onChange={handleUpload}
                  showUploadList={false}
                >
                  <Button icon={<UploadIcon size={16} />} block>Select Excel/CSV</Button>
                </Upload>
              </Form.Item>
              <Form.Item label="Step 2: Assign Category">
                <Select value={category} onChange={setCategory} style={{ width: '100%' }}>
                  <Option value="Manager">Manager</Option>
                  <Option value="Company Staff">Company Staff</Option>
                  <Option value="Company Worker">Company Worker</Option>
                </Select>
              </Form.Item>
              <Button 
                type="primary" 
                block 
                disabled={!file || isImporting} 
                onClick={confirmImport}
                loading={isImporting}
              >
                Confirm Import
              </Button>
            </Form>
          </Col>
          
          <Col span={16}>
            <Title level={5}>Preview & Validation</Title>
            <Table 
              dataSource={previewData} 
              pagination={{ pageSize: 10 }}
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { 
                  title: 'Status', 
                  key: 'status', 
                  render: (_, record) => record.valid ? 
                    <Tag color="green"><CheckCircle size={12} /> Valid</Tag> : 
                    <Tag color="red"><XCircle size={12} /> Error: {record.error}</Tag>
                },
              ]} 
            />
          </Col>
        </Row>
      </Card>

      {importResults && (
        <Card style={{ marginTop: 24 }} title="Import Results" bordered={false}>
          <Row gutter={16}>
            <Col span={6}><Statistic title="Total Rows" value={importResults.total} /></Col>
            <Col span={6}><Statistic title="Success" value={importResults.success} valueStyle={{ color: 'green' }} /></Col>
            <Col span={6}><Statistic title="Failed" value={importResults.failed} valueStyle={{ color: 'red' }} /></Col>
            <Col span={6}><Statistic title="Duplicates" value={importResults.duplicates} /></Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default EmployeeImport;
