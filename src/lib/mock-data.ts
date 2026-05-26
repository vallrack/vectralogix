
export const MOCK_DRIVERS = [
  {
    id: 'dr-001',
    name: 'Carlos Rodríguez',
    currentLocation: { latitude: 4.6097, longitude: -74.0817 }, // Bogotá
    vehicleType: 'van',
    isAvailable: true,
    scheduledHoursRemaining: 6,
    performance: 98,
    avatar: 'https://picsum.photos/seed/dr1/100/100'
  },
  {
    id: 'dr-002',
    name: 'Andrés Giraldo',
    currentLocation: { latitude: 6.2442, longitude: -75.5812 }, // Medellín
    vehicleType: 'car',
    isAvailable: true,
    scheduledHoursRemaining: 4.5,
    performance: 95,
    avatar: 'https://picsum.photos/seed/dr2/100/100'
  },
  {
    id: 'dr-003',
    name: 'Luis Martínez',
    currentLocation: { latitude: 3.4516, longitude: -76.5320 }, // Cali
    vehicleType: 'truck',
    isAvailable: false,
    scheduledHoursRemaining: 2,
    performance: 92,
    avatar: 'https://picsum.photos/seed/dr3/100/100'
  },
  {
    id: 'dr-004',
    name: 'Mariana Duque',
    currentLocation: { latitude: 10.9639, longitude: -74.7964 }, // Barranquilla
    vehicleType: 'motorcycle',
    isAvailable: true,
    scheduledHoursRemaining: 7,
    performance: 99,
    avatar: 'https://picsum.photos/seed/dr4/100/100'
  }
];

export const MOCK_LOCATIONS = [
  { id: 'loc-1', address: 'Plaza de Bolívar, Bogotá', lat: 4.5981, lng: -74.0760 },
  { id: 'loc-2', address: 'Parque Lleras, Medellín', lat: 6.2091, lng: -75.5677 },
  { id: 'loc-3', address: 'Torre de Cali, Cali', lat: 3.4578, lng: -76.5298 },
  { id: 'loc-4', address: 'Castillo San Felipe, Cartagena', lat: 10.4226, lng: -75.5403 },
  { id: 'loc-5', address: 'Ventana al Mundo, Barranquilla', lat: 11.0201, lng: -74.8300 },
];

export const MOCK_STATS = [
  { name: 'Lun', active: 45, completed: 340 },
  { name: 'Mar', active: 52, completed: 310 },
  { name: 'Mie', active: 48, completed: 390 },
  { name: 'Jue', active: 61, completed: 420 },
  { name: 'Vie', active: 55, completed: 380 },
  { name: 'Sab', active: 40, completed: 250 },
  { name: 'Dom', active: 35, completed: 180 },
];
