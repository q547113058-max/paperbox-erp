import React from 'react';
import { Result, Button, Typography } from 'antd';

const { Paragraph, Text } = Typography;

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

/**
 * 全局 ErrorBoundary — 捕获子组件渲染时未处理的 React 错误
 * - 默认覆盖整页（出现在 /login 之外）
 * - 显示友好错误页 + "返回首页" / "刷新" / "复制错误详情" 操作
 * - 不替换 AntD 的 Form/Table 内部错误处理（那些走 message.error 即可）
 *
 * 用法：包在 <App /> 外层（main.tsx 已包）即可，无需每页套
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 控制台输出，dev 环境可见
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught:', error, info?.componentStack);
    this.setState({ componentStack: info?.componentStack || null });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, componentStack: null });
  };

  handleCopy = () => {
    const { error, componentStack } = this.state;
    const text = `Error: ${error?.message}\n\n${componentStack || ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} onCopy={this.handleCopy} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onReset, onCopy }: { error: Error | null; onReset: () => void; onCopy: () => void }) {
  const handleHome = () => {
    onReset();
    window.location.href = '/';
  };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: 24 }}>
      <Result
        status="error"
        title="页面出错了"
        subTitle="抱歉，页面发生了未预期的错误。你可以刷新重试，或返回首页。"
        extra={[
          <Button type="primary" key="home" onClick={handleHome}>
            返回首页
          </Button>,
          <Button key="reload" onClick={() => window.location.reload()}>
            刷新页面
          </Button>,
          <Button key="copy" onClick={onCopy}>
            复制错误详情
          </Button>,
        ]}
      >
        {error && (
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'left' }}>
            <Paragraph>
              <Text strong>错误信息：</Text>
              <Text code copyable>{error.message}</Text>
            </Paragraph>
            <Paragraph>
              <Text type="secondary" style={{ fontSize: 12 }}>
                如持续出现，请联系管理员。开发环境下可在控制台查看完整堆栈。
              </Text>
            </Paragraph>
          </div>
        )}
      </Result>
    </div>
  );
}
