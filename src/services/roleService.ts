import { RoleEnum, UserRole, Role } from '../types/roles';

class RoleService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://alami-b2b-api.liara.run/api';

  async getUserRole(userId: number, token: string): Promise<RoleEnum> {
    try {
      console.log('Getting user role for userId:', userId);
      
      // Get user role data directly
      const userRoleResponse = await fetch(`${this.baseUrl}/manager-user/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      console.log('Response status:', userRoleResponse.status);
      
      if (!userRoleResponse.ok) {
        // If no role found, default to customer
        console.log('Response not OK, defaulting to customer');
        return RoleEnum.CUSTOMER;
      }

      const userRoleData = await userRoleResponse.json();
      console.log('Full API response:', JSON.stringify(userRoleData, null, 2));
      
      // Check different possible response structures
      let roleData = null;
      
      if (userRoleData.data?.data) {
        // If data.data exists, check if it's an array or object
        if (Array.isArray(userRoleData.data.data)) {
          roleData = userRoleData.data.data[0]; // First item if array
        } else {
          roleData = userRoleData.data.data; // Direct object
        }
      }
      
      console.log('Extracted role data:', roleData);
      
      if (!roleData || !roleData.role) {
        console.log('No role data found, defaulting to customer');
        return RoleEnum.CUSTOMER;
      }

      const roleName = roleData.role.name;
      console.log('Role name from API:', roleName);

      // Map role name to enum
      let mappedRole;
      switch (roleName) {
        case 'sale_manager':
          mappedRole = RoleEnum.SALEMANAGER;
          break;
        case 'marketer':
          mappedRole = RoleEnum.MARKETER;
          break;
        case 'developer':
          mappedRole = RoleEnum.DEVELOPER;
          break;
        case 'finance_manager':
          mappedRole = RoleEnum.FINANCEMANAGER;
          break;
        case 'manager':
          mappedRole = RoleEnum.MANAGER;
          break;
        default:
          mappedRole = RoleEnum.CUSTOMER;
      }
      
      console.log('Mapped role:', mappedRole);
      return mappedRole;
      
    } catch (error) {
      console.error('Error fetching user role:', error);
      return RoleEnum.CUSTOMER;
    }
  }

  hasAccessToMenu(role: RoleEnum, menuItem: string): boolean {
    // Only manager and developer have access to all menus
    if (role === RoleEnum.MANAGER || role === RoleEnum.DEVELOPER || role === RoleEnum.SALEMANAGER) {
      return true;
    }

    // Customer has no access to any menu
    if (role === RoleEnum.CUSTOMER) {
      return false;
    }

    // Configuration menu is only for manager and developer
    if (menuItem === 'configuration' || menuItem === 'employees' || menuItem === 'tags') {
      return false;
    }

    // All other business roles have access to other menus
    return true;
  }
}

export default new RoleService();