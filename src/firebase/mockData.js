/**
 * In-memory / LocalStorage fallback data store for testing and preview
 * when live Firebase credentials are not yet configured in environment variables.
 */

const STORAGE_USERS_KEY = 'b1_mock_users';
const STORAGE_CARDS_KEY = 'b1_mock_cards';

const INITIAL_MOCK_USERS = [
  {
    uid: 'mock_admin_1',
    email: 'admin@b1cards.com',
    displayName: 'Admin User',
    role: 'admin',
    status: 'approved',
    requestedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    uid: 'mock_user_1',
    email: 'alex.sales@b1cards.com',
    displayName: 'Alex Sales Rep',
    role: 'user',
    status: 'approved',
    requestedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    uid: 'mock_user_2',
    email: 'sarah.new@b1cards.com',
    displayName: 'Sarah Jenkins',
    role: 'user',
    status: 'pending',
    requestedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const INITIAL_MOCK_CARDS = [
  {
    code: 'B1X901',
    status: 'assigned',
    createdBy: 'mock_admin_1',
    createdByName: 'Admin User',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    url: 'https://maps.app.goo.gl/sample123',
    businessName: 'Apex Dental Care',
    customerName: 'Dr. Michael Vance',
    phone: '+1 (555) 234-5678',
    dateSold: '2026-09-20',
    assignedBy: 'mock_admin_1',
    assignedByName: 'Admin User',
    assignedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    code: 'K3F9X1',
    status: 'assigned',
    createdBy: 'mock_user_1',
    createdByName: 'Alex Sales Rep',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    url: 'https://maps.app.goo.gl/sample456',
    businessName: 'Golden Crust Bakery',
    customerName: 'Elena Rostova',
    phone: '+1 (555) 876-5432',
    dateSold: '2026-09-22',
    assignedBy: 'mock_user_1',
    assignedByName: 'Alex Sales Rep',
    assignedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    code: 'M7P2W8',
    status: 'unassigned',
    createdBy: 'mock_admin_1',
    createdByName: 'Admin User',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    code: 'R4N6Q3',
    status: 'unassigned',
    createdBy: 'mock_user_1',
    createdByName: 'Alex Sales Rep',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    code: 'T9V5K2',
    status: 'unassigned',
    createdBy: 'mock_admin_1',
    createdByName: 'Admin User',
    createdAt: new Date().toISOString(),
  },
];

export function getMockUsers() {
  const data = localStorage.getItem(STORAGE_USERS_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_MOCK_USERS));
    return [...INITIAL_MOCK_USERS];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [...INITIAL_MOCK_USERS];
  }
}

export function saveMockUsers(users) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

export function getMockCards() {
  const data = localStorage.getItem(STORAGE_CARDS_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_CARDS_KEY, JSON.stringify(INITIAL_MOCK_CARDS));
    return [...INITIAL_MOCK_CARDS];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [...INITIAL_MOCK_CARDS];
  }
}

export function saveMockCards(cards) {
  localStorage.setItem(STORAGE_CARDS_KEY, JSON.stringify(cards));
}
