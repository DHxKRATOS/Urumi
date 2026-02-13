import { STORE_STATUS } from '../../config/constants';

const statusStyles = {
  [STORE_STATUS.PROVISIONING]: 'bg-warning-100 text-warning-700 border-warning-200',
  [STORE_STATUS.READY]: 'bg-success-100 text-success-700 border-success-200',
  [STORE_STATUS.FAILED]: 'bg-danger-100 text-danger-700 border-danger-200',
  [STORE_STATUS.DELETED]: 'bg-gray-100 text-gray-700 border-gray-200',
};

const statusDots = {
  [STORE_STATUS.PROVISIONING]: 'bg-warning-500 animate-pulse',
  [STORE_STATUS.READY]: 'bg-success-500',
  [STORE_STATUS.FAILED]: 'bg-danger-500',
  [STORE_STATUS.DELETED]: 'bg-gray-500',
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles[STORE_STATUS.PROVISIONING];
  const dotStyle = statusDots[status] || statusDots[STORE_STATUS.PROVISIONING];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium
        rounded-full border ${style}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
      {status}
    </span>
  );
}
