export enum RoleEnum {
  CUSTOMER = 'customer',
  SALEMANAGER = 'sale_manager',
  MARKETER = 'marketer',
  DEVELOPER = 'developer',
  FINANCEMANAGER = 'finance_manager',
  MANAGER = 'manager'
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface UserInfo {
  userId: number;
  authToken: string;
  role?: RoleEnum;
  roleName?: string;
  userName?: string;
  fullName?: string;
}

export const ROLE_DISPLAY_NAMES: Record<RoleEnum, string> = {
  [RoleEnum.CUSTOMER]: 'مشتری',
  [RoleEnum.SALEMANAGER]: 'مدیر فروش',
  [RoleEnum.MARKETER]: 'کارشناس فروش',
  [RoleEnum.DEVELOPER]: 'توسعه دهنده',
  [RoleEnum.FINANCEMANAGER]: 'مدیر مالی',
  [RoleEnum.MANAGER]: 'مدیر کل'
};

export const ROLE_COLORS: Record<RoleEnum, string> = {
  [RoleEnum.CUSTOMER]: 'bg-gray-100 text-gray-800',
  [RoleEnum.SALEMANAGER]: 'bg-blue-100 text-blue-800',
  [RoleEnum.MARKETER]: 'bg-green-100 text-green-800',
  [RoleEnum.DEVELOPER]: 'bg-purple-100 text-purple-800',
  [RoleEnum.FINANCEMANAGER]: 'bg-yellow-100 text-yellow-800',
  [RoleEnum.MANAGER]: 'bg-red-100 text-red-800'
};