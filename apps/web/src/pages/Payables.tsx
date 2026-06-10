import FinanceRecordsPage from './FinanceRecordsPage';

export default function Payables() {
  return (
    <FinanceRecordsPage
      type="应付"
      title="应付管理"
      partyLabel="供应商/委外商"
      partyPlaceholder="供应商或委外加工商名称"
      amountColor="#cf1322"
      categories={['采购货款', '委外加工费', '运费', '工资', '其他应付']}
    />
  );
}
