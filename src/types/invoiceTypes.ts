export enum FactorStatus {
  CREATED = 'created', // ایجاد شده
  APPROVED_BY_MANAGER = 'approved_by_manager', // تایید شده توسط مدیر
  APPROVED_BY_FINANCE = 'approved_by_finance', // تایید شده توسط مالی
  CANCELED = 'canceled', // لغو شده
  DELETED = 'deleted' // حذف شده
}

export enum PaymentMethod {
  CASH = 'cash', // نقدی
  CHEQUE = 'cheque' // چک
}

export const FACTOR_STATUS_DISPLAY_NAMES: Record<FactorStatus, string> = {
  [FactorStatus.CREATED]: 'ایجاد شده',
  [FactorStatus.APPROVED_BY_MANAGER]: 'تایید شده توسط مدیر',
  [FactorStatus.APPROVED_BY_FINANCE]: 'تایید شده توسط مالی',
  [FactorStatus.CANCELED]: 'لغو شده',
  [FactorStatus.DELETED]: 'حذف شده'
};

export const FACTOR_STATUS_COLORS: Record<FactorStatus, string> = {
  [FactorStatus.CREATED]: 'bg-blue-100 text-blue-800',
  [FactorStatus.APPROVED_BY_MANAGER]: 'bg-yellow-100 text-yellow-800',
  [FactorStatus.APPROVED_BY_FINANCE]: 'bg-green-100 text-green-800',
  [FactorStatus.CANCELED]: 'bg-red-100 text-red-800',
  [FactorStatus.DELETED]: 'bg-gray-100 text-gray-800'
};

export const PAYMENT_METHOD_DISPLAY_NAMES: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'نقدی',
  [PaymentMethod.CHEQUE]: 'چک'
};

export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'bg-green-100 text-green-800',
  [PaymentMethod.CHEQUE]: 'bg-purple-100 text-purple-800'
};