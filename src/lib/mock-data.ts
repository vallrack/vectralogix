
export const MOCK_DRIVERS = [
  {
    id: 'dr-001',
    name: 'Alex Rivera',
    currentLocation: { latitude: 40.7128, longitude: -74.0060 },
    vehicleType: 'van',
    isAvailable: true,
    scheduledHoursRemaining: 6,
    performance: 98,
    avatar: 'https://picsum.photos/seed/dr1/100/100'
  },
  {
    id: 'dr-002',
    name: 'Sarah Chen',
    currentLocation: { latitude: 40.7306, longitude: -73.9352 },
    vehicleType: 'car',
    isAvailable: true,
    scheduledHoursRemaining: 4.5,
    performance: 95,
    avatar: 'https://picsum.photos/seed/dr2/100/100'
  },
  {
    id: 'dr-003',
    name: 'Marcus Thorne',
    currentLocation: { latitude: 40.7589, longitude: -73.9851 },
    vehicleType: 'truck',
    isAvailable: false,
    scheduledHoursRemaining: 2,
    performance: 92,
    avatar: 'https://picsum.photos/seed/dr3/100/100'
  },
  {
    id: 'dr-004',
    name: 'Elena Vance',
    currentLocation: { latitude: 40.6782, longitude: -73.9442 },
    vehicleType: 'motorcycle',
    isAvailable: true,
    scheduledHoursRemaining: 7,
    performance: 99,
    avatar: 'https://picsum.photos/seed/dr4/100/100'
  }
];

export const MOCK_LOCATIONS = [
  { id: 'loc-1', address: 'Madison Square Garden, NY', lat: 40.7505, lng: -73.9934 },
  { id: 'loc-2', address: 'Empire State Building, NY', lat: 40.7484, lng: -73.9857 },
  { id: 'loc-3', address: 'Central Park Zoo, NY', lat: 40.7678, lng: -73.9718 },
  { id: 'loc-4', address: 'Brooklyn Bridge, NY', lat: 40.7061, lng: -73.9969 },
  { id: 'loc-5', address: 'Times Square, NY', lat: 40.7580, lng: -73.9855 },
];

export const MOCK_STATS = [
  { name: 'Mon', active: 45, completed: 340 },
  { name: 'Tue', active: 52, completed: 310 },
  { name: 'Wed', active: 48, completed: 390 },
  { name: 'Thu', active: 61, completed: 420 },
  { name: 'Fri', active: 55, completed: 380 },
  { name: 'Sat', active: 40, completed: 250 },
  { name: 'Sun', active: 35, completed: 180 },
];
