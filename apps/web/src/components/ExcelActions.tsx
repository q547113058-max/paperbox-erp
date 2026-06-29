import React from 'react';
import { Button, Space, message } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import api from '../utils/axios';

interface ExcelActionsProps {
  entity: 'products' | 'customers' | 'orders';
  onImport?: (data: any[]) => void;
}

export function ExcelActions({ entity, onImport }: ExcelActionsProps) {
  const handleExport = async () => {
    try {
      const response = await api.get(`/excel/${entity}/export`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${entity}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('导出成功');
    } catch (err: any) {
      message.error(err.response?.data?.message || '导出失败');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/excel/${entity}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const result = response.data;
      message.success(`导入成功: ${result.success} 条`);
      
      if (result.errors?.length > 0) {
        message.warning(`导入错误: ${result.errors.length} 条`);
      }
      
      onImport?.(result);
    } catch (err: any) {
      message.error(err.response?.data?.message || '导入失败');
    }
    
    event.target.value = '';
  };

  return (
    <Space>
      <Button icon={<DownloadOutlined />} onClick={handleExport}>
        导出 Excel
      </Button>
      <label>
        <input
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
        <Button icon={<UploadOutlined />}>
          导入 Excel
        </Button>
      </label>
    </Space>
  );
}
