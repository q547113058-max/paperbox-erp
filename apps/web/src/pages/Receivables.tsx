import FinanceRecordsPage from './FinanceRecordsPage';

export default function Receivables() {
  return (
    <FinanceRecordsPage
      type="应收"
      title="应收管理"
      partyLabel="客户"
      partyPlaceholder="客户名称"
      amountColor="#1677ff"
      categories={['销售货款', '加工费', '运费', '其他应收']}
    />
  );
}
