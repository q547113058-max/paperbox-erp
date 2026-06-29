import React, { useState } from 'react';
import { Upload, Button, message, Image } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import api from '../utils/axios';

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  maxCount?: number;
}

export function ImageUpload({ value, onChange, maxCount = 1 }: ImageUploadProps) {
  const [fileList, setFileList] = useState<UploadFile[]>(
    value ? [{ uid: '-1', name: 'image', status: 'done', url: value }] : []
  );

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    
    // 如果上传成功，获取 URL
    if (newFileList.length > 0 && newFileList[0].status === 'done') {
      const response = newFileList[0].response;
      if (response?.url) {
        onChange?.(response.url);
      }
    } else if (newFileList.length === 0) {
      onChange?.('');
    }
  };

  const customRequest = async ({ file, onSuccess, onError }: any) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess(res.data);
      message.success('上传成功');
    } catch (err: any) {
      onError(err);
      message.error(err.response?.data?.message || '上传失败');
    }
  };

  const handleRemove = () => {
    onChange?.('');
    return true;
  };

  return (
    <div>
      <Upload
        fileList={fileList}
        onChange={handleChange}
        customRequest={customRequest}
        onRemove={handleRemove}
        maxCount={maxCount}
        listType="picture-card"
        accept="image/*"
      >
        {fileList.length < maxCount && (
          <div>
            <UploadOutlined />
            <div style={{ marginTop: 8 }}>上传图片</div>
          </div>
        )}
      </Upload>
      {value && !fileList.length && (
        <Image src={value} width={100} style={{ marginTop: 8 }} />
      )}
    </div>
  );
}
